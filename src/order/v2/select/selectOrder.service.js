import { onOrderSelect, protocolGetItemDetails, protocolGetItemList } from "../../../utils/protocolApis/index.js";
import { PROTOCOL_CONTEXT } from "../../../utils/constants.js";
import { RetailsErrorCode } from "../../../utils/retailsErrorCode.js";

import ContextFactory from "../../../factories/ContextFactory.js";
import BppSelectService from "./bppSelect.service.js";
import getCityCode from "../../../utils/AreaCodeMap.js";
import { v4 as uuidv4 } from "uuid";
import Select from "../../v2/db/select.js";

const bppSelectService = new BppSelectService();

class SelectOrderService {

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
     * 
     * @param {Object} response 
     * @returns 
     */
    transform(response) {

        let error = response?.error ? Object.assign({}, response.error, {
            message: response.error.message ? response.error.message : RetailsErrorCode[response.error.code],
        }) : null;

        return {
            context: response?.context,
            message: {
                quote: {
                    ...response?.message?.order
                }
            },
            error: error
        };
    }

    /**
    * select order
    * @param {Object} orderRequest
    */
    async selectOrder(orderRequest) {
        try {
            const { context: requestContext, message = {} } = orderRequest || {};
            const { cart = {}, fulfillments = [] } = message;
            requestContext.city = getCityCode(requestContext?.city)

            if (!(cart?.items || cart?.items?.length)) {
                return {
                    context,
                    success: false,
                    error: { message: "Empty order received" }
                };
            }

            let productIds = cart.items.map(item => item?.local_id || '').join(',');
            let allProviderIds = cart.items.map(item => item?.provider?.id || '').join(',');
            console.log('---------productIds------',productIds)
            let result = await protocolGetItemList({ "itemIds": productIds, "providerIds": allProviderIds });
            console.log('---------result------',result)
            const productsDetailsArray = result.data

            cart.items = await Promise.all(cart.items.map(async (item) => {
                let productsDetails = productsDetailsArray.find(el => item?.local_id == el?.item_details?.id)
                console.log('---------productsDetails------', productsDetails)
                if (!productsDetails?.item_details) {
                    const response = await protocolGetItemDetails({ id: item?.id });
                    if (response) productsDetails = response
                    console.log('---------productsDetails final ------', productsDetails)
                }

                const subtotal = productsDetails?.item_details?.price?.value;
                return {
                    ...item,
                    bpp_id: productsDetails?.context?.bpp_id,
                    bpp_uri: productsDetails?.context?.bpp_uri,
                    contextCity: productsDetails?.context?.city,
                    product: {
                        subtotal,
                        ...productsDetails?.item_details,
                    },
                    provider: {
                        locations: [productsDetails?.location_details],
                        ...productsDetails?.provider_details,
                    },
                };
            }))
            const contextFactory = new ContextFactory();
            const local_ids = cart.items.map(item => item?.local_id).filter(Boolean);
            const providerIds = cart.items.map(item => item?.provider?.local_id).filter(Boolean);
            let transaction = await Select.findOne({
                "items.item_id": { $in: local_ids },
                "items.provider_id": { $in: providerIds }
            });

            console.log('Transactions found:', transaction);
            let transaction_id;
            if (transaction) {  
              transaction_id = transaction.transaction_id;
            } else {
              transaction_id = uuidv4();
            }
            const context = contextFactory.create({
                action: PROTOCOL_CONTEXT.SELECT,
                transactionId: transaction_id,
                bppId: cart?.items[0]?.bpp_id,
                bpp_uri: cart?.items[0]?.bpp_uri,
                city: requestContext?.city,
                pincode: requestContext?.pincode,
                state: requestContext?.state,
                domain: requestContext?.domain
            });

            if (this.areMultipleBppItemsSelected(cart?.items)) {
                return {
                    context,
                    success: false,
                    error: { message: "More than one BPP's item(s) selected/initialized" }
                };
            }
            else if (this.areMultipleProviderItemsSelected(cart?.items)) {
                return {
                    context,
                    success: false,
                    error: { message: "More than one Provider's item(s) selected/initialized" }
                };
            }
            if (fulfillments.some(el => !el?.end?.location?.gps || el?.end?.location?.gps?.includes('null'))) {
                return {
                    context,
                    success: false,
                    error: { message: "GPS location is not correct!" }
                };
            }
            return await bppSelectService.select(
                context,
                { cart, fulfillments }
            );
        }
        catch (err) {
            throw err;
        }
    }

