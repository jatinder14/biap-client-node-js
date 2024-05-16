import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import moment from "moment";
import _ from "underscore";
import order from "../../order/v1/db/order.js";
import OnConfirmData from "../../order/v1/db/onConfirmDump.js";
import { rsp_constants } from "../../utils/rspConstant.js";
import { PAYERDETAIL } from "../../utils/constants.js";
import { ajv_validate } from "../../middlewares/validator.js";
import { sendEmail } from "../../shared/mailer.js";
import logger from "../../utils/logger.js";
import { onOrderConfirm } from "../../utils/protocolApis/index.js";
import prepareReconSchema from "../rsp_schema/prepare_recon.js";

export const initiateRsp = async () => {
  try {
    const rsp_uri = process.env.RSP_URI;
    const baseUrl = "prepare_recon";
    let currentTimestamp = new Date().toISOString();
    let maxFutureTimestamp = new Date();
    maxFutureTimestamp.setMinutes(maxFutureTimestamp.getMinutes() + 5);

    if (currentTimestamp > maxFutureTimestamp) {
      const adjustedTimestamp = new Date(currentTimestamp);
      adjustedTimestamp.setMinutes(adjustedTimestamp.getMinutes() - 10);
      currentTimestamp = adjustedTimestamp.toISOString();
    }

    let orderDetails = await order.find({
      $and: [
        { state: "Completed" },
        { "payment.status": "PAID" },
        // { settle_status: { $in: ["pending", "settle"] }},
        { is_settlement_sent: false },
      ],
    });
    let orderIds = [], userEmails = [];
    orderDetails = orderDetails.filter((el) => {
      let maxReturnWindowObj = el.items[0];
      let maxReturnWindowMinutes = 0;

      el.items.forEach((entry) => {
        const returnWindow = entry?.product?.["@ondc/org/return_window"];
        if (returnWindow) {
          const returnWindowMinutes = parseDurationToMinutes(returnWindow);
          if (returnWindowMinutes > maxReturnWindowMinutes) {
            maxReturnWindowMinutes = returnWindowMinutes;
            maxReturnWindowObj = entry;
          }
        }
      });
      const returnLastDate = addDurationToDate(
        el.updatedAt,
        maxReturnWindowObj?.product?.["@ondc/org/return_window"]
      );
      if (returnLastDate.getTime() < new Date().getTime()) {
        orderIds.push(el.id);
        return el;
      }
    });

    const prepare_payload = await Promise.allSettled(
      orderDetails.map(async (el) => {
        let protocolConfirmResponse = await onOrderConfirm(el.messageId);
        const quote_total = el?.quote?.price?.value ? Number(el?.quote?.price?.value) : 0;
        if (protocolConfirmResponse?.message?.order?.fulfillments?.[0]?.start?.contact?.email) {
          userEmails.push(protocolConfirmResponse?.message?.order?.fulfillments?.[0]?.start?.contact?.email)
        }
        return {
          transaction_details: {
            collector: {
              id: protocolConfirmResponse?.context?.bap_id,
              url: protocolConfirmResponse?.context?.bap_uri
            },
            receiver: {
              id: protocolConfirmResponse?.context?.bpp_id,
              url: protocolConfirmResponse?.context?.bpp_uri
            },
            payment_gateway: [
              {
                reference_id: el?.payment?.razorpayPaymentId,
                quote: {
                  subtotal: quote_total,
                  subtotal_excluding_tax: quote_total,
                  tax: null,
                  total: quote_total,
                  total_excluding_tax: quote_total,
                },
                status: el?.payment?.status,
                payment_date: el?.payment?.time?.timestamp,
                invoice_pdf_url: el?.payment?.uri,
                collection_method: "RAZORPAY",
              },
            ],
            network: [
              {
                payment_reference_id: el?.payment?.params?.transaction_id || el?.payment?.razorpayPaymentId,
                message_id: el.messageId,
                payment_gateway_id: el?.payment?.razorpayPaymentId,
                latest_on_action: [protocolConfirmResponse],
              },
            ],
          },
        }
      }));

    const request_body = {
      orders: prepare_payload
    }
    const { valid, validate } = ajv_validate(
      { body: request_body },
      prepareReconSchema,
      "body"
    );

    if (!valid) {
      const errors = validate.errors?.map((error) => ({ message: error?.message, dataPath: error.schemaPath })) || [];
      console.log("errors in prepare recon =========== ", errors);
      return { success: false };
    }

    console.log("prepare recon url =========== ", `${rsp_uri}/${baseUrl}`);
    let axiosRes = await axios.post(`${rsp_uri}/${baseUrl}`, request_body);
    if (axiosRes?.data?.ack?.status?.toLowerCase() == "ack") {
      await recordCollectorReconStatus(orderIds);
      if (userEmails.length && orderIds.length) {
        await sendEmail({
          userEmails: userEmails,
          orderIds: orderIds,
          HTMLtemplate: "/template/collector.ejs",
          userName: "",
          subject: "Payment Settlements intiated to you, See the details",
        });
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error(`initiateRsp error.rsp: Cron : ${error.message}`);
    return error;
  }
};

async function recordCollectorReconStatus(orderIds) {
  try {
    return await order.updateMany(
      { id: { $in: orderIds } },
      { $set: { is_settlement_sent: true } }
    );
  } catch (err) {
    return false;
  }
}

export const addDurationToDate = (date, isoDuration) => {
  const currentDate = new Date(date);
  const maxDurationMinutes = parseDurationToMinutes(isoDuration);
  currentDate.setMinutes(currentDate.getMinutes() + maxDurationMinutes);
  return currentDate;
};

const parseDurationToMinutes = (isoDuration) => {
  const match = isoDuration.match(/P(\d+D)?T?(\d+H)?(\d+M)?/);
  if (!match) return 0;

  const days = match[1] ? parseInt(match[1]) : 0;
  const hours = match[2] ? parseInt(match[2]) : 0;
  const minutes = match[3] ? parseInt(match[3]) : 0;

  return days * 24 * 60 + hours * 60 + minutes;
};

const groupedByBapId = (data) => {
  return data.reduce((result, currentObject) => {
    const bapId = currentObject.bap_id;
    if (!result[bapId]) {
      result[bapId] = [];
    }

    result[bapId].push(currentObject);

    return result;
  }, {});
};
