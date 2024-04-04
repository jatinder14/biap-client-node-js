import OnConfirmData from "../../order/v1/db/onConfirmDump.js" 
import OrderMongooseModel from "../../order/v1/db/order.js"  
import { SETTLE_STATUS } from "../../utils/constants.js"
export const onCollectorRecon = async (req)=> {
  console.log(" *========== Inside on_collector_recon ==============* ");
  console.log("req>>>>",JSON.stringify(req))
  try {
    await Promise.all(
       req.message.orderbook.orders.map(async (order) => {

        await OnConfirmData.updateMany({
          where: {
            buyer_order_id: order.id,
          },
          data: {
            on_collector_recon_received: true,
            updated_at: new Date(),
          },
        })

        await OrderMongooseModel.updateMany({
          where: {
            buyer_order_id: order.id,
          },
          data: {
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
        })

      }),
    )
  } catch (e) {
    console.log(e.message)
  }
}
