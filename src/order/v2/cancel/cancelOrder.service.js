import { v4 as uuidv4 } from "uuid";
import { onOrderCancel, protocolUpdate } from "../../../utils/protocolApis/index.js";
import Order from "../../v1/db/order.js"
import {
  ORDER_STATUS,
  PROTOCOL_CONTEXT,
  SETTLE_STATUS,
  ORDER_TYPE
} from "../../../utils/constants.js";
import RazorPayService from "../../../razorPay/razorPay.service.js";
import {
  addOrUpdateOrderWithTransactionIdAndOrderId,
  getOrderById,
  getOrderBasicDetailsById,
  getTotalOrderedItemsCount,
  getTotalItemsCountByAction,
  getOrderByIdAndTransactionId
} from "../../v1/db/dbService.js";


import BppCancelService from "./bppCancel.service.js";
import ContextFactory from "../../../factories/ContextFactory.js";
import CustomError from "../../../lib/errors/custom.error.js";
import NoRecordFoundError from "../../../lib/errors/no-record-found.error.js";
import OrderMongooseModel from "../../v1/db/order.js";
import lokiLogger from "../../../utils/logger.js";
import logger from "../../../utils/logger.js";
import Refund from "../db/refund.js";
import { sendEmail } from "../../../shared/mailer.js"
import Settlements from "../db/settlement.js";
import { checkFulfillmentExists, createNewFullfillmentObject, getFulfillmentById, getFulfillmentByOrderId } from "../../v1/db/fullfillmentHistory.helper.js";


const bppCancelService = new BppCancelService();
const razorPayService = new RazorPayService()

class CancelOrderService {
  /**
   * INFO: cancel order
   * @param {Object} orderRequest
   */
  async cancelOrder(orderRequest) {
    try {
      if (!orderRequest?.message?.order_id) {
        throw new CustomError("Order Id is mandatory");
      }
      if (!orderRequest?.message?.cancellation_reason_id) {
        throw new CustomError("Reason Id is mandatory");
      }
      const orderDetails = await getOrderBasicDetailsById(orderRequest.message.order_id);
      const cancelledOrders = orderDetails?.state

      if (cancelledOrders === "Cancelled") {
        throw new Error("Order has already been cancelled");
      }
      else {
        const contextFactory = new ContextFactory();
        const context = contextFactory.create({
          action: PROTOCOL_CONTEXT.CANCEL,
          transactionId: orderDetails.transactionId,
          bppId: orderRequest?.context?.bpp_id,
          bpp_uri: orderDetails?.bpp_uri,
          cityCode: orderDetails?.city,
          city: orderDetails?.city,
          domain: orderDetails?.domain,
        });
        if (!context?.bpp_id) {
          throw new CustomError("BPP Id is mandatory");
        }

        if (orderRequest?.message?.payment_return_destination) {
          await OrderMongooseModel.findOneAndUpdate(
            { id: orderRequest.message.order_id },
            { $set: { payment_origin_source: orderRequest?.message?.payment_origin_source, payment_return_destination: orderRequest?.message?.payment_return_destination } },
            { upsert: true, new: true }
          );
        }

        return await bppCancelService.cancelOrder(
          context,
          orderRequest?.message?.order_id,
          orderRequest?.message?.cancellation_reason_id,
        )
      }

    } catch (err) {
      console.log("err cancelOrder service ---------------- ", err);
      throw err;
    }
  }

  /**
   * on cancel order
   * @param {Object} messageId
   */
  async onCancelOrder(messageId) {
    try {
      let protocolCancelResponse = await onOrderCancel(messageId);
      if (!(protocolCancelResponse && protocolCancelResponse.length)) {
        const contextFactory = new ContextFactory();
        const context = contextFactory.create({
          messageId: messageId,
          action: PROTOCOL_CONTEXT.ON_CANCEL,
        });

        return {
          context,
          success: false,
          error: {
            message: "No data found",
          },
        };
      } else {
        if (!protocolCancelResponse?.[0].error && protocolCancelResponse?.[0]?.message?.order?.state) {
          protocolCancelResponse = protocolCancelResponse?.[0];
          let quoteTrailSum = 0;

          const fulfillments = protocolCancelResponse.message?.order?.fulfillments;
          if (Array.isArray(fulfillments)) {
            fulfillments.forEach(fulfillment => {
              fulfillment.tags.forEach(tag => {
                if (tag.code === 'quote_trail') {
                  tag.list.forEach(item => {
                    quoteTrailSum += Math.abs(parseFloat(item.value)) || 0;
                  });
                }
              });
            });
          } 

          const updateOrderState = await Order.findOneAndUpdate(
            { id: protocolCancelResponse?.message?.order?.id },
            { state: protocolCancelResponse?.message?.order?.state,
              refunded_amount: quoteTrailSum
             },
            { new: true }
          );
        }
        return protocolCancelResponse;
      }
    } catch (err) {
      console.log("error onCancelOrder ----", err)
      if (err?.response?.data) {
        return err?.response?.data;
      } else if (err?.message) {
        return {
          success: false,
          message: "We are encountering issue while canceling this order",
          error: err?.message
        }
      } else {
        return {
          success: false,
          message: "We are encountering issue while canceling this order!"
        }
      }
    }
  }

