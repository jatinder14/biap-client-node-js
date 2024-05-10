import { onOrderCancel } from "../../../utils/protocolApis/index.js";
import {
  ORDER_STATUS,
  PROTOCOL_CONTEXT,
  SETTLE_STATUS,
} from "../../../utils/constants.js";
// import razorPayService from "../../../razorPay/razorPay.service.js";
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



const bppCancelService = new BppCancelService();

class CancelOrderService {
  /**
   * cancel order
   * @param {Object} orderRequest
   */
  async cancelOrder(orderRequest) {
    try {
      console.log("cancel order-------------->", orderRequest);

      lokiLogger.info('cancel order-------------->',orderRequest)

      const orderDetails = await getOrderById(orderRequest.message.order_id);

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
      );
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

      if (!(protocolCancelResponse && protocolCancelResponse.length)) {
        const contextFactory = new ContextFactory();
        const context = contextFactory.create({
          messageId: messageId,
          action: PROTOCOL_CONTEXT.ON_CANCEL,
        });

        return {
          context,
          error: {
            message: "No data found",
          },
        };
      } else {
        if (!protocolCancelResponse?.[0].error) {
          protocolCancelResponse = protocolCancelResponse?.[0];
        }
        if (protocolCancelResponse?.message?.order?.state == ORDER_STATUS.CANCELLED) {
          const order=OrderMongooseModel.find({id:protocolCancelResponse?.message?.order?.id})

          lokiLogger.info("order_details_cancelOrder.service.js",order)
          lokiLogger.info("protocolCancelResponse-----",protocolCancelResponse)
            // razorPayService
            // .createOrder(amount, currency)
            // .then((user) => {
            //   res.json({ data: user });
            // })orderByID_FulfillmentHistoryAddedbService.js----------->
            // .catch((err) => {
            //   console.log("err", err);
            //   next(err);
            // });
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

      if (!(protocolCancelResponse && protocolCancelResponse.length)) {
        const contextFactory = new ContextFactory();
        const context = contextFactory.create({
          messageId: messageId,
          action: PROTOCOL_CONTEXT.ON_CANCEL,
        });

        return {
          context,
          error: {
            message: "No data found",
          },
        };
      } else {
        if (!protocolCancelResponse?.[0].error) {
          protocolCancelResponse = protocolCancelResponse?.[0];

          console.log(
            "protocolCancelResponse----------------->",
            protocolCancelResponse
          );

          // message: { order: { id: '7488750', state: 'Cancelled', tags: [Object] } }
          const dbResponse = await OrderMongooseModel.find({
            transactionId: protocolCancelResponse.context.transaction_id,
            id: protocolCancelResponse.message.order.id,
          });

          console.log("dbResponse----------------->", dbResponse);

          logger.info('dbResponseOnCancelOrderDbOperation----------------->',dbResponse)

          if (!(dbResponse || dbResponse.length))
            throw new NoRecordFoundError();
          else {  
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
}

export default CancelOrderService;
