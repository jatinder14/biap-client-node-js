import { onOrderCancel, onUpdateStatus } from "../../../utils/protocolApis/index.js";
import { PROTOCOL_CONTEXT, SETTLE_STATUS } from "../../../utils/constants.js";
import RazorPayService from "../../../razorPay/razorPay.service.js";
import {
    getOrderById, saveOrderRequest, getOrderRequest,
    addOrUpdateOrderWithdOrderId,
    getOrderByTransactionAndOrderId
} from "../../v1/db/dbService.js";
import lokiLogger from '../../../utils/logger.js'
import BppUpdateService from "./bppUpdate.service.js";
import ContextFactory from "../../../factories/ContextFactory.js";
import CustomError from "../../../lib/errors/custom.error.js";
import NoRecordFoundError from "../../../lib/errors/no-record-found.error.js";
import OrderMongooseModel from '../../v1/db/order.js';
import OrderRequestLogMongooseModel from "../../v1/db/orderRequestLog.js";
import Fulfillments from "../db/fulfillments.js";
import Settlements from "../db/settlement.js";
import FulfillmentHistory from "../db/fulfillmentHistory.js";
import { v4 as uuidv4 } from "uuid";
import Refund from "../db/refund.js";
import {getItemsIdsDataForFulfillment} from "../../v1/db/fullfillmentHistory.helper.js"

const bppUpdateService = new BppUpdateService();
const razorPayService = new RazorPayService()

class UpdateOrderService {

    /**
     * INFO: Check if order returned already
     * @param {Object} orderRequest 
     */
    async checkQuantityReturn(orderRequest) {
        const itemIds = orderRequest?.message?.order?.items.map(item => item?.id);
        const returnExits = await OrderMongooseModel.findOne({ transactionId: orderRequest?.context?.transaction_id });
        if (returnExits?.fulfillments?.[returnExits.fulfillments.length - 1]?.type === "Return") {
            const orderQuantities = await OrderMongooseModel.aggregate([
                { $match: { transactionId: orderRequest.context.transaction_id } },
                { $unwind: '$items' },
                { $match: { 'items.id': { $in: itemIds } } },
                { $group: { _id: '$items.id', totalQuantity: { $sum: '$items.quantity.count' } } }
            ]);
            console.log('orderQuantities', orderQuantities)

            const returnQuantities = {};
            returnExits.fulfillments.forEach(({ tags }) => {
                let processedReturnRequest = false;
                tags?.filter(tag => tag?.code === 'return_request').forEach(({ list }) => {
                    if (!processedReturnRequest) {
                        let itemId, itemQuantity;
                        list.forEach(tag => {
                            if (tag.code === 'item_id') {
                                itemId = tag.value;
                            } else if (tag.code === 'item_quantity') {
                                itemQuantity = parseInt(tag.value, 10);
                                if (itemId && itemQuantity !== undefined) {
                                    returnQuantities[itemId] = (returnQuantities[itemId] || 0) + itemQuantity;
                                    itemId = undefined;
                                    itemQuantity = undefined;
                                }
                            }
                        });
                        processedReturnRequest = true;
                    }
                });
            });

            const itemsData = orderRequest?.message?.order?.items?.map(item => ({
                itemId: item?.id,
                currentReturnQuantity: item?.quantity?.count ?? 0
            })) ?? [];
            let anyItemFailed = false;

            // Check if any item is already returned beyond its ordered quantity
            for (const item of itemsData) {
                const { itemId, currentReturnQuantity } = item;
                const totalQuantity = orderQuantities.find(order => order._id === itemId)?.totalQuantity || 0;
                const totalReturnQuantity = returnQuantities[itemId] || 0;
                const remainingQuantity = totalQuantity - totalReturnQuantity;
                if (remainingQuantity < currentReturnQuantity) {
                    anyItemFailed = true;
                    break;
                }
            }
            if (anyItemFailed) {
                throw new Error(`One or more items have already been returned.`);
            }
        }
    }

