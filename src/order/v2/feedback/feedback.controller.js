import OrderFeedbackSevice from "./feedback.service.js"


const orderFeedbackSevice =new OrderFeedbackSevice()

class OrderFeedbackController {
  async feedback(req,res,next){
    try{
        const OrderId=req.params.orderId
        const body=req.body
        console.log("body>>>>>>",body) 
        orderFeedbackSevice.orderFeedback(OrderId,body).then(response => {
            console.log("response>>",response)
            res.send(response)
        })
    }
    catch(e){
  res.status(500).json("Internal Server Error")    }
  }


}

export default OrderFeedbackController