  /**
   * INFO: manage cancel state and send update to SNP
   * @param {String} messageId 
   * @returns 
   */
  async onCancelOrderDbOperation(messageId) {
    try {
      // await new Promise((resolve) => setTimeout(resolve, 20000)) // Just for pramaan report
      let protocolCancelResponse = await onOrderCancel(messageId);
      if (!(protocolCancelResponse && protocolCancelResponse.length)) {
        const contextFactory = new ContextFactory();
        const context = contextFactory.create({
          messageId: messageId,
          action: PROTOCOL_CONTEXT.ON_CANCEL,
        });

        return {
          context,
          success: false,
          error: {
            message: "No data found",
          },
        };
      } else {
        if (!protocolCancelResponse?.[0].error) {
          protocolCancelResponse = protocolCancelResponse?.[0];
          const responseOrderData = protocolCancelResponse.message.order;
          const transactionId = protocolCancelResponse.context.transaction_id;
          const dbResponse = await getOrderByIdAndTransactionId(transactionId, responseOrderData.id)
          if (!(dbResponse || dbResponse.length))
            throw new NoRecordFoundError();
          else {
            let fulfillments = protocolCancelResponse?.message?.order?.fulfillments || [];
            let latest_fulfillment = fulfillments.length
              ? fulfillments.find(
                (el) => el?.state?.descriptor?.code === "RTO-Initiated",
              ) : {};

            if (!latest_fulfillment) {
              latest_fulfillment = fulfillments.length
                ? fulfillments.find(
                  (el) => el?.state?.descriptor?.code === "Cancelled",
                ) : {};
            }
            let refundAmount = 0;
            let refunded_amount = 0;
            //RTO scenario is for pramaan flow-4 RTO-Initiated case  
            if (latest_fulfillment?.type == "RTO" && latest_fulfillment?.state?.descriptor?.code === "RTO-Initiated")
{              refundAmount = this.calculateRefundAmountForRtoCASE(protocolCancelResponse);
  console.log('refundAmount192', refundAmount)
}            else
{              refundAmount = this.calculateRefundAmountForFullOrderCancellationBySellerOrBuyer(protocolCancelResponse);
  console.log('refundAmount195', refundAmount)

}
            let order_details = dbResponse?.[0]?.toJSON();
            let checkFulfillmentAlreadyExist = await checkFulfillmentExists(latest_fulfillment?.id, order_details?.id, latest_fulfillment?.state?.descriptor?.code);
            let razorpayPaymentId = order_details?.payment?.razorpayPaymentId
            if (!checkFulfillmentAlreadyExist) {
              if (latest_fulfillment || latest_fulfillment?.type == "Cancel") {
                if (razorpayPaymentId && refundAmount) {
                  let razorpayRefundAmount = Math.abs(refundAmount).toFixed(2) * 100;
                  lokiLogger.info(`------------------amount-passed-to-razorpay-- ${razorpayRefundAmount}`)

                  let response = await razorPayService.refundOrder(razorpayPaymentId, razorpayRefundAmount)
                  refunded_amount = (response?.amount && response?.amount > 0) ? (response?.amount) / 100 : response?.amount

                  const refundDetails = await Refund.create({
                    orderId: order_details?.id,
                    refundId: response?.id,
                    refundedAmount: refunded_amount,
                    isRefunded: true,
                    transationId: order_details?.transactionId,
                    razorpayPaymentId: order_details?.payment?.razorpayPaymentId
                  })
                  const HTMLtemplate = order_details?.plateform === "app" ? "/appTemplate/refund.ejs" : "/template/refund.ejs";

                  await sendEmail({
                    userEmails: order_details?.billing?.email,
                    orderIds: order_details?.id,
                    HTMLtemplate,
                    userName: order_details?.billing?.name || "",
                    subject: "Refund Processed | Your Refund has been Processed to Your account",
                    itemName: order_details?.billing?.email,
                    itemPrice: razorpayRefundAmount,
                  });
                }
              }
            }
            const orderSchema = order_details
            lokiLogger.info(`refunded_amount >>>>>>>>>>, ${refunded_amount} --------- ${orderSchema?.refunded_amount}`)
            orderSchema.refunded_amount = refunded_amount + orderSchema?.refunded_amount;
            const totalItemsOrderedCount = await getTotalOrderedItemsCount(responseOrderData.id)
            const totalCancelledItemsCount = await getTotalItemsCountByAction(responseOrderData.id, "Cancelled")


            let incomingItemQuoteTrailData = {};
            const fullfillmentHistoryData = await getFulfillmentByOrderId(orderSchema.id)
            protocolCancelResponse?.message?.order?.fulfillments.forEach(async (incomingFulfillment) => {
              const newfullfilmentObject = createNewFullfillmentObject(incomingFulfillment, fullfillmentHistoryData, protocolCancelResponse?.message?.order, responseOrderData.id, incomingItemQuoteTrailData)
              if (newfullfilmentObject) {
                newfullfilmentObject.save()
              }
            })
            const incommingCount = incomingItemQuoteTrailData?.[ORDER_TYPE.CANCEL]?.totalCancelledItems ? Number(incomingItemQuoteTrailData?.[ORDER_TYPE.CANCEL]?.totalCancelledItems) : 0
            if (totalItemsOrderedCount == (Number(totalCancelledItemsCount) + incommingCount)) {
              orderSchema.state = protocolCancelResponse?.message?.order?.state
            }

            if (protocolCancelResponse?.message?.order?.state?.toLowerCase() ==
              ORDER_STATUS.COMPLETED
            ) {
              orderSchema.settle_status = SETTLE_STATUS.CREDIT;
            }
            if (protocolCancelResponse?.message?.order?.state?.toLowerCase() ==
              ORDER_STATUS.CANCELLED
            ) {
              orderSchema.settle_status = SETTLE_STATUS.DEBIT;
            }
            if (protocolCancelResponse?.message?.order?.state?.toLowerCase() ==
              ORDER_STATUS.RETURNED
            ) {
              orderSchema.settle_status = SETTLE_STATUS.DEBIT;
            }
            if (['RTO-Initiated', 'Cancelled', 'Return_Picked', 'Liquidated'].includes(latest_fulfillment?.state?.descriptor?.code)) {
              const orderId = protocolCancelResponse?.message?.order.id
              let oldSettlement = await Settlements.findOne({ orderId, fulfillmentId: latest_fulfillment.id })
              if (!oldSettlement) {
                let sContext = protocolCancelResponse.context;
                let settlementTimeStamp = new Date();
                //send update request
                let updateRequest = {
                  "context": {
                    "domain": sContext.domain,
                    "action": "update",
                    "core_version": "1.2.0",
                    "bap_id": sContext.bap_id,
                    "bap_uri": sContext.bap_uri,
                    "bpp_id": sContext.bpp_id,
                    "bpp_uri": sContext.bpp_uri,
                    "transaction_id": sContext.transaction_id,
                    "message_id": uuidv4(),
                    "city": sContext.city,
                    "country": sContext.country,
                    "timestamp": settlementTimeStamp
                  },
                  "message": {
                    "update_target": "payment",
                    "order": {
                      "id": orderId,
                      "fulfillments": [
                        {
                          "id": latest_fulfillment.id,
                          "type": latest_fulfillment.type
                        }
                      ],
                      "payment": {
                        "@ondc/org/settlement_details": [
                          {
                            "settlement_counterparty": "buyer",
                            "settlement_phase": "refund",
                            "settlement_type": "upi",
                            "settlement_amount": `${refundAmount}`,
                            "settlement_timestamp": settlementTimeStamp
                          }
                        ]
                      }
                    }
                  }
                }
                console.log('cancel upodate updateRequest ------ :>> ', JSON.stringify(updateRequest));
                let newSettlement = await Settlements();
                newSettlement.orderId = orderId;
                newSettlement.settlement = updateRequest;
                newSettlement.fulfillmentId = latest_fulfillment.id;
                await newSettlement.save();
                const response = await protocolUpdate(updateRequest);
                console.log('cancel upodate call ------ :>> ', response);
              }
            }
            await addOrUpdateOrderWithTransactionIdAndOrderId(
              transactionId,
              responseOrderData.id,
              { ...orderSchema }
            );
          }
        }
        return protocolCancelResponse;
      }
    } catch (err) {
      console.log('err onCancelOrderDbOperation ------>> ', err);
      throw err;
    }
  }

