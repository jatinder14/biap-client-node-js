// // import { PrismaClient } from "@prisma/client";
// // import { axiosONDCPost } from "../../shared/axios_call";
// // import wrap from "../../shared/async_handler";
// import {on_receiver_recon_payload} from "../rsp_mapper/on_receiver_recon.js";
// import {OnReceiverReconschema} from "../rsp_schema/on_receiver_recon.js";
// // import { addOnActionCall } from "../../magento/services/add_on_action";
// import {validate_schema_collector_recon_NTS10_for_json} from "../../shared/schemaValidator.js"
// // import { logger } from "../../shared/logger";
// // import { actions } from "../../shared/constants";


// const on_receiver_recon = async (data) => {
//   try {
//   //  await addOnActionCall(on_receiver_recon_payload, null, false)
//   //  validateRequest(on_receiver_recon_schema, on_receiver_recon_payload)
//   // await axiosONDCPost(actions.ON_RECEIVER_RECON, on_receiver_recon_payload, data.context.bap_uri)
//    console.log("data>>>>>>>>>>>>>",  data)
//     return { res: on_receiver_recon_payload(data)};
//   } catch (error) {
//     console.log(`receiver_recon: ${error.message}`);
//     return 
//   }
// };

// export const Recon_controller = {
//   receiver_recon: (async (req, res) => {

//   // receiver_recon: wrap(async (req, res) => {
//     // res.send("26?>>>>>>>")
//     const payload = req.body;
//     console.log(`Called - receiver_recon: ${JSON.stringify(payload)}`);
//     return await on_receiver_recon(payload);
//   }),

// //   confirm_payment_status: wrap(async (req, res) => {
// //     const payload = req.body;
// //     const isExists = await prisma.orderDetails.findFirst({ where: { buyer_order_id: payload.order_id } });
// //     if (isExists) {
// //       await prisma.orderDetails.update({
// //         where: { buyer_order_id: payload.order_id },
// //         data: {
// //           order_recon_status: payload.order_recon_status,
// //           counterparty_recon_status: payload.counterparty_recon_status,
// //           counterparty_diff_amount_value: payload.counterparty_diff_amount_value,
// //           counterparty_diff_amount_currency: payload.counterparty_diff_amount_currency,
// //           receiver_settlement_message: payload.receiver_settlement_message,
// //           receiver_settlement_message_code: payload.receiver_settlement_message_code,
// //           updated_at: new Date(),
// //         },
// //       });
// //     }

// //     return res.status(200).json({
// //       status: true,
// //       message: { ack: { status: "ACK" } },
// //     });
// //   }),
// };

