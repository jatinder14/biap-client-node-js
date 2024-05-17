import axios from "axios";
import preparedCollectorRecon from "../../order/v1/db/preparedCollectorRecon.js"
import OrderMongooseModel from "../../order/v1/db/order.js"
import { SETTLE_STATUS } from "../../utils/constants.js"

export const onPrepareRecon = async (payload) => {
  try {
    const { recon_id, status, collector_recon } = payload;
    const rsp_uri = process.env.RSP_URI;
    console.log("collector_recon =========== ", JSON.stringify(collector_recon))

    collector_recon.context.timestamp = new Date().toISOString()
    let axiosRes = await axios.post(`${rsp_uri}/collector_recon`, collector_recon)
    if (axiosRes?.data?.message?.ack?.status?.toLowerCase() == "ack") {
      await preparedCollectorRecon.findOneAndUpdate(
        { recon_id },
        { recon_id, status, collector_recon, is_settlement_sent },
        { upsert: true, new: true }
      );
    }
  } catch (err) {
    console.log("onPrepareRecon =========== ", err?.message)
    throw err
  }
}
