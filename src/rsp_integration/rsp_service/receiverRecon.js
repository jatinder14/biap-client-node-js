import axios from "axios"
import onRecieverRecon from "./onRecieverRecon.js";
import OrderMongooseModel from "../../order/v1/db/order.js"
import receiverReconSchema from "../rsp_schema/receiver_recon.js";
import logger from "../../utils/logger.js"
import { ajv_validate } from "../../middlewares/validator.js";


export const receiverRecon = async (payload) => {
  try {
    const { context, message } = payload
    logger.info(`Called - receiverRecon: ====* ${JSON.stringify(payload)}`);
    const buyerOrderId = message?.orderbook?.orders?.map(el => el.id)
    const ordersArray = await OrderMongooseModel.find({ id: { "$in": buyerOrderId } }).lean().exec()

    if (!ordersArray?.length) {
      return { success: false }
    }

    const difference = await calculatePriceDifference(message.orderbook.orders, ordersArray)

    const mappingData = {
      reconData: payload,
      priceDifference: difference,
    }

    const result = await onRecieverRecon(mappingData)
    logger.info(`on_receiver_recon payload: ${JSON.stringify(result)}`)

    const { valid, validate } = ajv_validate({ body: result }, receiverReconSchema, "body")
    if (!valid) {
      const errors = validate.errors?.map(error => ({
        message: error?.message,
        dataPath: error.schemaPath,
      })) || []

      console.log("onReceiverRecon errors ---------", errors);
      return { success: false, errors }
    }
    let axiosRes = await axios.post(`${context.bap_uri}/on_receiver_recon`, result)
    if (axiosRes?.data?.error) console.log("axiosRes --------------- ", JSON.stringify(axiosRes?.data?.error));
    if (axiosRes?.data?.message?.ack?.status?.toLowerCase() == "ack") {
      await OrderMongooseModel.findOneAndUpdate(
        { id: { "$in": buyerOrderId } },
        { is_settlement_receiver_verified: true },
        { new: true }
      );
    }

  } catch (err) {
    if (err?.response?.data?.error) console.log("axiosRes --------------- ", JSON.stringify(err?.response?.data?.error));
    console.log("receiverRecon Error=========== ", err?.message)
    throw err
  }
}

const calculatePriceDifference = async (onReconOrders, buyerOrders) => {
  try {
    const priceDifference = []

    for (const onReconOrder of onReconOrders) {
      const correspondingBuyerOrder = buyerOrders.find((buyerOrder) => onReconOrder.id === buyerOrder.id)

      if (correspondingBuyerOrder) {
        const reconAmount = parseFloat(onReconOrder.payment.params.amount)
        const buyerAmount = parseFloat(correspondingBuyerOrder.payment.params.amount)

        if (reconAmount > buyerAmount) {
          priceDifference.push({
            difference: (reconAmount - buyerAmount).toFixed(2),
            orderId: correspondingBuyerOrder.id,
          })
        } else if (reconAmount < buyerAmount) {
          priceDifference.push({
            difference: (-1 * (buyerAmount - reconAmount)).toFixed(2),
            orderId: correspondingBuyerOrder.id,
          })
        }
      }
    }

    return priceDifference
  } catch (error) {
    logger.error(`Error: ${error.stack || error}`)
    return [error.stack || error]
  }
}