  /**
 * INFO: Function to calculate refund amount, When full cancel order is initiated by the seller
 * @param {object} obj 
 * @returns 
 */
  calculateRefundAmountForFullOrderCancellationBySellerOrBuyer(obj) {
    let totalRefundAmount = 0;
    lokiLogger.info(`obj ======  ${JSON.stringify(obj)}`);
    if (obj) {
      let sumOfNegativeValues = 0;
      let fulfillments = obj?.message?.order?.fulfillments || [];
      let latest_fulfillment;
      if (fulfillments.length) {
        latest_fulfillment = fulfillments.find(
          (el) =>
            el?.state?.descriptor?.code === "Cancelled" &&
            el?.type === "Cancel",
        );
      }
      if (latest_fulfillment) {
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

      let full_Cancel_by_seller = true;
      let full_Cancel_by_user = true;
      const uniqueItems = {};
      let countZeroQuantity = 0;
      let items = obj?.message?.order?.items || [];
      items.forEach(item => {
        uniqueItems[item.id] = item;
        if (item.quantity.count === 0) {
          countZeroQuantity++;
        }
      });
      const uniqueItemCount = Object.keys(uniqueItems).length;
      full_Cancel_by_seller = (uniqueItemCount == countZeroQuantity) ? true : full_Cancel_by_seller
      console.log("Number of unique items:", uniqueItemCount);
      console.log("Number of items with quantity count = 0:", countZeroQuantity);
      quoteBreakup.forEach((breakupItem) => {
        if (breakupItem?.["@ondc/org/item_quantity"]?.count !== undefined) {
          if (breakupItem?.["@ondc/org/item_quantity"]?.count != 0)
            full_Cancel_by_user = false;
          console.log(`Sum of quoteBreakup values: ${totalCharges}`);
          console.log(`full cancel by user: ${full_Cancel_by_user}`)
        }
      });
      // @@@@@ Need to check this if we need to return delivery amount as well @@@@@
      // if (full_Cancel_by_seller && !full_Cancel_by_user) {
      //   console.log(`full_Cancel_by_seller ---->> :  ${full_Cancel_by_seller}`);
      //   sumOfNegativeValues = 0;
      //   quoteBreakup.forEach((breakupItem) => {
      //     totalCharges += parseFloat(breakupItem?.price?.value) || 0;
      //   });
      // }
      console.log(`Sum of quoteBreakup values: ${totalCharges}`);
      totalRefundAmount = Math.abs(sumOfNegativeValues) + totalCharges;
      lokiLogger.info(`total price sum:  ${totalRefundAmount}`);
      return totalRefundAmount;

    }
    return totalRefundAmount;
  }

  /**
* INFO: Function to calculate refund amount, When RTO-Initiated by the seller
* @param {object} obj 
* @returns 
*/
  calculateRefundAmountForRtoCASE(obj) {
    let totalRefundAmount = 0;
    lokiLogger.info(`obj ======  ${JSON.stringify(obj)}`);
    if (obj) {
      let sumOfNegativeValues = 0;
      let fulfillments = obj?.message?.order?.fulfillments || [];
      let latest_fulfillment = fulfillments.length
        ? fulfillments.find(
          (el) => el?.state?.descriptor?.code === "RTO-Initiated",
        )
        : {};

      if (latest_fulfillment?.state?.descriptor?.code === "RTO-Initiated") {
        latest_fulfillment?.tags?.forEach((tag) => {
          if (tag?.code === "quote_trail") {
            tag?.list?.forEach((item) => {
              if (item?.code === "value") {
                let value = parseFloat(item?.value);
                if (!isNaN(value) && value < 0) {
                  sumOfNegativeValues += value;
                }
                //Remember we can pay the total order amount that user has paid to us that's why handling delivery amount here -RTO initiated
                else if (value >= 0) {
                  sumOfNegativeValues -= value;
                }
              }
            });
          }
        });
      }
      lokiLogger.info(`Sum of negative values:, ${sumOfNegativeValues}`);
      totalRefundAmount = Math.abs(sumOfNegativeValues);
      lokiLogger.info(`total price sum:  ${totalRefundAmount}`);
      return totalRefundAmount;

    }
    return totalRefundAmount;
  }
}

export default CancelOrderService;
