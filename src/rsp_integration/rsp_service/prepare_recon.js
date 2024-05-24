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
        { "payment.razorpayPaymentId": { $exists: true } },
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

    const prepare_payload = await Promise.all(
      orderDetails.map(async (el) => {
        let protocolConfirmResponse = await onOrderConfirm(el.messageId);
        protocolConfirmResponse = protocolConfirmResponse?.[0] || {};
        const quote_total = el?.quote?.price?.value ? Number(el?.quote?.price?.value) : 0;
        if (protocolConfirmResponse?.message?.order?.fulfillments?.[0]?.start?.contact?.email) {
          userEmails.push(protocolConfirmResponse?.message?.order?.fulfillments?.[0]?.start?.contact?.email)
        }
        const confirm_order_payment = protocolConfirmResponse?.message?.order?.payment
        let settlement_details = confirm_order_payment['@ondc/org/settlement_details']
        let buyer_app_finder_fee_type = confirm_order_payment['@ondc/org/buyer_app_finder_fee_type']
        let buyer_app_finder_fee_amount = confirm_order_payment['@ondc/org/buyer_app_finder_fee_amount']
        const finder_fee = buyer_app_finder_fee_amount ? 0 : Number(buyer_app_finder_fee_amount)
        const buyerPercentage = Number(confirm_order_payment?.paid_amount) * (finder_fee / 100)
        const withHoldAmount = !confirm_order_payment['@ondc/org/withholding_amount'] ? 0 : Number(confirm_order_payment['@ondc/org/withholding_amount'])

        const settlementAmount = buyer_app_finder_fee_type?.toLowerCase() == 'percent' ?
            Number(confirm_order_payment?.paid_amount) - buyerPercentage - withHoldAmount
            : Number(confirm_order_payment?.paid_amount) - finder_fee - withHoldAmount

        settlement_details = settlement_details.map(el => {
            el.settlement_status = PROTOCOL_PAYMENT["NOT-PAID"]
            el.beneficiary_address = storedOrder?.billing?.address?.city
            el.settlement_amount = settlementAmount
            return el
        })
        if (protocolConfirmResponse?.message?.order?.payment) protocolConfirmResponse.message.order.payment['@ondc/org/settlement_details'] = settlement_details
            
        console.log("el?.payment?.time ------------------ ", settlement_details, el?.payment, el?.payment?.time);
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
                reference_id: "N122243013755541", // el?.payment?.razorpayPaymentId,  - Need static for now as RSP allow only this for testing
                quote: {
                  subtotal: quote_total,
                  subtotal_excluding_tax: quote_total,
                  tax: null,
                  total: 5000, // quote_total,   - Need static for now as RSP allow only this for testing
                  total_excluding_tax: quote_total,
                },
                status: el?.payment?.status?.toLowerCase() == "paid" ? "COMPLETED" : "PENDING",
                payment_date: "2024-05-01T08:05:19.410Z", // el?.payment?.time?.timestamp, // NEED TO CHEDK for real time data and   - Need static for now as RSP allow only this for testing
                invoice_pdf_url: el?.payment?.uri || "", // 
                collection_method: "CREDIT_CARD", // CREDIT_CARD, DEBIT_CARD, NET_BANKING, UPI   - Need static for now as RSP allow only this for testing
              },
            ],
            network: [
              {
                payment_reference_id: "N122243013755541", // el?.payment?.razorpayPaymentId,   - Need static for now as RSP allow only this for testing
                // payment_gateway_id: el?.payment?.razorpayPaymentId,
                latest_on_action: protocolConfirmResponse,
              },
            ],
          },
        }
      }));

    const request_body = {
      orders: prepare_payload
    }
    console.log("==================================================", JSON.stringify(request_body));
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
