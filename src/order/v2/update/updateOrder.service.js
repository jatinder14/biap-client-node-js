import { onOrderCancel, onUpdateStatus } from "../../../utils/protocolApis/index.js";
import { PROTOCOL_CONTEXT, SETTLE_STATUS } from "../../../utils/constants.js";
import RazorPayService from "../../../razorPay/razorPay.service.js";
import {
    getOrderById, saveOrderRequest, getOrderRequest,
    addOrUpdateOrderWithdOrderId
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

const bppUpdateService = new BppUpdateService();
const razorPayService = new RazorPayService()

class UpdateOrderService {

    /**
    * cancel order
    * @param {Object} orderRequest
    */
    
    async update(orderRequest) {
        try {


            const orderDetails = await getOrderById(orderRequest.message.order.id);
            const contextFactory = new ContextFactory();
            const context = contextFactory.create({
                action: PROTOCOL_CONTEXT.UPDATE,
                bppId: orderDetails[0]?.bppId,
                transactionId: orderDetails[0]?.transactionId,
                bpp_uri: orderDetails[0]?.bpp_uri,
                cityCode: orderDetails[0]?.city,
                city: orderDetails[0]?.city,
                domain: orderDetails[0]?.domain
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

            let fulfillmentId;
            let tags = []
            for (let item of orderRequest.message.order.items) {

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
                                "value": "detailed description for return"
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
                dbFulfillment.reason_desc = 'detailed description for return'
                dbFulfillment.images = item.tags.image
                dbFulfillment.type = type
                dbFulfillment.id = fulfillmentId;
                await dbFulfillment.save();
            }

            let fulfilment =
            {
                "type": type,
                "tags": tags
            }

            fulfilments.push(fulfilment);

            //1. create a new fullfillment

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

            const { message = {} } = orderRequest || {};
            //const { update_target,order } = message || {};

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
    * cancel order
    * @param {Object} orderRequest
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
     * Send return to dashboard
     * @param {Object} order
     */

    async updateReturnOnEssentialDashboard(order) {
        try {
            const lastFulfillment =
                order?.message?.order?.fulfillments[
                order?.message?.order?.fulfillments.length - 1
                ];
            console.log("lastFulfillment --------------------", lastFulfillment);
            let returnState = lastFulfillment?.state?.descriptor?.code;
            const returnId = lastFulfillment?.id;

            const validReturnStates = ["Liquidated", "Rejected", "Reverse-QC"];

            const returnType = lastFulfillment?.type;

            // const essentialDashboardUri = process.env.ESSENTIAL_DASHBOARD_URI;
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
                console.log("Response from Essential Dashboard API:", JSON.stringify(response.data));
            } else {
                return;
            }
        } catch (error) {
            console.log("error updateReturnOnEssentialDashboard update order ===================", error);
            throw error;
        }
    }

    calculateRefundAmount(obj) {
        let fulfillments = obj?.message?.order?.fulfillments || [];
        let stateFilter = ["Return_Picked", "Return_Delivered"];
        let sumOfNegativeValues = 0;
        fulfillments.forEach(fulfillment => {
            let stateCode = fulfillment?.state?.descriptor?.code;
            if (stateFilter.includes(stateCode)) {
                fulfillment?.tags?.forEach(tag => {
                    if (tag?.code === "quote_trail") {
                        tag?.list?.forEach(item => {
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
        });
        console.log("Sum of negative values:", sumOfNegativeValues);
        // full order cancellation We need to return auxilliary charges amount as well

        let totalCharges = 0;
        let quoteBreakup = obj?.message?.order?.quote?.breakup || [];

        let full_Cancel = false;
        quoteBreakup.forEach(breakupItem => {
            if (breakupItem?.["@ondc/org/item_quantity"]?.count === 0)
                full_Cancel = true;
        });
        if (full_Cancel) {

            quoteBreakup.forEach(breakupItem => {
                totalCharges += parseFloat(breakupItem?.price?.value) || 0;
            });


        }

        lokiLogger.info(`Sum of quoteBreakup values: ${totalCharges}`);
        let totalRefundAmount = Math.abs(sumOfNegativeValues) + totalCharges;
        lokiLogger.info(`total price sum:  ${totalRefundAmount}`);
        return totalRefundAmount;

    }

    /**
    * on cancel order
    * @param {Object} messageId
    */
    async onUpdate(messageId) {
        try {
            let protocolUpdateResponse = await onUpdateStatus(messageId);

            lokiLogger.info(`protocolUpdateResponse_onUpdateStatus---1121>>>>> -------------${JSON.stringify(protocolUpdateResponse)}`)

            const totalRefundAmount = (protocolUpdateResponses) => {
                let totalAmount = 0;
                if (protocolUpdateResponses?.fulfillments && Array.isArray(protocolUpdateResponses?.fulfillments)) {
                    protocolUpdateResponses?.fulfillments.forEach(fulfillment => {
                      let tags = fulfillment?.tags;
                      if (tags && Array.isArray(tags)) {
                        tags.forEach(tag => {
                            if (tag?.code === 'quote_trail' && Array.isArray(tag.list)) {
                                tag.list.forEach(trailItem => {
                                    if (trailItem.code === 'value' && !isNaN(parseFloat(trailItem.value))) {
                                        totalAmount += parseFloat(trailItem.value);
                                    }
                                });
                            }
                        });
                        
                    }
                    });
                    return Math.abs(totalAmount)
                  }
            }
            // let totalRefundAmount = this.calculateRefundAmount(protocolUpdateResponse);

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
                        orderId: protocolUpdateResponse.message.order.id
                    })



                    dbResponse.save()
                    fullfillmentHistory.save()
                    lokiLogger.info(`protocolUpdateResponse>>>>>======= ${JSON.stringify(protocolUpdateResponse)}`)
                    if (protocolUpdateResponse) await this.updateReturnOnEssentialDashboard(protocolUpdateResponse)

                    //check if item state is liquidated or cancelled

                    //if there is update qoute recieved from on_update we need to calculate refund amount
                    // let totalAmount = 0
                    let totalAmount = this.calculateRefundAmount(protocolUpdateResponse);


                    if (latestFullfilement?.state?.descriptor?.code?.toLowerCase() == 'cancelled') {
                        // totalAmount = totalRefundAmount(protocolUpdateResponse)
                        totalAmount = this.calculateRefundAmount(protocolUpdateResponse)
                    }
                    else if (latestFullfilement?.state?.descriptor?.code?.toLowerCase() == 'liquidated') {
                        totalAmount = this.calculateRefundAmount(protocolUpdateResponse)
                    } 
                    
                    else if (latestFullfilement?.state?.descriptor?.code?.toLowerCase() == 'return_picked') {
                        // What if, the single item returned from order which have multiple item
                        totalAmount = protocolUpdateResponse?.message?.order?.quote?.price?.value
                    }

                    lokiLogger.info(`total amount calculation done ${totalAmount}`)
                    lokiLogger.info(`latestFullfilement?.state?.descriptor?.code?.toLowerCase() ${latestFullfilement?.state?.descriptor?.code?.toLowerCase()}`)

                    const orderRefunded = await Refund.findOne({ id: dbResponse.id }).lean().exec()

                    let razorpayPaymentId = dbResponse?.payment?.razorpayPaymentId

                    lokiLogger.info(`razorpayPaymentId_onUpdate----- ${razorpayPaymentId}`)

                    lokiLogger.info(`totalAmount_onUpdate-----, ${totalAmount}`)

                    if (!orderRefunded && dbResponse?.id && razorpayPaymentId && totalAmount) {
                        razorPayService
                            .refundOrder(razorpayPaymentId, Math.abs(totalAmount).toFixed(2)*100)
                            .then((response) => {
                                lokiLogger.info(`response_razorpay_on_update>>>>>>>>>> ${response}`)
                                const refundDetails = new Refund({
                                    orderId: dbResponse.id,
                                    refundId: response.id,
                                    refundedAmount: (response.amount) / 100,
                                    itemId: dbResponse.items[0].id,
                                    itemQty: dbResponse.items[0].quantity.count,
                                    isRefunded: true,
                                    transationId: dbResponse?.transactionId,
                                    razorpayPaymentId: dbResponse?.payment?.razorpayPaymentId

                                })
                                lokiLogger.info(`refundDetails>>>>>>>>>>, ${refundDetails}`)
                            })
                            .catch((err) => {
                                lokiLogger.info(`err_response_razorpay_on_update>>>>>>>>>>, ${err}`)
                                throw err
                            });

                    }

                }


            }
            lokiLogger.info(`protocolUpdateResponse----lastLine---->>>>> -------------${JSON.stringify(protocolUpdateResponse)}`)
            return protocolUpdateResponse;
        }


        catch (err) {
            throw err;
        }
    }

    async onUpdateDbOperation(messageId) {
        try {

            let protocolUpdateResponse = await onUpdateStatus(messageId);

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

                    console.log("orderDetails?.updatedQuote?.price?.value----->", protocolUpdateResponse.message.order.quote?.price?.value)
                    console.log("orderDetails?.updatedQuote?.price?.value---message id-->", protocolUpdateResponse.context.message_id)

                    const dbResponse = await OrderMongooseModel.find({
                        transactionId: protocolUpdateResponse.context.transaction_id,
                        id: protocolUpdateResponse.message.order.id
                    });

                    if (!(dbResponse || dbResponse.length))
                        throw new NoRecordFoundError();
                    else {

                        if (protocolUpdateResponse?.message?.update_target === 'billing') {
                            return protocolUpdateResponse;
                        }
                        const orderSchema = dbResponse?.[0].toJSON();
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

                        let protocolItems = protocolUpdateResponse?.message?.order.items

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
                            if (!existingFulfillment) {
                                await FulfillmentHistory.create({
                                    orderId: protocolUpdateResponse?.message?.order.id,
                                    type: fl.type,
                                    id: fl.id,
                                    state: fl.state.descriptor.code,
                                    updatedAt: protocolUpdateResponse?.message?.order?.updated_at?.toString()
                                })
                            }
                            // }

                            if (fl?.state?.descriptor?.code === 'Cancelled' || fl?.state?.descriptor?.code === 'Return_Picked' || fl?.state?.descriptor?.code === 'Liquidated') {
                                //calculate refund amount from qoute trail
                                //check if settlement already done!

                                let qouteTrails = fl.tags.filter(i => i.code === 'quote_trail');
                                let refundAmount = 0;
                                for (let trail of qouteTrails) {
                                    let amount = trail?.list?.find(i => i.code === 'value')?.value ?? 0;
                                    refundAmount += parseFloat(amount);
                                }

                                console.log("amount", refundAmount * -1);

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


                            // updatedItem = orderSchema.items.filter(element=> element.id === item.id && !element.tags); //TODO TEMP testing
                            updatedItem = orderSchema.items.filter(element => element.id === item.id);
                            let temp = updatedItem[0];
                            if (fulfillmentStatus.type === 'Return' || fulfillmentStatus.type === 'Cancel') {
                                item.return_status = fulfillmentStatus?.state?.descriptor?.code;
                                item.cancellation_status = fulfillmentStatus?.state?.descriptor?.code;
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

                        await addOrUpdateOrderWithdOrderId(
                            protocolUpdateResponse.message.order.id,
                            { ...orderSchema }
                        );

                    }
                }

                return protocolUpdateResponse;
            }

        }
        catch (err) {
            throw err;
        }
    }

}



export default UpdateOrderService;
