import { v4 as uuidv4 } from "uuid";
import { onOrderCancel, protocolUpdate } from "../../../utils/protocolApis/index.js";
import {
  ORDER_STATUS,
  PROTOCOL_CONTEXT,
  SETTLE_STATUS,
} from "../../../utils/constants.js";
import RazorPayService from "../../../razorPay/razorPay.service.js";
import {
  addOrUpdateOrderWithTransactionIdAndOrderId,
  getOrderById,
  getTotalOrderedItemsCount,
  getTotalItemsCountByAction,
  getOrderByIdAndTransactionId
} from "../../v1/db/dbService.js";

import BppCancelService from "./bppCancel.service.js";
import ContextFactory from "../../../factories/ContextFactory.js";
import CustomError from "../../../lib/errors/custom.error.js";
import NoRecordFoundError from "../../../lib/errors/no-record-found.error.js";
import OrderMongooseModel from "../../v1/db/order.js";
import fulfillmentHistoryMongooseModel from "../db/fulfillmentHistory.js"
import lokiLogger from "../../../utils/logger.js";
import logger from "../../../utils/logger.js";
import Refund from "../db/refund.js";
import { sendEmail } from "../../../shared/mailer.js"
import Settlements from "../db/settlement.js";
import { createNewFullfilmentObject } from "../../v1/db/fullfillmentHistory.helper.js";




const bppCancelService = new BppCancelService();
const razorPayService = new RazorPayService()

