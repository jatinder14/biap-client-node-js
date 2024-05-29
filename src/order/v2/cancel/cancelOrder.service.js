import { onOrderCancel } from "../../../utils/protocolApis/index.js";
import {
  ORDER_STATUS,
  PROTOCOL_CONTEXT,
  SETTLE_STATUS,
} from "../../../utils/constants.js";
import RazorPayService from "../../../razorPay/razorPay.service.js";
import {
  addOrUpdateOrderWithTransactionId,
  addOrUpdateOrderWithTransactionIdAndProvider,
  addOrUpdateOrderWithTransactionIdAndOrderId,
  getOrderById
} from "../../v1/db/dbService.js";

import BppCancelService from "./bppCancel.service.js";
import ContextFactory from "../../../factories/ContextFactory.js";
import CustomError from "../../../lib/errors/custom.error.js";
import NoRecordFoundError from "../../../lib/errors/no-record-found.error.js";
import OrderMongooseModel from "../../v1/db/order.js";
import lokiLogger from "../../../utils/logger.js";
import logger from "../../../utils/logger.js";
import Refund from "../db/refund.js";
import {sendEmail} from "../../../shared/mailer.js"





const bppCancelService = new BppCancelService();
const razorPayService = new RazorPayService()

class CancelOrderService {
  /**
   * cancel order
   * @param {Object} orderRequest
   */
  async cancelOrder(orderRequest) {
    try {
      console.log("cancel order-------------->", orderRequest);

      lokiLogger.info('cancel order-------------->', orderRequest)

      const orderDetails = await getOrderById(orderRequest.message.order_id);
      const cancelledOrders = orderDetails[0]?.state 

      if(cancelledOrders=== "Cancelled"){
        throw new Error("Order has already been cancelled");
      }
     else{
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

  async onCancelOrderDbOperation(messageId) {
    try {
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
            ? fulfillments.find(
              (el) => el?.state?.descriptor?.code === "Cancelled",
            )
            : {};

          const dbResponse = await OrderMongooseModel.find({
            transactionId: protocolCancelResponse.context.transaction_id,
            id: protocolCancelResponse.message.order.id,
          });
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
                  orderIds:newOrderdetails?.id,
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
                  // itemId: dbResponse.items[0].id,     will correct it after teammate [ritu] task to store return item details  - todo
                  // itemQty: dbResponse.items[0].quantity.count,
                  isRefunded: true,
                  transationId: order_details?.transactionId,
                  razorpayPaymentId: order_details?.payment?.razorpayPaymentId
                })
                lokiLogger.info(`refundDetails>>>>>>>>>>, ${JSON.stringify(refundDetails)}`)


              }
            }
            const orderSchema = dbResponse?.[0].toJSON();
            orderSchema.state = protocolCancelResponse?.message?.order?.state;
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



            await addOrUpdateOrderWithTransactionIdAndOrderId(
              protocolCancelResponse.context.transaction_id,
              protocolCancelResponse.message.order.id,
              { ...orderSchema }
            );
          }
        }


        return protocolCancelResponse;
      }
    } catch (err) {
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
      // console.log(
      //     `latest_fulfillment ======  ${JSON.stringify(latest_fulfillment)}`,
      // );
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
      // this will work if the product is delivered --todo
      {
        let totalCharges = 0;
        let quoteBreakup = obj?.message?.order?.quote?.breakup || [];

        let full_Cancel_by_seller = true;
        let full_Cancel_by_user = true;
        const uniqueItems = {};
        // Counter for items with quantity count = 0
        let countZeroQuantity = 0;
        let items = obj?.message?.order?.items || [];
        items.forEach(item => {
            uniqueItems[item.id] = item; // Store unique items by id
            if (item.quantity.count === 0) {
                countZeroQuantity++;
            }
        });        
        const uniqueItemCount = Object.keys(uniqueItems).length;
        full_Cancel_by_seller = (uniqueItemCount == countZeroQuantity)? true : full_Cancel_by_seller
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
    }
    return totalRefundAmount;
  }
}

export default CancelOrderService;
