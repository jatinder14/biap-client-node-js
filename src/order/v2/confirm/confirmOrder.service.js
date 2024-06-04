import { uuid } from "uuidv4";
import { onOrderConfirm } from "../../../utils/protocolApis/index.js";
import { JUSPAY_PAYMENT_STATUS, PAYMENT_TYPES, PROTOCOL_CONTEXT, PROTOCOL_PAYMENT, SUBSCRIBER_TYPE } from "../../../utils/constants.js";
import {
    addOrUpdateOrderWithTransactionId, addOrUpdateOrderWithTransactionIdAndProvider,
    getOrderByTransactionId,
    getOrderByTransactionIdAndProvider,
    getOrderById
} from "../../v1/db/dbService.js";
import ContextFactory from "../../../factories/ContextFactory.js";
import BppConfirmService from "./bppConfirm.service.js";
import JuspayService from "../../../payment/juspay.service.js";
import CartService from "../cart/v2/cart.service.js";
import FulfillmentHistory from "../db/fulfillmentHistory.js";
import sendAirtelSingleSms from "../../../utils/sms/smsUtils.js";
import lokiLogger from '../../../utils/logger.js';
import getCityCode from "../../../utils/AreaCodeMap.js";
import { BUYER_STATES } from "../../../utils/constant/order.js";
import {getItemsIdsDataForFulfillment} from "../../v1/db/fullfillmentHistory.helper.js"

const bppConfirmService = new BppConfirmService();
const cartService = new CartService();
const juspayService = new JuspayService();

class ConfirmOrderService {

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
     * @param {Object} payment
     * @param {String} orderId
     * @param {Boolean} confirmPayment
     * @returns Boolean
     */
    async arePaymentsPending(payment, orderId, total, confirmPayment = true) {
        if (payment?.type !== PAYMENT_TYPES["ON-ORDER"])
            return false;

        const paymentDetails = (confirmPayment && await juspayService.getOrderStatus(orderId)) || {};

        return payment == null ||
            payment.paid_amount <= 0 ||
            total <= 0 ||
            (
                confirmPayment &&
                ((process.env.NODE_ENV === "prod" &&
                    total !== paymentDetails?.amount) ||
                    paymentDetails?.status !== JUSPAY_PAYMENT_STATUS.CHARGED.status)
            );
    }

    /**
     * Update order in db
     * @param {Object} dbResponse 
     * @param {Object} confirmResponse 
     */
    async updateOrder(dbResponse, confirmResponse, paymentType, razorpayPaymentId, paymentObj = undefined) {
        let orderSchema = dbResponse?.toJSON() || {};
        orderSchema.messageId = confirmResponse?.context?.message_id;
        if (paymentType === PAYMENT_TYPES["ON-ORDER"])
            orderSchema.paymentStatus = PROTOCOL_PAYMENT.PAID;

        if (paymentObj) orderSchema.payment = paymentObj
        //if (razorpayPaymentId && orderSchema && orderSchema?.payment) orderSchema['payment']['razorpayPaymentId'] = razorpayPaymentId
        lokiLogger.info(`---------------orderSchema after ==================:>> ${paymentObj} ------- ${JSON.stringify(orderSchema)}`)

        await addOrUpdateOrderWithTransactionIdAndProvider(
            confirmResponse?.context?.transaction_id, dbResponse.provider.id,
            { ...orderSchema }
        );
    }

    /**
     * INFO: confirm and update order in db
     * @param {Object} orderRequest 
     * @param {Number} total
     * @param {Boolean} confirmPayment
     */
    async confirmAndUpdateOrder(orderRequest = {}, total, confirmPayment = true) {
        const {
            context: requestContext = {},
            message: order = {}
        } = orderRequest || {};
        requestContext.city = getCityCode(requestContext?.city)
        let paymentStatus = {}
        const dbResponse = await getOrderByTransactionIdAndProvider(orderRequest?.context?.transaction_id, orderRequest?.message?.providers?.id);
        if (!dbResponse?.paymentStatus) {
            const contextFactory = new ContextFactory();
            const context = contextFactory.create({
                action: PROTOCOL_CONTEXT.CONFIRM,
                transactionId: requestContext?.transaction_id,
                bppId: dbResponse.bppId,
                bpp_uri: dbResponse.bpp_uri,
                city: requestContext.city,
                state: requestContext.state,
                domain: requestContext.domain,
                pincode: requestContext?.pincode,
            });
            paymentStatus = { txn_id: uuid() }
            const paymentObj = orderRequest?.message?.payment
            const bppConfirmResponse = await bppConfirmService.confirmV2(
                context,
                { ...order, jusPayTransactionId: paymentStatus.txn_id, razorpayPaymentId: paymentObj?.razorpayPaymentId },
                dbResponse
            );
            dbResponse.payment = paymentObj;
            if (bppConfirmResponse?.message?.ack) {
                await this.updateOrder(dbResponse, bppConfirmResponse, order?.payment?.type, paymentObj?.razorpayPaymentId, paymentObj);
            }
            return bppConfirmResponse;

        } else {
            const contextFactory = new ContextFactory();
            const context = contextFactory.create({
                action: PROTOCOL_CONTEXT.CONFIRM,
                transactionId: requestContext?.transaction_id,
                bppId: dbResponse?.bppId,
                messageId: dbResponse?.messageId,
                city: requestContext.city,
                state: requestContext.state,
                domain: requestContext.domain
            });

            return {
                context: context,
                message: {
                    ack: {
                        status: "ACK"
                    }
                }
            };
        }
    }

