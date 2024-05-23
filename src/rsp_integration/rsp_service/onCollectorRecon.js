import OnConfirmData from "../../order/v1/db/onConfirmDump.js"
import OrderMongooseModel from "../../order/v1/db/order.js"
import { SETTLE_STATUS } from "../../utils/constants.js"

export const onCollectorRecon = async (payload) => {
  try {
    return await Promise.allSettled(
      payload?.message?.orderbook?.orders?.map(async (order) => {
        await OrderMongooseModel.updateMany(
          { id: order.id },
          {
            is_settlement_done: true,
            settle_status: SETTLE_STATUS.SETTLE,
            settlement_id: order.settlement_id,
            settlement_reference_no: order.settlement_id,
            order_recon_status: order.settlement_reference_no,
            counterparty_recon_status: order.counterparty_recon_status,
            counterparty_diff_amount_value: order.counterparty_diff_amount.value,
            counterparty_diff_amount_currency: order.counterparty_diff_amount.currency,
            receiver_settlement_message: order.message.name,
            receiver_settlement_message_code: order.message.code
          },
          { upsert: true, new: true }
        )

      }),
    )
  } catch (err) {
    console.log("onCollectorRecon =========== ", err?.message)
    throw err
  }
}
