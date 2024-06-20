import { onOrderInit, protocolGetItemDetails, protocolGetItemList } from "../../../utils/protocolApis/index.js";
import { PROTOCOL_CONTEXT } from "../../../utils/constants.js";
import { addOrUpdateOrderWithTransactionId, getOrderByTransactionId, getOrderByTransactionIdAndProvider, addOrUpdateOrderWithTransactionIdAndProvider } from "../../v1/db/dbService.js";

import BppInitService from "./bppInit.service.js";
import ContextFactory from "../../../factories/ContextFactory.js";
import getCityCode from "../../../utils/AreaCodeMap.js";

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
    async createOrder(response, userId = null, orderRequest, deviceId = null) {
        if (response) {
            const provider = orderRequest?.items?.[0]?.provider || [];

            const providerDetails = {
                id: provider.local_id,
                descriptor: provider.descriptor,
                locations: provider?.locations?.map(location => {
                    return { id: location.local_id };
                })
            };
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
                provider_id: provider?.local_id
            };
            let itemProducts = []
            for (let item of orderRequest.items) {

                let parentItemId = item?.parent_item_id?.toString();
                let selectitem = {
                    id: item?.local_id?.toString(),
                    quantity: item?.quantity,
                    location_id: provider?.locations?.[0]?.local_id?.toString()
                }
                let tag = undefined
                if (item.tags && item.tags.length > 0) {
                    tag = item.tags.find(i => i.code === 'type');
                    if (tag) {
                        selectitem.tags = [tag];
                    }
                }

                if (item?.parent_item_id) {
                    let parentItemId = item?.parent_item_id?.toString();
                    selectitem.parent_item_id = parentItemId;
                }

                selectitem.fulfillment_id = item?.fulfillment_id
                selectitem.product = item?.product
                itemProducts.push(selectitem);

                if (item.customisations) {
                    for (let customisation of item.customisations) {
                        let selectitem = {
                            id: customisation?.local_id?.toString(),
                            quantity: customisation.quantity,
                            location_id: provider.locations[0].local_id?.toString()
                        }
                        let tag = undefined
                        if (customisation.item_details.tags && customisation.item_details.tags.length > 0) {
                            tag = customisation.item_details.tags.filter(i => { return i.code === 'type' || i.code === 'parent' });
                            let finalTags = []
                            for (let tg of tag) {
                                if (tg.code === 'parent') {
                                    if (tg.list.length > 0) {
                                        tg.list = tg.list.filter(i => { return i.code === 'id' });
                                    }
                                    finalTags.push(tg);
                                } else {
                                    finalTags.push(tg);
                                }
                            }
                            selectitem.tags = finalTags;
                        }
                        selectitem.fulfillment_id = item?.fulfillment_id
                        selectitem.parent_item_id = parentItemId;
                        selectitem.product = customisation
                        itemProducts.push(selectitem);
                    }

                }

            }
            console.log("deviceId createOrder -------------", deviceId);
            await addOrUpdateOrderWithTransactionIdAndProvider(
                response.context.transaction_id, provider.local_id,
                {
                    userId: userId,
                    deviceId,
                    // cart_key: cart_key,
                    // wishlist_key: wishlist_key,
                    messageId: response?.context?.message_id,
                    transactionId: response?.context?.transaction_id,
                    parentOrderId: response?.context?.parent_order_id,
                    bppId: response?.context?.bpp_id,
                    bpp_uri: response?.context?.bpp_uri,
                    fulfillments: [fulfillment],
                    provider: { ...providerDetails },
                    items: itemProducts,
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
        if (response?.message?.order && dbResponse) {
            dbResponse = dbResponse?.toJSON();

            let orderSchema = { ...response.message.order };
            orderSchema.items = dbResponse?.items.map(item => {
                return {
                    id: item?.id?.toString(),
                    quantity: item.quantity,
                    product: item.product,
                    fulfillment_id: item?.fulfillment_id,
                    tags: item.tags,
                    parent_item_id: item.parent_item_id
                };
            }) || [];

            orderSchema.provider = {
                id: orderSchema?.provider?.id,
                locations: orderSchema?.provider?.locations ?? [],
                descriptor: dbResponse?.provider?.descriptor
            };

            orderSchema.settlementDetails = orderSchema.payment
            orderSchema.billing = {
                ...orderSchema?.billing,
                address: {
                    ...orderSchema?.billing.address,
                    areaCode: orderSchema?.billing?.address?.area_code
                }
            };

            if (orderSchema.fulfillment) {
                orderSchema.fulfillments = [orderSchema.fulfillment];
                delete orderSchema.fulfillment;
            }
            dbResponse.quote = orderSchema.quote

            if (orderSchema.fulfillments && orderSchema.fulfillments.length) {
                orderSchema.fulfillments = [...orderSchema?.fulfillments].map((fulfillment) => {
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
                        customer: dbResponse?.fulfillments[0]?.customer
                    }
                });
            }

            await addOrUpdateOrderWithTransactionIdAndProvider(
                response?.context?.transaction_id, dbResponse.provider.id,
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
            const parentOrderId = requestContext?.transaction_id;
            requestContext.city = getCityCode(requestContext?.city)

            if (!(order?.items?.length)) {
                return {
                    context,
                    success: false,
                    error: { message: "Empty order received" }
                };
            }
            
            const contextFactory = new ContextFactory();
            const context = contextFactory.create({
                action: PROTOCOL_CONTEXT.INIT,
                bppId: order?.items[0]?.bpp_id,
                bpp_uri: order?.items[0]?.bpp_uri,
                city: requestContext.city,
                state: requestContext.state,
                transactionId: requestContext?.transaction_id,
                domain: requestContext?.domain,
                pincode: requestContext?.pincode,
                // ...(!isMultiSellerRequest && { transactionId: requestContext?.transaction_id })
            });

            if (this.areMultipleBppItemsSelected(order?.items)) {
                return {
                    context,
                    success: false,
                    error: { message: "More than one BPP's item(s) selected/initialized" }
                };
            }
            else if (this.areMultipleProviderItemsSelected(order?.items)) {
                return {
                    context,
                    success: false,
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
                    console.log("order?.deviceId initMultipleOrder -------------", order?.deviceId);
                    await this.createOrder(bppResponse, user?.decodedToken?.uid, order?.message, order?.deviceId);

                    return bppResponse;
                }
                catch (err) {
                    console.log("error initMultipleOrder ----", err)
                    if (err?.response?.data) {
                        return err?.response?.data;
                    } else if (err?.message) {
                        return {
                            success: false,
                            message: "We are encountering issue to proceed with this order!",
                            error: err?.message
                        }
                    } else {
                        return {
                            success: false,
                            message: "We are encountering issue to proceed with this order!"
                        }
                    }

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
                    success: false,
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
                        let dbResponse = await getOrderByTransactionIdAndProvider(protocolInitResponse?.context?.transaction_id, protocolInitResponse?.message.order.provider.id);
                        await this.updateOrder(protocolInitResponse, dbResponse);

                        dbResponse = dbResponse?.toJSON();

                        protocolInitResponse.context = {
                            ...protocolInitResponse?.context,
                            parent_order_id: dbResponse?.parentOrderId
                        };

                        return protocolInitResponse;
                    }
                    catch (err) {
                        console.log("error onInitMultipleOrder ----", err)
                        if (err?.response?.data) {
                            return err?.response?.data;
                        } else if (err?.message) {
                            return {
                                success: false,
                                message: "We are encountering issue to proceed with this order!",
                                error: err?.message
                            }
                        } else {
                            return {
                                success: false,
                                message: "We are encountering issue to proceed with this order!"
                            }
                        }

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
