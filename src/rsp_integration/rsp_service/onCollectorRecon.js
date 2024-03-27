import OnConfirmData from "../../order/v1/db/onConfirmDump.js" 
export const onCollectorRecon = async (req)=> {
  const data=await OnConfirmData.find({})
  console.log("data>>>>",data)
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
      }),
    )
  } catch (e) {
    console.log(e.message)
  }
}
