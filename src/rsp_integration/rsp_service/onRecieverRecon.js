import { logger } from "../../shared/logger"

const onRecieverRecon = async (payload) => {
  try {
    const { reconData, priceDifference } = payload
    reconData.context.action = "on_receiver_recon"
    reconData.context.timestamp = new Date().toISOString()
    const orders = reconData.message.orderbook.orders.map(reconItem => {
      let message = {
        name: "Equal amount",
        code: "equal",
      }
      const priceItem = priceDifference.find(priceItem => reconItem.id == priceItem.orderId)
      if (priceItem) {
        if (priceItem.difference > 0) {
          message = {
            name: "greater amount",
            code: "more",
          }
        } else if (priceItem.difference < 0) {
          message = {
            name: "lesser amount",
            code: "less",
          }
        }
      }

      return {
        id: reconItem.id,
        invoice_no: reconItem.invoice_no,
        collector_app_id: reconItem.collector_app_id,
        receiver_app_id: reconItem.receiver_app_id,
        order_recon_status: "0" + (parseInt(reconItem.order_recon_status) + 1).toString(),
        transaction_id: reconItem.transaction_id,
        settlement_id: reconItem.settlement_id,
        settlement_reference_no: reconItem.settlement_reference_no,
        counterparty_recon_status: priceItem?.difference > 0 ? "02" : priceItem?.difference < 0 ? "03" : "01",
        counterparty_diff_amount: {
          currency: "INR",
          value: priceItem?.difference ? Math.abs(priceItem?.difference).toFixed(2) : "0",
        },
        message: message,
      }
    })
    const on_reciever_recon = {
      context: reconData.context,
      message: {
        orderbook: {
          orders,
        },
      },
    }
    return on_reciever_recon
  } catch (error) {
    logger.error("Error: ", error.stack)
    return error
  }
}

export default onRecieverRecon