class CancelOrderService {
  /**
   * INFO: cancel order
   * @param {Object} orderRequest
   */
  async cancelOrder(orderRequest) {
    try {
      const orderDetails = await getOrderById(orderRequest.message.order_id);
      const cancelledOrders = orderDetails[0]?.state

      if (cancelledOrders === "Cancelled") {
        throw new Error("Order has already been cancelled");
      }
      else {
        const contextFactory = new ContextFactory();
        const context = contextFactory.create({
          action: PROTOCOL_CONTEXT.CANCEL,
          transactionId: orderDetails[0].transactionId,
          bppId: orderRequest?.context?.bpp_id,
          bpp_uri: orderDetails[0].bpp_uri,
          cityCode: orderDetails[0].city,
          city: orderDetails[0].city,
          domain: orderDetails[0].domain,
        });

        let fulfillmentId = orderDetails[0].items[0].fulfillment_id;

        const { message = {} } = orderRequest || {};
        const { order_id, cancellation_reason_id } = message || {};

        if (!context?.bpp_id) {
          throw new CustomError("BPP Id is mandatory");
        }

        return await bppCancelService.cancelOrder(
          context,
          order_id,
          cancellation_reason_id,
          fulfillmentId
        )
      }

    } catch (err) {
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
      lokiLogger.info(`protocolCancelResponse--------- protocolCancelResponse ----------------${JSON.stringify(protocolCancelResponse)}`)

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
      await new Promise((resolve) => setTimeout(resolve, 30000)) // Just for pramaan report
      let protocolCancelResponse = await onOrderCancel(messageId);
      lokiLogger.info(`protocolCancelResponse inside ----------------${JSON.stringify(protocolCancelResponse)}`)

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
        lokiLogger.info(`protocolCancelResponse?.[0].error ----------------${protocolCancelResponse?.[0].error}`)
        if (!protocolCancelResponse?.[0].error) {
          protocolCancelResponse = protocolCancelResponse?.[0];
          let refundAmount = this.calculateRefundAmountForFullOrderCancellationBySeller(protocolCancelResponse);
          let fulfillments = protocolCancelResponse?.message?.order?.fulfillments || [];
          let latest_fulfillment = fulfillments.length
            ? fulfillments.find((el) => el?.state?.descriptor?.code === "Cancelled") : {};

          console.log("protocolCancelResponse----------------->", JSON.stringify(protocolCancelResponse));

          const responseOrderData = protocolCancelResponse.message.order;
          const transactionId = protocolCancelResponse.context.transaction_id;
          const dbResponse = await getOrderByIdAndTransactionId(transactionId, responseOrderData.id)

          logger.info(`dbResponseOnCancelOrderDbOperation-----------------> ${JSON.stringify(dbResponse)}`)        
          logger.info(`protocolCancelResponseOrderDbOperation-----------------> ${JSON.stringify(protocolCancelResponse)}`)

          if (!(dbResponse || dbResponse.length))
            throw new NoRecordFoundError();
          else {
            let order_details = dbResponse[0];
            let razorpayPaymentId = order_details?.payment?.razorpayPaymentId
            if (latest_fulfillment || latest_fulfillment?.type == "Cancel") {
              let newOrderdetails = order_details
              if (razorpayPaymentId && refundAmount) {
                let razorpayRefundAmount = Math.abs(refundAmount).toFixed(2) * 100;
                lokiLogger.info(`------------------amount-passed-to-razorpay-- ${razorpayRefundAmount}`)

                let response = await razorPayService.refundOrder(razorpayPaymentId, razorpayRefundAmount)

                await sendEmail({
                  userEmails: newOrderdetails?.billing?.email,
                  orderIds: newOrderdetails?.id,
                  HTMLtemplate: "/template/refund.ejs",
                  userName: newOrderdetails?.billing?.name || "",
                  subject: "Refund Processed | Your Refund has been Processed to Your account",
                  itemName: newOrderdetails?.billing?.email,
                  itemPrice: razorpayRefundAmount,
                });

                res.json(orders);
                lokiLogger.info(`response_razorpay_on_update>>>>>>>>>>177 ${JSON.stringify(response)}`)
                let order_details = dbResponse[0];
                const refundDetails = await Refund.create({
                  orderId: order_details?.id,
                  refundId: response?.id,
                  refundedAmount: (response?.amount && response?.amount > 0) ? (response?.amount) / 100 : response?.amount,
                  isRefunded: true,
                  transationId: order_details?.transactionId,
                  razorpayPaymentId: order_details?.payment?.razorpayPaymentId
                })
                lokiLogger.info(`refundDetails>>>>>>>>>>, ${JSON.stringify(refundDetails)}`)


              }
            }
            const orderSchema = dbResponse?.[0]?.toJSON();
            const totalItemsOrdered = await getTotalOrderedItemsCount(responseOrderData.id)
            const totalCancelledItems = await getTotalItemsCountByAction(responseOrderData.id, "Cancelled")

            lokiLogger.info(`totalItemsOrdered----------, ${totalItemsOrdered}`)

            lokiLogger.info(`totalCancelledItems-----------, ${totalCancelledItems}`)

            if (totalItemsOrdered == totalCancelledItems) {
              orderSchema.state = protocolCancelResponse?.message?.order?.state
            }

            const fullfillmentHistoryData = await fulfillmentHistoryMongooseModel.find({ orderId: orderSchema.id })
            protocolCancelResponse?.message?.order?.fulfillments.forEach(async (incomingFulfillment) => {
              const newfullfilmentObject = createNewFullfilmentObject(incomingFulfillment, fullfillmentHistoryData, orderSchema, responseOrderData.id)
              lokiLogger.info(`newfullfilmentObject-----------, ${JSON.stringify(newfullfilmentObject)}`)
              if (newfullfilmentObject) {
                newfullfilmentObject.save()
              }
            })       

            if (
              protocolCancelResponse?.message?.order?.state?.toLowerCase() ==
              ORDER_STATUS.COMPLETED
            ) {
              orderSchema.settle_status = SETTLE_STATUS.CREDIT;
            }
            if (
              protocolCancelResponse?.message?.order?.state?.toLowerCase() ==
              ORDER_STATUS.CANCELLED
            ) {
              orderSchema.settle_status = SETTLE_STATUS.DEBIT;
            }
            if (
              protocolCancelResponse?.message?.order?.state?.toLowerCase() ==
              ORDER_STATUS.RETURNED
            ) {
              orderSchema.settle_status = SETTLE_STATUS.DEBIT;
            }
            if (latest_fulfillment?.state?.descriptor?.code === 'Cancelled' || latest_fulfillment?.state?.descriptor?.code === 'Return_Picked' || latest_fulfillment?.state?.descriptor?.code === 'Liquidated') {
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
      console.log('err------ :>> ', err);
      throw err;
    }
  }

  /**
 * INFO: Function to calculate refund amount, When full cancel order is initiated by the seller
 * @param {object} obj 
 * @returns 
 */
  calculateRefundAmountForFullOrderCancellationBySeller(obj) {
    let totalRefundAmount = 0;
    lokiLogger.info(`obj ======  ${JSON.stringify(obj)}`);
    if (obj) {
      let sumOfNegativeValues = 0;
      let fulfillments = obj?.message?.order?.fulfillments || [];
      let latest_fulfillment = fulfillments.length
        ? fulfillments.find(
          (el) => el?.state?.descriptor?.code === "Cancelled",
        )
        : {};

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
      if (full_Cancel_by_seller && !full_Cancel_by_user) {
        console.log(`full_Cancel_by_seller ---->> :  ${full_Cancel_by_seller}`);
        sumOfNegativeValues = 0;
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
}

export default CancelOrderService;