    /**
     * process on confirm response and update db
     * @param {Object} response 
     * @returns 
     */
    async processOnConfirmResponse(response = {}) {
        try {
            if (response?.message?.order) {
                const dbResponse = await getOrderByTransactionIdAndProvider(
                    response?.context?.transaction_id, response?.message?.order.provider.id
                );

                let orderSchema = { ...response?.message?.order };
                orderSchema.payment.razorpayPaymentId = dbResponse?.payment?.razorpayPaymentId
                orderSchema.messageId = response?.context?.message_id;
                orderSchema.city = response?.context?.city;
                orderSchema.billing = {
                    ...orderSchema.billing,
                    address: {
                        ...orderSchema.billing.address,
                        areaCode: orderSchema.billing.address.area_code
                    }
                };
                orderSchema.customer = {
                    person: { name: orderSchema.billing?.name },
                    contact: {
                        phone: orderSchema.billing?.phone,
                        email: orderSchema.billing?.email
                    }
                };
                orderSchema.is_order_confirmed = true;

                if (orderSchema.fulfillment) {
                    orderSchema.fulfillments = [orderSchema.fulfillment];
                    delete orderSchema.fulfillment;
                }

                for (let fulfillment of orderSchema.fulfillments) {
                    let existingFulfillment = await FulfillmentHistory.findOne({
                        id: fulfillment.id,
                        state: fulfillment.state.descriptor.code,
                        orderId: orderSchema.id
                    })
                    if (!existingFulfillment) {
                        let incomingItemQuoteTrailData = {};
                        const currentfulfillmentHistoryData = getItemsIdsDataForFulfillment(fulfillment,orderSchema,incomingItemQuoteTrailData);
                        await FulfillmentHistory.create({
                            orderId: orderSchema.id,
                            type: fulfillment.type,
                            id: fulfillment.id,
                            state: fulfillment.state.descriptor.code,
                            updatedAt: new Date(),
                            itemIds:currentfulfillmentHistoryData
                        })
                    }
                }
                if (orderSchema.items && dbResponse.items) {
                    orderSchema.items = dbResponse.items
                }

                orderSchema.provider = dbResponse.provider
                if (orderSchema.fulfillment) {
                    orderSchema.fulfillments = [...orderSchema.fulfillments].map((fulfillment) => {
                        return {
                            ...fulfillment,
                            end: {
                                ...fulfillment?.end,
                                location: {
                                    ...fulfillment?.end?.location,
                                    address: {
                                        ...fulfillment?.end?.location?.address
                                    }
                                }
                            },
                        }
                    });
                }

                let updateItems = []
                for (let item of dbResponse.items) {
                    let temp = orderSchema?.fulfillments?.find(fulfillment => fulfillment?.id === item?.fulfillment_id)
                    item.fulfillment_status = temp?.state?.descriptor?.code ?? ""
                    updateItems.push(item)
                }
                orderSchema.items = updateItems;
                orderSchema.updatedQuote = orderSchema.quote;
                orderSchema.tags = orderSchema.tags;
                orderSchema.domain = response?.context.domain
                orderSchema.buyer_state=BUYER_STATES.CONFIRMED

                await addOrUpdateOrderWithTransactionIdAndProvider(
                    response.context.transaction_id, dbResponse.provider.id,
                    { ...orderSchema }
                );

                let billingContactPerson = orderSchema.billing.phone
                let provider = orderSchema.provider.descriptor.name
                await sendAirtelSingleSms(billingContactPerson, [provider], 'ORDER_PLACED', false)
                response.parentOrderId = dbResponse?.[0]?.parentOrderId;
                //clear cart
                cartService.clearCart({ userId: dbResponse.userId });
            }
            return response;
        }
        catch (err) {
            throw err;
        }
    }

