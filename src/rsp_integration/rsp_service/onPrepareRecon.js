import axios from "axios";
import preparedCollectorRecon from "../../order/v1/db/preparedCollectorRecon.js"
import logger from "../../utils/logger.js";

export const onPrepareRecon = async (payload) => {
  try {
    const { recon_id, status, collector_recon } = payload;
    const rsp_uri = process.env.RSP_URI;
    logger.info(`collector_recon ====* ${JSON.stringify(collector_recon)}`);

    collector_recon.context.timestamp = new Date()
    let axiosRes = await axios.post(`${rsp_uri}/collector_recon`, collector_recon)
    if (axiosRes?.data?.error) console.log("axiosRes --------------- ", JSON.stringify(axiosRes?.data?.error));
    if (axiosRes?.data?.message?.ack?.status?.toLowerCase() == "ack") {
      await preparedCollectorRecon.findOneAndUpdate(
        { recon_id },
        { recon_id, status, collector_recon, is_settlement_sent },
        { upsert: true, new: true }
      );
    }
  } catch (err) {
    if (err?.response?.data?.error) console.log("axiosRes --------------- ", JSON.stringify(err?.response?.data?.error));
    console.log("onPrepareRecon Error=========== ", err?.message)
    throw err
  }
}