    /**
    * INFO: cancel/return order
    * @param {Object} orderRequest
    */
    async update(orderRequest) {
        try {
            // - Check if order already returned
            await this.checkQuantityReturn(orderRequest);

            const orderDetails = await getOrderById(orderRequest.message.order.id);
            const order_detials = orderDetails?.[0] || {}
            const contextFactory = new ContextFactory();
            const context = contextFactory.create({
                action: PROTOCOL_CONTEXT.UPDATE,
                bppId: order_detials?.bppId,
                transactionId: order_detials?.transactionId,
                bpp_uri: order_detials?.bpp_uri,
                cityCode: order_detials?.city,
                city: order_detials?.city,
                domain: order_detials?.domain
            });

            orderRequest.context = { ...context }
            const data = { context: context, data: orderRequest }

            let fulfilments = []
            let dbFulfillment = new Fulfillments();
            let type = '';
            let code = '';
            if (orderRequest.message.order.items[0].tags.update_type === "return") {
                type = 'Return';
                code = 'return_request'
            }

            const reason_descriptions = {
                "001": "Buyer does not want product any more",
                "002": "Product available at lower than order price",
                "003": "Product damaged or not in usable state",
                "004": "Product is of incorrect quantity or size",
                "005": "Product delivered is different from what was shown and ordered"
            }

            let fulfillmentId;
            let tags = []
            for (let item of orderRequest.message.order.items) {
                const reason_id = item.tags.reason_code
                const reason_desc = reason_descriptions[reason_id] || "No description provided"
                if (!fulfillmentId) {
                    fulfillmentId = dbFulfillment._id;
                }
                let returnRequest = {
                    "code": code,
                    "list":
                        [
                            {
                                "code": "id",
                                "value": fulfillmentId
                            },
                            {
                                "code": "item_id",
                                "value": item.id
                            },
                            {
                                "code": "parent_item_id",
                                "value": item.tags.parent_item_id ?? ""
                            },
                            {
                                "code": "item_quantity",
                                "value": `${item.quantity.count}`
                            },
                            {
                                "code": "reason_id",
                                "value": `${item.tags.reason_code}`
                            },
                            {
                                "code": "reason_desc",
                                "value": reason_desc
                            },
                            {
                                "code": "images",
                                "value": `${item.tags.image}`
                            },
                            {
                                "code": "ttl_approval",
                                "value": "PT24H"
                            },
                            {
                                "code": "ttl_reverseqc",
                                "value": "P3D"
                            }
                        ]
                }
                tags.push(returnRequest)

                dbFulfillment.itemId = item.id
                dbFulfillment.orderId = orderRequest.message.order.id
                dbFulfillment.parent_item_id = item.tags.parent_item_id ?? ""
                dbFulfillment.item_quantity = item.quantity.count
                dbFulfillment.reason_id = item.tags.reason_code
                dbFulfillment.reason_desc = reason_desc
                dbFulfillment.images = item.tags.image
                dbFulfillment.type = type
                dbFulfillment.id = fulfillmentId;
                await dbFulfillment.save();
            }

            let fulfilment = {
                "type": type,
                "tags": tags
            }
            fulfilments.push(fulfilment);

            // create a new fullfillment
            let order = {
                "update_target": "item",
                "order":
                {
                    "id": orderRequest.message.order.id,
                    "fulfillments": fulfilments
                }
            }

            const transactionId = data.context.transaction_id
            const messageId = data.context.message_id
            const request = data.data
            const requestType = data.context.action
            const orderSaved = new OrderRequestLogMongooseModel({ requestType, transactionId, messageId, request })
            await orderSaved.save();
            if (!(context?.bpp_id)) {
                throw new CustomError("BPP Id is mandatory");
            }
            return await bppUpdateService.update(
                context,
                type,
                order,
                orderDetails
            );
        }
        catch (err) {
            throw err;
        }
    }