    /**
    * confirm order
    * @param {Object} orderRequest
    */
    async confirmOrder(orderRequest) {
        
        try {
            const { context: requestContext, message: order = {} } = orderRequest || {};

            const contextFactory = new ContextFactory();
            const context = contextFactory.create({
                action: PROTOCOL_CONTEXT.CONFIRM,
                transactionId: requestContext?.transaction_id,
                city: requestContext.city,
                state: requestContext.state
            });

            if (!(order?.items?.length)) {
                return {
                    context,
                    success: false,
                    error: { message: "Empty order received" }
                };
            }
            else if (this.areMultipleBppItemsSelected(order?.items)) {
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
            } else if (await this.arePaymentsPending(
                order?.payment,
                orderRequest?.context?.transaction_id,
                order?.payment?.paid_amount
            )) {
                return {
                    context,
                    success: false,
                    error: {
                        message: "BAP hasn't received payment yet",
                        status: "BAP_015",
                        name: "PAYMENT_PENDING"
                    }
                };
            }

            let paymentStatus = await juspayService.getOrderStatus(orderRequest?.context?.transaction_id);

            return await bppConfirmService.confirmV1(
                context,
                { ...order, jusPayTransactionId: paymentStatus.txn_id }
            );
        }
        catch (err) {
            throw err;
        }
    }

    /**
     * INFO: confirm multiple orders
     * @param {Array} orders 
     */
    async confirmMultipleOrder(orders) {
        let total = 0;
        orders.forEach(order => {
            total += order?.message?.payment?.paid_amount;
        });

        const confirmOrderResponse = await Promise.all(
            orders.map(async orderRequest => {
                try {
                    return await this.confirmAndUpdateOrder(orderRequest, total, true);
                }
                catch (err) {
                    console.log("error confirmMultipleOrder ----", err)
                    if (err?.response?.data) {
                        return err?.response?.data;
                    } else if (err?.message) {
                        return {
                            success: false,
                            message: "We are encountering issue while confirming this order with seller!",
                            error: err?.message
                        }
                    } else {
                        return {
                            success: false,
                            message: "We are encountering issue while confirming this order with seller!"
                        }
                    }

                }
            })
        );

        return confirmOrderResponse;
    }

    async getOrderDetails(orderId) {

        const dbResponse = await getOrderById(orderId);
        return dbResponse
    }

    /**
    * on confirm order
    * @param {Object} messageId
    */
    async onConfirmOrder(messageId) {
        try {
            let protocolConfirmResponse = await onOrderConfirm(messageId);
            protocolConfirmResponse = protocolConfirmResponse?.[0] || {};

            if (
                protocolConfirmResponse?.context &&
                protocolConfirmResponse?.message?.order &&
                protocolConfirmResponse.context.message_id &&
                protocolConfirmResponse.context.transaction_id
            ) {
                return protocolConfirmResponse;

            } else {
                const contextFactory = new ContextFactory();
                const context = contextFactory.create({
                    messageId: messageId,
                    action: PROTOCOL_CONTEXT.ON_CONFIRM
                });

                return {
                    context,
                    success: false,
                    error: {
                        message: "No data found"
                    }
                };
            }

        }
        catch (err) {
            throw err
        }
    }

    /**
    * on confirm multiple order
    * @param {Object} messageId
    */
    async onConfirmMultipleOrder(messageIds) {
        try {
            const onConfirmOrderResponse = await Promise.all(
                messageIds.map(async messageId => {
                    try {
                        //@@@
                        const protocolConfirmResponse = await this.onConfirmOrder(messageId);
                        return await this.processOnConfirmResponse(protocolConfirmResponse);
                    }
                    catch (err) {
                        console.log("error onConfirmMultipleOrder ----", err)
                        if (err?.response?.data) {
                            return err?.response?.data;
                        } else if (err?.message) {
                            return {
                                success: false,
                                message: "We are encountering issue while confirming this order with seller!",
                                error: err?.message
                            }
                        } else {
                            return {
                                success: false,
                                message: "We are encountering issue while confirming this order with seller!"
                            }
                        }
                        
                    }
                })
            );

            return onConfirmOrderResponse;
        }
        catch (err) {
            return {
                success: false,
                message: "We are encountering issue while confirming this order with seller!"
            }
        }
    }
}

export default ConfirmOrderService;
