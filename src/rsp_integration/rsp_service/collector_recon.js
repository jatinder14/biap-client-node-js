import { addDays } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { ObjectId } from "mongodb";
import axios from "axios";
import moment from "moment";
import order from "../../order/v1/db/order.js";
import OnConfirmData from "../../order/v1/db/onConfirmDump.js";
import { rsp_constants } from "../../utils/rspConstant.js";
import {PAYERDETAIL} from '../../utils/constants.js'
// import collectorSchema from "../../rsp_integration/rsp_schema/collector_recon.js"
import { validate_schema_collector_recon_NTS10_for_json } from "../../shared/schemaValidator.js";
// Import Underscore.js in a JavaScript module environment
import _ from "underscore";

// import { logger } from "../../shared/logger";
// const uuid = uuidv4();

export const initiateRsp = async () => {
  try {
    const date = new Date().toISOString();

    let currentTimestamp = new Date().toISOString();
    let maxFutureTimestamp = new Date();
    maxFutureTimestamp.setMinutes(maxFutureTimestamp.getMinutes() + 5);

    if (currentTimestamp <= maxFutureTimestamp) {
      // If the current timestamp is within the acceptable range, send it to the server
      currentTimestamp;
    } else {
      // If the current timestamp exceeds the acceptable range, reduce the time by 10 minutes and send the adjusted timestamp to the server
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
    orderDetails = orderDetails.filter((el) => {
      const returnTime = el.items[0].product["@ondc/org/return_window"];
      const currentTime = moment();
      const endDate = moment(el.updatedAt).add(moment.duration(returnTime));
      const timeLeft = moment.duration(endDate.diff(currentTime));

      // Check if the return window has closed
      if (timeLeft.asMilliseconds() <= 0) {
        console.log("Return window closed");
        return el;
      } else if (timeLeft.asSeconds() > 10) {
        console.log("Time left is less than 10 seconds. Returning element:", el);
        return el;
      }
    });
    let orderIds = []
    const groupedData = groupedByBapId(orderDetails);
    const arrayOfArrays = Object.values(groupedData);
    await Promise.all(
      arrayOfArrays.map(async (el) => {
        const request_body = {};
        const baseUrl = "collector_recon";
        request_body.context = {
          domain: rsp_constants.DOMAIN,
          country: rsp_constants.COUNTRY,
          city: rsp_constants.CITY,
          action: baseUrl,
          core_version: rsp_constants.CORE_VERSION,
          bap_id: process.env.BAP_ID,
          bap_uri: process.env.CLIENT_WEBHOOK_ENDPOINT + "v2",

          bpp_id: process.env.RSP_ID,
          bpp_uri: process.env.RSP_URI,
          transaction_id: uuidv4(),
          message_id: uuidv4(),
          timestamp: currentTimestamp,

          // timestamp: "2024-03-22T06:31:22.724Z",
          ttl: "P3D",
        };
        console.log(
          `initiateRsp el : ${el?.length}, el[0]?.bpp_id: ${el[0]?.bppId}`
        );
        request_body.message = {};
        request_body.message.orderbook = {};
        request_body.message.orderbook.orders = await Promise.all(
          el.map(async (detail) => {
            const transactionId = detail.transactionId;
            orderIds.push(detail?.id)
            const on_confirm = await OnConfirmData.findOne({
              where: {
                transactionId,
                action: "on_confirm",
              },
            });

            const seller = await OnConfirmData.findOne({
              where: {
                bpp_uri: on_confirm.context.bpp_uri,
                bpp_id: on_confirm.context.bpp_id,
              },
            });

            const paymentObj = JSON.parse(on_confirm.message.order.payment);
            console.log('paymentObj---------------------->', paymentObj)
            console.log('seller--------->', seller)

            let bap_id = seller.context.bap_id;
            let bap_uri = seller.context.bap_uri;
            const objectId = detail?.id.toString();
            const buyerPercentage = (paymentObj.params.amount * Number(paymentObj['@ondc/org/buyer_app_finder_fee_amount'])) / 100
            const withHoldAmount = paymentObj['@ondc/org/withholding_amount']== undefined ? 0 : paymentObj['@ondc/org/withholding_amount']

            const settlementAmount= paymentObj["@ondc/org/buyer_app_finder_fee_type"].toLowerCase()=='percent'?
            paymentObj.params.amount - buyerPercentage - withHoldAmount
            : paymentObj.params.amount - paymentObj['@ondc/org/withholding_amount']

            const response = {
              id: objectId,
              invoice_no: uuidv4(),
              collector_app_id: bap_id,
              receiver_app_id: on_confirm.context?.bpp_id,
              receiver_app_uri: on_confirm.context?.bpp_uri, // seller.bpp_uri, // confirm BAP
              state: on_confirm.message.order.state,
              provider: {
                name: {
                  name: seller.message.order.fulfillments[0][
                    "@ondc/org/provider_name"
                  ], // NIL
                  code: seller.message.order.fulfillments[0].state.descriptor
                    .code, // NIL
                },
                address:
                  seller.message.order.fulfillments[0].start?.location?.address?.city || "India"
                ,
              },
              payment: {
                uri: orderDetails[0].payment.uri, // NIL],
                tl_method: orderDetails[0].payment.tl_method || "http/get", // if exist give tl method other wise dont dend tl method
                params: {
                  transaction_id: paymentObj.params.transaction_id, // NIL
                  transaction_status: paymentObj.status, // NIL
                  amount: paymentObj.params.amount,
                  currency: paymentObj.params.currency,
                },
                type: paymentObj.type,
                status: paymentObj.status,
                collected_by: paymentObj.collected_by,
                "@ondc/org/buyer_app_finder_fee_type":
                  paymentObj["@ondc/org/buyer_app_finder_fee_type"].toLowerCase(),
                "@ondc/org/buyer_app_finder_fee_amount":
                  paymentObj["@ondc/org/buyer_app_finder_fee_amount"],
                "@ondc/org/withholding_amount": paymentObj["@ondc/org/withholding_amount"] || 0, // Need to do in future
                "@ondc/org/return_window": "P6D",
                // "@ondc/org/collected_by_status": "Assert",
                // "@ondc/org/withholding_amount_status": "Assert",
                // "@ondc/org/return_window_status": "Assert",
                // "@ondc/org/settlement_basis": "", // Need to do in future
                // "@ondc/org/settlement_basis_status": "Assert",
                // "@ondc/org/settlement_window":   "", // Need to do in future
                // "@ondc/org/settlement_window_status": "Assert",
                "@ondc/org/settlement_details": [
                  {
                    settlement_counterparty:
                      paymentObj["@ondc/org/settlement_details"][0]
                        .settlement_counterparty,
                    settlement_phase:
                      paymentObj["@ondc/org/settlement_details"][0]
                        .settlement_phase,
                    settlement_amount: Number(settlementAmount.toFixed(2)),
                    settlement_type:
                      paymentObj["@ondc/org/settlement_details"][0]
                        .settlement_type,
                    settlement_bank_account_no:
                      paymentObj["@ondc/org/settlement_details"][0]
                        .settlement_bank_account_no,
                    settlement_ifsc_code:
                      paymentObj["@ondc/org/settlement_details"][0]
                        .settlement_ifsc_code || "HDFC900008",
                    upi_address:
                      paymentObj["@ondc/org/settlement_details"][0].upi_address, // NIL
                    bank_name:
                      paymentObj["@ondc/org/settlement_details"][0].bank_name,
                    branch_name:
                      paymentObj["@ondc/org/settlement_details"][0].branch_name,
                    beneficiary_name:
                      paymentObj["@ondc/org/settlement_details"][0]
                        .beneficiary_name,
                    beneficiary_address: 
                      seller?.message?.order?.fulfillments[0]?.start?.location
                        ?.address?.city || "India"
                    ,
                    settlement_status: "NOT-PAID",
                  },
                ],
              },
              withholding_tax_gst: {
                currency: "INR",
                value:
                  on_confirm.message.order.quote.breakup.find((obj) => {
                    return obj["title"] == "Tax";
                  })?.price?.value || "0",
              },
              withholding_tax_tds: {
                currency: "INR",
                value: "0",
              },
              deduction_by_collector: {
                currency: "INR",
                value: paymentObj["@ondc/org/buyer_app_finder_fee_amount"],
              },
              payerdetails: {
                payer_name:
                PAYERDETAIL.PAYER_NAME,
                payer_address:
                  PAYERDETAIL.PAYERADDRESS,
                payer_account_no:
                  PAYERDETAIL.PAYER_ACCOUNT_NO,
                payer_bank_code:  PAYERDETAIL.PAYER_BANK_CODE,
                payer_virtual_payment_address: PAYERDETAIL.PAYER_VIRTUAL_PAYMENT_ADDRESS, // NIL
              },
              settlement_reason_code: "01",
              created_at: date,
              updated_at: date,
            };
            return response;
          })
        );

        const rsp_uri = process.env.RSP_URI;
        const validateResult = validateRSPActionSchema(
          request_body,
          request_body.context.domain,
          baseUrl
        );
        if (!_.isEmpty(validateResult)) {
          return { success: false };
        }

        console.log('`${rsp_uri}/${baseUrl}`', `${rsp_uri}/${baseUrl}`)
        console.log('typeof request_body', typeof request_body)
        try {
          let axiosRes = await axios.post(`${rsp_uri}/${baseUrl}`, request_body)
          console.log('axiosRes------->', axiosRes.data)
        } catch (error) {
          return { success: false };
        }
        await recordCollectorReconStatus(orderIds)
        return { success: true };
      })
    );
  } catch (error) {
    console.error(`initiateRsp error.rsp: Cron : ${error.message}`);
    return error;
  }
};

async function recordCollectorReconStatus (orderIds) {
  try {
    return await order.updateMany({ id: { $in: orderIds } }, { $set: { is_settlement_sent: true }});
  } catch (err) {
    return false
  }
}

function groupedByBapId(orderDetails) {
  // Assuming orderDetails is an array of order objects with a property named 'bapId'
  const groupedData = {};
  for (const order of orderDetails) {
    const bppId = order.bppId; // Assuming the property name is 'bapId'

    if (!groupedData[bppId]) {
      groupedData[bppId] = [];
    }
    groupedData[bppId].push(order);
  }
  return groupedData;
}

export const validateRSPActionSchema = (data, domain, action) => {
  const errorObj = {};

  switch (domain) {
    case "ONDC:NTS10": {
      const schemaError = validateSchema("NTS10", action, data);
      if (schemaError !== "error") Object.assign(errorObj, schemaError);
      return isObjectEmpty(errorObj) ? false : errorObj;
    }

    default:
      return "Invalid Domain!! Please Enter a valid rsp domain";
  }
};
export const isObjectEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};
export const validateSchema = (domain, api, data) => {
  // logger.info(`Inside Schema Validation for domain: ${domain}, api: ${api}`)
  console.log(`Inside Schema Validation for domain: ${domain}, api: ${api}`);
  const errObj = {};
  const schmaVldtr = validate_schema_for_retail_json(domain, api, data);

  const datavld = schmaVldtr;
  if (datavld.status === "fail") {
    const res = datavld.errors;
    let i = 0;
    const len = res.length;
    while (i < len) {
      const key = `schemaErr${i}`;
      errObj[key] = `${res[i].details} ${res[i].message}`;
      i++;
    }
    console.log(`Schema Validation`, errObj);
    // logger.error(`Schema Validation`, errObj)
    return errObj;
  } else return "error";
};

const validate_schema_for_retail_json = (vertical, api, data) => {
  console.log("validate_schema_for_retail_json>>>>", vertical, api, data);
  console.log(
    "validate_schema_collector_recon_NTS10_for_json>>>>1234",
    data.context.timestamp
  );
  const res = validate_schema_collector_recon_NTS10_for_json(data);
  console.log("275>>>>>>>>>>>", `validate_schema_${api}_${vertical}_for_json`);

  try {
    console.log("res>>>>>>>>>>>>>", res);
    return res;
  } catch (error) {
    console.log(error);
  }
};