    /**
    * INFO: cancel order
    * @param {Object} orderRequest
    * @param {Object} protocolUpdateResponse
    */
    async updateForPaymentObject(orderRequest, protocolUpdateResponse) {
        try {


            const orderDetails = await getOrderById(orderRequest.message.order.id);

            const orderRequestDb = await getOrderRequest({ transaction_id: orderRequest.context.transaction_id, message_id: orderRequest.context.message_id, requestType: 'update' })

            if (!orderRequestDb?.request?.message?.payment) {
                const contextFactory = new ContextFactory();
                const context = contextFactory.create({
                    action: PROTOCOL_CONTEXT.UPDATE,
                    transactionId: orderDetails?.transactionId,
                    bppId: orderRequest?.context?.bpp_id,
                    bpp_uri: orderDetails?.bpp_uri,
                    cityCode: orderDetails.city,
                    city: orderDetails.city
                });

                const { message = {} } = orderRequest || {};
                const { update_target, order } = message || {};

                if (!(context?.bpp_id)) {
                    throw new CustomError("BPP Id is mandatory");
                }

                console.log("orderDetails?.updatedQuote?.price?.value----1->", orderDetails?.updatedQuote?.price?.value)
                console.log("orderDetails?.updatedQuote?.price?.value----2->", protocolUpdateResponse.message.order.quote?.price?.value)
                console.log("orderDetails?.updatedQuote?.price?.value---message id--3>", protocolUpdateResponse.context.message_id)

                let originalQouteUpdated = false;
                let updateQoute = false
                if (parseInt(orderDetails?.updatedQuote?.price?.value) > parseInt(protocolUpdateResponse.message.order.quote?.price?.value)) {
                    originalQouteUpdated = true;
                    const lastUpdatedItems = orderRequestDb.request.message.items;
                    console.log("qoute updated ------originalQouteUpdated---->", originalQouteUpdated)

                    console.log("qoute updated ------originalQouteUpdated---qoute-items>", lastUpdatedItems)

                    console.log("qoute updated ------originalQouteUpdated---qoute-items protocolUpdateResponse.message.order.items>", protocolUpdateResponse.message.order.items)


                    //check if item state is liquidated or cancelled
                    //if there is update qoute recieved from on_update we need to calculate refund amount
                    //refund amount = original quote - update quote

                    for (const item of protocolUpdateResponse.message.order.items) {
                        let updateItem = orderDetails.items.find((i) => { return i.id === item.id });
                        if (updateItem) {
                            console.log("**************************************",)
                            console.log("update item found---->", updateItem.id)
                            console.log("update item found----item?.tags?.status>item?.tags?.status", item?.tags?.status);
                            console.log("update item found----item?.tags?.status>item?.tags?.status", item);
                            console.log("update item found----updateItem.return_status", updateItem.return_status)
                            //check the status
                            if (['Cancelled', 'Liquidated', 'Return_Picked'].includes(item?.return_status) && item?.return_status !== updateItem.return_status && item?.cancellation_status !== updateItem.cancellation_status) {
                                updateQoute = true;
                                console.log("update item found--mark true-->", updateItem.id)
                            } else {
                                console.log("-----does not match------")
                            }
                        }
                    }

                    // const olderQuote = await OrderRequestLogMongooseModel.find({transactionId:orderDetails?.transactionId,requestType:'on_update'}).sort({createdAt:'desc'});
                    //
                    //  let previouseQoute ;
                    //  if(!olderQuote){
                    //      previouseQoute = olderQuote.map((item) => parseInt(item?.request?.payment? item?.request?.payment["@ondc/org/settlement_details"][0]?.settlement_amount:0)|| 0).reduce((a, b) => +a + +b)
                    //  }else{
                    //      previouseQoute = olderQuote.map((item) => parseInt(item?.request?.payment? item?.request?.payment["@ondc/org/settlement_details"][0]?.settlement_amount:0)|| 0).reduce((a, b) => +a + +b)
                    //  }

                    let lastUpdatedQoute = parseInt(orderDetails?.updatedQuote?.price?.value ?? 0);
                    console.log("lastUpdatedQoute--->", orderDetails?.updatedQuote?.price?.value ?? 0)

                    let refundAmount = 0
                    // if(lastUpdatedQoute==0){
                    //     refundAmount = parseInt(orderDetails?.quote?.price?.value) - parseInt(protocolUpdateResponse.message.order.quote?.price?.value)//- previouseQoute
                    // }else{
                    refundAmount = lastUpdatedQoute - parseInt(protocolUpdateResponse.message.order.quote?.price?.value)//- previouseQoute
                    //                    }

                    console.log("refund value--->", refundAmount)
                    // console.log("refund value--previouseQoute->",previouseQoute)
                    let paymentSettlementDetails =
                    {
                        "@ondc/org/settlement_details":
                            [
                                {
                                    "settlement_counterparty": "buyer",
                                    "settlement_phase": "refund",
                                    "settlement_type": "upi",//TODO: take it from payment object of juspay
                                    "settlement_amount": '' + refundAmount,
                                    "settlement_timestamp": new Date()
                                }
                            ]
                    }

                    order.payment = paymentSettlementDetails

                    orderRequest.payment = paymentSettlementDetails


                    //if(orderRequest.context.message_id){ //if messageId exist then do not save order again
                    await saveOrderRequest({ context, data: orderRequest });
                    // }
                    //

                    if (updateQoute) {
                        return await bppUpdateService.update(
                            context,
                            'payment',
                            order,
                            orderDetails
                        );
                    } else {
                        return {}
                    }

                }

            }

        }
        catch (err) {
            throw err;
        }
    }

