import { onOrderInit } from "../../../utils/protocolApis/index.js";
import { PROTOCOL_CONTEXT } from "../../../utils/constants.js";
import { addOrUpdateOrderWithTransactionId, getOrderByTransactionId,getOrderByTransactionIdAndProvider,addOrUpdateOrderWithTransactionIdAndProvider } from "../db/dbService.js";

import BppInitService from "./bppInit.service.js";
import ContextFactory from "../../../factories/ContextFactory.js";

const bppInitService = new BppInitService();

class InitOrderService {

    /**
     * 
     * @param {Array} items 
     * @returns Boolean
     */
    areMultipleBppItemsSelected(items) {
        return items ? [...new Set(items.map(item => item.bpp_id))].length > 1 : false;
    }

    /**
     * 
     * @param {Array} items 
     * @returns Boolean
     */
    areMultipleProviderItemsSelected(items) {
        return items ? [...new Set(items.map(item => item.provider.id))].length > 1 : false;
    }

    /**
     * create order in db
     * @param {Object} response 
     * @param {String} userId
     * @param {String} parentOrderId
     */
    async createOrder(response, userId = null, orderRequest) {
        if (response) {
            const provider = orderRequest?.items?.[0]?.provider || {};

            const providerDetails = {
                id: provider.id,
                locations: provider?.locations?.map(location => {
                    return { id: location };
                })
            };


            console.log("orderRequest---------name------->",orderRequest?.delivery_info?.name)
            console.log("orderRequest-----------delivery_info----->",orderRequest?.delivery_info)
            const fulfillment = {
                end: {
                    contact: {
                        email: orderRequest?.delivery_info?.email,
                        phone: orderRequest?.delivery_info?.phone
                    },
                    location: {
                        ...orderRequest?.delivery_info?.location,
                        address: {
                            ...orderRequest?.delivery_info?.location?.address,
                            name: orderRequest?.delivery_info?.name
                        }
                    },
                },
                type: orderRequest?.delivery_info?.type,
                customer: {
                    person: {
                        name: orderRequest?.delivery_info?.name
                    }
                },
                provider_id: provider?.id
            };

            let itemProducts = []
            for(const item of orderRequest?.items){
                let itemObj =
                {
                    id: item?.id?.toString(),
                    product: item?.product,
                    quantity: item.quantity,
                    fulfillment_id:item?.fulfillment_id,
                    tags:item.tags
                }
                itemProducts.push(itemObj);
            }

            console.log('itemProducts--------------->',itemProducts);
            // console.log('itemProducts--------response?.context?.bpp_id------->',response?.context?.bpp_id);
            console.log('itemProducts--------response?.context?.bpp_id------->',fulfillment);

            await addOrUpdateOrderWithTransactionIdAndProvider(
                response.context.transaction_id,provider.id,
                {
                    userId: userId,
                    messageId: response?.context?.message_id,
                    transactionId: response?.context?.transaction_id,
                    parentOrderId: response?.context?.parent_order_id,
                    bppId: response?.context?.bpp_id,
                    bpp_uri: response?.context?.bpp_uri,
                    fulfillments: [ fulfillment ],
                    provider: { ...providerDetails },
                    items:itemProducts ,
                }
            );
        }
    }

    /**
     * update order in the db
     * @param {Object} response 
     * @param {Object} dbResponse
     */
    async updateOrder(response, dbResponse) {

        //console.log("update order-------------------->",dbResponse);
        //console.log("update order-----------response--------->",response);
        // console.log("update order-----------response--------->",orderSchema.fulfillment);
        if (response?.message?.order && dbResponse) {
            dbResponse = dbResponse?.toJSON();

            let orderSchema = { ...response.message.order };

            console.log("update order-----------fulfillment--------->",orderSchema.fulfillment);

            orderSchema.items = dbResponse?.items.map(item => {
                return {
                    id: item?.id?.toString(),
                    quantity: item.quantity,
                    product: item.product,
                    fulfillment_id:item?.fulfillment_id,
                    tags:item.tags
                };
            }) || [];

            orderSchema.provider = {
                id: orderSchema?.provider?.id,
                locations: orderSchema?.provider_location ?
                    orderSchema?.provider_location :
                    dbResponse?.provider?.locations ?
                        dbResponse?.provider?.locations :
                        [],
            };

            orderSchema.settlementDetails = orderSchema.payment
            orderSchema.billing = {
                ...orderSchema?.billing,
                address: {
                    ...orderSchema?.billing.address,
                    areaCode: orderSchema?.billing?.address?.area_code
                }
            };

            if(orderSchema.fulfillment) {
                orderSchema.fulfillments = [orderSchema.fulfillment];
                delete orderSchema.fulfillment;
            }


            console.log("update order----------orderSchema?.billing--------->",orderSchema?.billing);
            console.log("update order----------orderSchema?.billing---quote------>",orderSchema?.quote);
            console.log("update order----------orderSchema?.billing--response -quote------>",dbResponse?.quote);

            dbResponse.quote = orderSchema.quote

            if (orderSchema.fulfillments && orderSchema.fulfillments.length) {
                orderSchema.fulfillments = [...orderSchema?.fulfillments].map((fulfillment)=> {
                    return {
                    ...fulfillment,
                    end: {
                        ...fulfillment?.end,
                        location: {
                            ...fulfillment?.end?.location,
                            address: {
                                ...fulfillment?.end?.location?.address,
                                areaCode: fulfillment?.end?.location?.address?.area_code
                            }
                        }
                    },
                        customer:dbResponse?.fulfillments[0]?.customer
                }});
            }

            await addOrUpdateOrderWithTransactionIdAndProvider(
                response?.context?.transaction_id,dbResponse.provider.id,
                { ...orderSchema }
            );
        }
    }