    /**
     * select multiple orders
     * @param {Array} requests 
     */
    async selectMultipleOrder(requests) {

        const selectOrderResponse = await Promise.all(
            requests.map(async request => {
                try {
                    const response = await this.selectOrder(request);
                    return response;
                }
                catch (err) {
                    console.log("error selectOrderResponse ----", err)
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

        return selectOrderResponse;
    }

    /**
    * on select order
    * @param {Object} messageId
    */
    async onSelectOrder(messageId) {
        try {
            const protocolSelectResponse = await onOrderSelect(messageId);

            // if (!(protocolSelectResponse && protocolSelectResponse.length)  ||
            //     protocolSelectResponse?.[0]?.error) {
            //     const contextFactory = new ContextFactory();
            //     const context = contextFactory.create({
            //         messageId: messageId,
            //         action: PROTOCOL_CONTEXT.ON_SELECT
            //     });
            //
            //     return {
            //         context,
            //         error: protocolSelectResponse?.[0]?.error
            //     };
            // } else {
            return this.transform(protocolSelectResponse?.[0]);
            // }
        }
        catch (err) {
            throw err;
        }
    }

    /**
    * on select multiple order
    * @param {Object} messageId
    */
    async onSelectMultipleOrder(messageIds) {
        try {
            const onSelectOrderResponse = await Promise.all(
                messageIds.map(async messageId => {
                    try {
                        const onSelectResponse = await this.onSelectOrder(messageId);
                        if (onSelectResponse?.error?.code == "40002" || onSelectResponse?.message?.quote?.quote?.breakup?.length) {
                            const transactionId = onSelectResponse.context.transaction_id;
                            const providerId = onSelectResponse.message.quote.provider.id;
                            const breakup = onSelectResponse?.message?.quote?.quote?.breakup
                            const allItem = breakup.filter(el => el["@ondc/org/title_type"] == "item")
                            let itemsWithCount99 = allItem.filter(el => el.item?.quantity?.available?.count != "99")
                            itemsWithCount99 = !itemsWithCount99.length && onSelectResponse?.error?.code == "40002" ? allItem : itemsWithCount99 // Checking if seller is still sending available = 99 for out of stock product
                            if (itemsWithCount99.length) {
                                const saveOperations = itemsWithCount99.map(async (item) => {
                                    await Select.updateOne(
                                        { transaction_id: transactionId },
                                        {
                                            $addToSet: {
                                                items: {
                                                    item_id: item["@ondc/org/item_id"],
                                                    error_code: "40002",
                                                    provider_id: providerId
                                                },
                                            },
                                            $setOnInsert: {
                                                created_at: new Date(),
                                            }
                                        },
                                        {
                                            upsert: true
                                        }
                                    );
                                    return {
                                        item_id: item["@ondc/org/item_id"],
                                        error_code: "40002",
                                    };
                                });
                                await Promise.all(saveOperations);
                                const savedItemIds = itemsWithCount99.map(item => item["@ondc/org/item_id"])
                                const errorMessage = `[${savedItemIds.map(id => `{"item_id":"${id}","error":"40002"}`).join(', ')}]`;

                                return {
                                    context: onSelectResponse?.context,
                                    message: onSelectResponse?.message,
                                    success: true,
                                    error: {
                                        type: "DOMAIN-ERROR",
                                        code: "40002",
                                        message: errorMessage
                                    }
                                }
                            }
                        }
                        return { ...onSelectResponse };
                    }
                    catch (err) {
                        console.log("error onSelectMultipleOrder ----", err)
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

            return onSelectOrderResponse;
        }
        catch (err) {
            throw err;
        }
    }
}

export default SelectOrderService;