    /**
     * INFO: Send return to dashboard
     * @param {Object} order
     */
    async updateReturnOnEssentialDashboard(order) {
        try {
            const lastFulfillment =
                order?.message?.order?.fulfillments[
                order?.message?.order?.fulfillments.length - 1
                ];
            let returnState = lastFulfillment?.state?.descriptor?.code;
            const returnId = lastFulfillment?.id;

            const validReturnStates = ["Liquidated", "Rejected", "Reverse-QC"];

            const returnType = lastFulfillment?.type;
            const essentialDashboardUri = process.env.ESSENTIAL_DASHBOARD_URI;
            if (
                validReturnStates.includes(returnState) &&
                essentialDashboardUri &&
                order.context?.transaction_id &&
                order.context?.bap_id
            ) {
                const payload = {
                    0: {
                        json: {
                            id: returnId,
                            remarks: returnType,
                            returnStatus: returnState,
                        },
                    },
                };

                const data = JSON.stringify(payload);
                const config = {
                    method: "post",
                    maxBodyLength: Infinity,
                    url: `${essentialDashboardUri}/trpc/return.updateReturnBySeller?batch=1`,
                    headers: {
                        "Content-Type": "application/json",
                    },
                    data: data,
                };
                const response = await axios.request(config);
            } else {
                return;
            }
        } catch (error) {
            console.log("error updateReturnOnEssentialDashboard update order ===================", error);
            throw error;
        }
    }

    /**
     * INFO: Function to calculate refund amount when return is done by the user
     * @param {Object} obj 
     * @returns 
     */
    calculateRefundAmountForReturnByUser(obj) {
        let totalRefundAmount = 0
        lokiLogger.info(`obj ======  ${JSON.stringify(obj)}`);
        if (obj) {
            let sumOfNegativeValues = 0;
            let fulfillments = obj?.message?.order?.fulfillments || [];
            let latest_fulfillment = fulfillments.length ? fulfillments[fulfillments.length - 1] : {};
            lokiLogger.info(`latest_fulfillment ======  ${JSON.stringify(latest_fulfillment)}`);
            if (latest_fulfillment?.state?.descriptor?.code === "Liquidated") {
                latest_fulfillment?.tags?.forEach((tag) => {
                    if (tag?.code === "quote_trail") {
                        tag?.list?.forEach((item) => {
                            if (item?.code === "value") {
                                let value = parseFloat(item?.value);
                                if (!isNaN(value) && value < 0) {
                                    sumOfNegativeValues += value;
                                }
                            }
                        });
                    }
                });
            }
            lokiLogger.info(`Sum of negative values:, ${sumOfNegativeValues}`);

            let totalCharges = 0;
            let quoteBreakup = obj?.message?.order?.quote?.breakup || [];

            let full_Cancel = true;
            quoteBreakup.forEach((breakupItem) => {
                if (breakupItem?.["@ondc/org/item_quantity"]?.count !== undefined) {
                    if (breakupItem?.["@ondc/org/item_quantity"]?.count != 0)
                        full_Cancel = false;
                }
            });

            if (full_Cancel) {
                lokiLogger.info(`full_Cancel ---->> :  ${full_Cancel}`);

                quoteBreakup.forEach((breakupItem) => {
                    totalCharges += parseFloat(breakupItem?.price?.value) || 0;
                });
            }
            lokiLogger.info(`Sum of quoteBreakup values: ${totalCharges}`);
            totalRefundAmount = Math.abs(sumOfNegativeValues) + totalCharges;
            lokiLogger.info(`total price sum:  ${totalRefundAmount}`);
            return totalRefundAmount;
        }
        return totalRefundAmount;
    }

