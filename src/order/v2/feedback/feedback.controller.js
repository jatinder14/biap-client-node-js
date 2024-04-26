import OrderFeedbackSevice from "./feedback.service.js"


const orderFeedbackSevice =new OrderFeedbackSevice()

class OrderFeedbackController {
  async feedback(req,res,next){
    try{
        const OrderId=req.params.orderId
        const {message}=req.body
        console.log("OrderId>>>>>>",OrderId) 
        orderFeedbackSevice.orderFeedback(OrderId,message).then(response => {
            console.log("response>>",response)
            res.send(response)
        })
    }
    catch(e){
  res.status(500).json("Internal Server Error")    }
  }


}

export default OrderFeedbackController