    /**
    * init order
    * @param {Object} orderRequest
    * @param {Boolean} isMultiSellerRequest
    */
    async initOrder(orderRequest, isMultiSellerRequest = false) {
        try {
            const { context: requestContext = {}, message: order = {} } = orderRequest || {};
            const parentOrderId = requestContext?.transaction_id; //FIXME: verify usage

            const contextFactory = new ContextFactory();
            const context = contextFactory.create({
                action: PROTOCOL_CONTEXT.INIT,
                bppId: order?.items[0]?.bpp_id,
                bpp_uri: order?.items[0]?.bpp_uri,
                city:requestContext.city,
                state:requestContext.state,
                transactionId: requestContext?.transaction_id
                // ...(!isMultiSellerRequest && { transactionId: requestContext?.transaction_id })
            });

            if (!(order?.items?.length)) {
                return {
                    context,
                    error: { message: "Empty order received" }
                };
            }
            else if (this.areMultipleBppItemsSelected(order?.items)) {
                return {
                    context,
                    error: { message: "More than one BPP's item(s) selected/initialized" }
                };
            }
            else if (this.areMultipleProviderItemsSelected(order?.items)) {
                return {
                    context,
                    error: { message: "More than one Provider's item(s) selected/initialized" }
                };
            }

            const bppResponse = await bppInitService.init(
                context,
                order,
                parentOrderId
            );

            return bppResponse;
        }
        catch (err) {
            throw err;
        }
    }

    /**
     * init multiple orders
     * @param {Array} orders 
     * @param {Object} user
     */
    async initMultipleOrder(orders, user) {

        const initOrderResponse = await Promise.all(
            orders.map(async order => {
                try {
                    const bppResponse = await this.initOrder(order, orders.length > 1);
                    await this.createOrder(bppResponse, user?.decodedToken?.uid, order?.message);

                    return bppResponse;
                }
                catch (err) {
                    return err.response.data;
                }

            })
        );

        return initOrderResponse;
    }

    /**
    * on init order
    * @param {Object} messageId
    */
    async onInitOrder(messageId) {
        try {
            let protocolInitResponse = await onOrderInit(messageId);

            if (!(protocolInitResponse && protocolInitResponse.length) ||
                protocolInitResponse?.[0]?.error
            ) {
                const contextFactory = new ContextFactory();
                const context = contextFactory.create({
                    messageId: messageId,
                    action: PROTOCOL_CONTEXT.ON_INIT,
                    transactionId: protocolInitResponse?.[0]?.context?.transaction_id
                });

                return {
                    context,
                    error: {
                        message: "No data found"
                    }
                };
            } else {
                protocolInitResponse = protocolInitResponse?.[0];
                return protocolInitResponse;
            }
        }
        catch (err) {
            throw err;
        }
    }

    /**
    * on init multiple order
    * @param {Object} messageIds
    */
    async onInitMultipleOrder(messageIds) {
        try {

            const onInitOrderResponse = await Promise.all(
                messageIds.map(async messageId => {
                    try {
                        let protocolInitResponse = await this.onInitOrder(messageId);

                        //console.log("protocolInitResponse------------->",protocolInitResponse);
                        //console.log("protocolInitResponse-------provider------>",protocolInitResponse.message.order.provider);

                        let dbResponse = await getOrderByTransactionIdAndProvider(protocolInitResponse?.context?.transaction_id,protocolInitResponse?.message.order.provider.id);

                        //console.log("on init --protocolInitResponse--dbResponse",dbResponse);

                        await this.updateOrder(protocolInitResponse, dbResponse);

                        dbResponse = dbResponse?.toJSON();

                        protocolInitResponse.context = {
                            ...protocolInitResponse?.context,
                            parent_order_id: dbResponse?.parentOrderId
                        };

                        return protocolInitResponse;
                    }
                    catch (err) {
                        throw err;
                    }
                })
            );

            return onInitOrderResponse;
        }
        catch (err) {
            throw err;
        }
    }
}

export default InitOrderService;