    /**
     * INFO: Function to calculate refund amount, When partial cancel order is initiated by the seller
     * @param {object} obj 
     * @returns 
     */
    calculateRefundAmountForPartialOrderCancellationBySeller(obj) {
        let totalRefundAmount = 0;
        lokiLogger.info(`obj ======  ${JSON.stringify(obj)}`);
        if (obj) {
            let sumOfNegativeValues = 0;
            let fulfillments = obj?.message?.order?.fulfillments;
            let latest_fulfillment = fulfillments.length
                ? fulfillments.find(
                    (el) => el?.state?.descriptor?.code === "Cancelled",
                )
                : {};
            console.log(
                `latest_fulfillment ======  ${JSON.stringify(latest_fulfillment)}`,
            );
            if (latest_fulfillment?.state?.descriptor?.code === "Cancelled") {
                latest_fulfillment?.tags?.forEach((tag) => {
                    if (tag?.code === "quote_trail") {
                        tag?.list?.forEach((item) => {
                            if (item?.code === "value") {
                                let value = parseFloat(item?.value);
                                if (!isNaN(value) && value < 0) {
                                    sumOfNegativeValues += value;
                                }
                            }
                        });
                    }
                });
            }
            lokiLogger.info(`Sum of negative values:, ${sumOfNegativeValues}`);

            let totalCharges = 0;


            let quoteBreakup = obj?.message?.order?.quote?.breakup || [];

            let full_Cancel = true;
            quoteBreakup.forEach((breakupItem) => {
                if (breakupItem?.["@ondc/org/item_quantity"]?.count !== undefined) {
                    if (breakupItem?.["@ondc/org/item_quantity"]?.count != 0)
                        full_Cancel = false;
                }
            });

            if (full_Cancel) {
                console.log(`full_Cancel ---->> :  ${full_Cancel}`);

                quoteBreakup.forEach((breakupItem) => {
                    totalCharges += parseFloat(breakupItem?.price?.value) || 0;
                });
            }
            console.log(`Sum of quoteBreakup values: ${totalCharges}`);
            totalRefundAmount = Math.abs(sumOfNegativeValues) + totalCharges;
            lokiLogger.info(`total price sum:  ${totalRefundAmount}`);
            return totalRefundAmount;
        }
        return totalRefundAmount;
    }    

    /**
    * INFO: on cancel/return order
    * @param {String} messageId
    */
    async onUpdate(messageId) {
        try {
            let protocolUpdateResponse = await onUpdateStatus(messageId);

            lokiLogger.info(`onUpdate protocolUpdateResponse_onUpdateStatus ----------------${JSON.stringify(protocolUpdateResponse)}`)

            if (!(protocolUpdateResponse && protocolUpdateResponse.length)) {
                const contextFactory = new ContextFactory();
                const context = contextFactory.create({
                    messageId: messageId,
                    action: PROTOCOL_CONTEXT.ON_UPDATE
                });

                return {
                    context,
                    success: false,
                    error: {
                        message: "No data found"
                    }
                };
            }
            else {
                if (!(protocolUpdateResponse?.[0].error)) {

                    protocolUpdateResponse = protocolUpdateResponse?.[0];

                    const dbResponse = await OrderMongooseModel.find({
                        transactionId: protocolUpdateResponse.context.transaction_id,
                        id: protocolUpdateResponse.message.order.id
                    });

                    if (!(dbResponse || dbResponse.length))
                        throw new NoRecordFoundError();
                }
                if (protocolUpdateResponse?.context?.transaction_id && protocolUpdateResponse?.message?.order?.fulfillments?.length) {
                    const dbResponse = await OrderMongooseModel.findOne({
                        transactionId: protocolUpdateResponse.context.transaction_id,
                        id: protocolUpdateResponse.message.order.id
                    });
                    dbResponse.fulfillments = protocolUpdateResponse.message.order.fulfillments

                    const latestFullfilementIndex = protocolUpdateResponse.message.order.fulfillments.length - 1

                    const latestFullfilement = protocolUpdateResponse.message.order.fulfillments[latestFullfilementIndex]
                    
                    const fullfillmentHistory = new FulfillmentHistory({
                        id: dbResponse.id,
                        type: latestFullfilement.type,
                        state: latestFullfilement.state.descriptor.code,
                        orderId: protocolUpdateResponse.message.order.id,
                        itemIds:getItemsIdsDataForFulfillment(latestFullfilement)
                    })

                    dbResponse.save()
                    fullfillmentHistory.save()
                    if (protocolUpdateResponse) await this.updateReturnOnEssentialDashboard(protocolUpdateResponse)
                }


            }
            lokiLogger.info(`protocolUpdateResponse----lastLine---->>>>> -------------${JSON.stringify(protocolUpdateResponse)}`)
            return protocolUpdateResponse;
        }


        catch (err) {
            throw err;
        }
    }

    /**
     * INFO: Function to update cancel/refund into db
     * @param {String} messageId 
     * @returns 
     */
    async onUpdateDbOperation(messageId) {
        try {
            await new Promise((resolve) => setTimeout(resolve, 30000))
            let protocolUpdateResponse = await onUpdateStatus(messageId);
            if (!(protocolUpdateResponse && protocolUpdateResponse.length)) {
                lokiLogger.info(`onUpdateprotocolresponse inside ----------------${JSON.stringify(protocolUpdateResponse)}`)
                const contextFactory = new ContextFactory();
                const context = contextFactory.create({
                    messageId: messageId,
                    action: PROTOCOL_CONTEXT.ON_UPDATE
                });

                return {
                    context,
                    success: false,
                    error: {
                        message: "No data found"
                    }
                };
            }
            else {
                lokiLogger.info(`protocolUpdateResponse?.[0].error ----------------${protocolUpdateResponse?.[0].error}`)
                if (!(protocolUpdateResponse?.[0].error)) {
                    let refundAmount = 0;
                    protocolUpdateResponse = protocolUpdateResponse?.[0];
                    let fulfillments = protocolUpdateResponse?.message?.order?.fulfillments || [];
                    let currentfulfillment = fulfillments.length
                        && fulfillments.find(
                            (el) =>
                                el?.state?.descriptor?.code === "Cancelled" ||
                                el?.state?.descriptor?.code === "Liquidated" ||
                                el?.state?.descriptor?.code === "Return_Picked",
                        )

                    let latest_fulfillment = currentfulfillment ? currentfulfillment
                        : fulfillments[
                        fulfillments.length - 1
                        ];
                    if (latest_fulfillment?.state?.descriptor?.code == "Liquidated" || latest_fulfillment?.state?.descriptor?.code == "Return_Picked") 
                        refundAmount = this.calculateRefundAmountForReturnByUser(protocolUpdateResponse);    
                    else if (latest_fulfillment?.state?.descriptor?.code == "Cancelled")
                        refundAmount = this.calculateRefundAmountForPartialOrderCancellationBySeller(protocolUpdateResponse);


                    lokiLogger.info(`----------fulfillments-Items-------------: ${JSON.stringify(fulfillments)}`);
                    lokiLogger.info(`----------latest_fulfillment-Items----------------: ${JSON.stringify(latest_fulfillment)}`);

                    const dbResponse = await getOrderByTransactionAndOrderId(protocolUpdateResponse.context.transaction_id, protocolUpdateResponse.message.order.id);
                    lokiLogger.info(`----------------ondbResponse----dbResponse------------${JSON.stringify(dbResponse)}`)


                    if (!(dbResponse || dbResponse.length))
                        throw new NoRecordFoundError();
                    else {
                        let razorpayPaymentId = dbResponse?.payment?.razorpayPaymentId
                        lokiLogger.info(`razorpayPaymentId_onUpdate----- ${razorpayPaymentId}`)

                        lokiLogger.info(`totalAmount_onUpdate-----, ${refundAmount}`)

                        if (latest_fulfillment?.state?.descriptor?.code == "Liquidated" || latest_fulfillment?.state?.descriptor?.code == "Return_Picked" || latest_fulfillment?.state?.descriptor?.code == "Cancelled") {
                            let return_item_count = 0,left_order_item_count = 0;

                            if (latest_fulfillment?.state?.descriptor?.code == "Liquidated" || latest_fulfillment?.state?.descriptor?.code == "Return_Picked") {
                                let data = latest_fulfillment.tags?.find(
                                    (el) => el?.code == "return_request",
                                );
                                let fulfillment_id = data?.list?.find((el) => el?.code == "id")?.value;
                                let item_id = data?.list?.find((el) => el?.code == "item_id")?.value;
                                return_item_count = data?.list?.find(
                                    (el) => el?.code == "item_quantity",
                                )?.value;
                                let items = protocolUpdateResponse?.message?.order?.items;
                                 left_order_item_count =
                                    items?.find(
                                        (el) => el?.id == item_id && el?.fulfillment_id != fulfillment_id,
                                    )?.quantity?.count +
                                    items?.find(
                                        (el) => el?.id == item_id && el?.fulfillment_id == fulfillment_id,
                                    )?.quantity?.count;
                            }
                            if ( return_item_count <= left_order_item_count || latest_fulfillment?.state?.descriptor?.code == "Cancelled" ) {
                                if (razorpayPaymentId && refundAmount) {
                                    let razorpayRefundAmount = Math.abs(refundAmount).toFixed(2) * 100;
                                    lokiLogger.info(`------------------amount-passed-to-razorpay-- ${razorpayRefundAmount}`)
                                    let response = await razorPayService.refundOrder(razorpayPaymentId, razorpayRefundAmount)
                                    lokiLogger.info(`response_razorpay_on_update>>>>>>>>>> ${JSON.stringify(response)}`)
                                    let order_details = dbResponse;
                                    const refundDetails = await Refund.create({
                                        orderId: order_details?.id,
                                        refundId: response?.id,
                                        refundedAmount: (response?.amount && response?.amount > 0) ? (response?.amount) / 100 : response?.amount,
                                        // itemId: dbResponse.items[0].id,     will correct it after teammate [ritu] task to store return item details  - todo
                                        // itemQty: dbResponse.items[0].quantity.count,
                                        isRefunded: true,
                                        transationId: order_details?.transactionId,
                                        razorpayPaymentId: order_details?.payment?.razorpayPaymentId
                                    })
                                    lokiLogger.info(`refundDetails>>>>>>>>>>, ${JSON.stringify(refundDetails)}`)

                                }
                            }
                        }

                        if (protocolUpdateResponse?.message?.update_target === 'billing') {
                            return protocolUpdateResponse;
                        }
                        const orderSchema = dbResponse;
                        orderSchema.state = protocolUpdateResponse?.message?.order?.state;

                        if (protocolUpdateResponse?.message?.order?.quote) {
                            orderSchema.updatedQuote = protocolUpdateResponse?.message?.order?.quote
                        }

                        /***
                         * Updated return and cancellation flow
                         * scenario #1. only 1 item qty is purchased and returned/cancelled
                         * scenario #2. more than 1 item is purchased and cancelled all
                         * scenario #3. more than 1 item is purchased and returned all
                         * scenario #4. more than 2 item is purchased and canceled only 1
                         * scenario #5. more than 2 item is purchased and canceled 2 items once
                         * scenario #6. more than 2 item is purchased and canceled 2 items one by one
                         * scenario #7. more than 2 item is purchased and returned only 1
                         * scenario #8. more than 2 item is purchased and returned 2 items once
                         * scenario #9. more than 2 item is purchased and returned 2 items one by one
                         * scenario #10. more than 4 item is purchased and returned 2 cancelled 2 items one by one
                         */

                        let protocolItems = protocolUpdateResponse?.message?.order.items || []

                        let fulfillments = protocolUpdateResponse?.message?.order?.fulfillments

                        for (let fl of fulfillments) {
                            //find if fl present
                            let dbFl = await Fulfillments.findOne({ orderId: protocolUpdateResponse?.message?.order.id, id: fl.id });

                            console.log("dbFl--->", dbFl)
                            if (!dbFl) {
                                //save new fl
                                let newFl = new Fulfillments();
                                newFl.id = fl.id;
                                newFl.orderId = protocolUpdateResponse?.message?.order.id;
                                newFl.state = fl.state;
                                if (fl.type === 'Return' || fl.type === 'Cancel') {
                                    newFl.type = fl.type
                                    //dbFl.tags = fl.tags;
                                } else {
                                    newFl.type = 'orderFulfillment';
                                }
                                dbFl = await newFl.save();

                            } else {
                                dbFl.state = fl.state;
                                if (fl.type === 'Return' || fl.type === 'Cancel') {
                                    dbFl.tags = fl.tags;
                                }
                                await dbFl.save();
                            }

                            // if(fulfillment.type==='Delivery'){
                            let existingFulfillment = await FulfillmentHistory.findOne({
                                id: fl.id,
                                state: fl.state.descriptor.code
                            })
                            if (!existingFulfillment || existingFulfillment!=='null') {
                                const itemIdsData = getItemsIdsDataForFulfillment(fl);
                                await FulfillmentHistory.create({
                                    orderId: protocolUpdateResponse?.message?.order.id,
                                    type: fl.type,
                                    id: fl.id,
                                    state: fl.state.descriptor.code,
                                    updatedAt: protocolUpdateResponse?.message?.order?.updated_at?.toString(),
                                    itemIds:itemIdsData
                                })
                            }
                            // }

                            if (fl?.state?.descriptor?.code === 'Cancelled' || fl?.state?.descriptor?.code === 'Return_Picked' || fl?.state?.descriptor?.code === 'Liquidated') {
                                console.log("amount", refundAmount);

                                let oldSettlement = await Settlements.findOne({ orderId: dbFl.orderId, fulfillmentId: dbFl.id })
                                if (!oldSettlement) {
                                    let settlementContext = protocolUpdateResponse.context;
                                    let settlementTimeStamp = new Date();
                                    //send update request
                                    let updateRequest = {
                                        "context":
                                        {
                                            "domain": settlementContext.domain,
                                            "action": "update",
                                            "core_version": "1.2.0",
                                            "bap_id": settlementContext.bap_id,
                                            "bap_uri": settlementContext.bap_uri,
                                            "bpp_id": settlementContext.bpp_id,
                                            "bpp_uri": settlementContext.bpp_uri,
                                            "transaction_id": settlementContext.transaction_id,
                                            "message_id": uuidv4(),
                                            "city": settlementContext.city,
                                            "country": settlementContext.country,
                                            "timestamp": settlementTimeStamp
                                        },
                                        "message":
                                        {
                                            "update_target": "payment",
                                            "order":
                                            {
                                                "id": dbFl.orderId,
                                                "fulfillments":
                                                    [
                                                        {
                                                            "id": dbFl.id,
                                                            "type": dbFl.type
                                                        }
                                                    ],
                                                "payment":
                                                {
                                                    "@ondc/org/settlement_details":
                                                        [
                                                            {
                                                                "settlement_counterparty": "buyer",
                                                                "settlement_phase": "refund",
                                                                "settlement_type": "upi",
                                                                "settlement_amount": `${refundAmount * -1}`, //TODO; fix this post qoute calculation
                                                                "settlement_timestamp": settlementTimeStamp
                                                            }
                                                        ]
                                                }
                                            }
                                        }
                                    }

                                    let newSettlement = await Settlements();
                                    newSettlement.orderId = dbFl.orderId;
                                    newSettlement.settlement = updateRequest;
                                    newSettlement.fulfillmentId = dbFl.id;
                                    await newSettlement.save();

                                    await bppUpdateService.update(
                                        updateRequest.context,
                                        updateRequest.message,
                                        updateRequest.message
                                    );
                                }
                            }
                        }

                        // console.log("updateItems",updateItems)
                        let updateItems = []
                        for (let item of protocolItems) {
                            let updatedItem = {}
                            let fulfillmentStatus = await Fulfillments.findOne({ id: item.fulfillment_id, orderId: protocolUpdateResponse.message.order.id }); //TODO: additional filter of order id required
                            lokiLogger.info(`--------fulfillmentStatus--------------- ${JSON.stringify(fulfillmentStatus)}`)

                            // updatedItem = orderSchema.items.filter(element=> element.id === item.id && !element.tags); //TODO TEMP testing
                            updatedItem = orderSchema.items.filter(element => element.id === item.id);
                            let temp = updatedItem[0];
                            if (fulfillmentStatus.type === 'Return' || fulfillmentStatus.type === 'Cancel') {
                                item.return_status = fulfillmentStatus?.state?.descriptor?.code;
                                item.cancellation_status = fulfillmentStatus?.state?.descriptor?.code;
                                // item.returned_item_count = fulfillmentStatus?.item_quantity || 0
                                // lokiLogger.info(`--------returned_item_count--------------- ${item.returned_item_count}`)
                                // orderSchema.settle_status = SETTLE_STATUS.DEBIT
                            }
                            item.fulfillment_status = fulfillmentStatus?.state?.descriptor?.code;
                            item.product = temp.product;
                            //item.quantity = item.quantity.count
                            updateItems.push(item)
                        }
                        console.log("updateItems", updateItems)
                        //get item from db and update state for item
                        orderSchema.items = updateItems;
                        orderSchema.fulfillments = protocolUpdateResponse?.message?.order?.fulfillments;
                        orderSchema.remaining_cart_value = protocolUpdateResponse?.message?.order?.qoute?.price?.value;

                        await addOrUpdateOrderWithdOrderId(
                            protocolUpdateResponse.message.order.id,
                            { ...orderSchema }
                        );

                    }
                }
                lokiLogger.info(`protocolUpdateResponse final ----------------${JSON.stringify(protocolUpdateResponse)}`)
                return protocolUpdateResponse;
            }

        }
        catch (err) {
            lokiLogger.info(`onUpdateDbOperation Error ------------------ ${err}`)
            throw err;
        }
    }

}



export default UpdateOrderService;
