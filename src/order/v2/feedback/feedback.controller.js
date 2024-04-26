import OrderFeedbackSevice from "./feedback.service.js"


const orderFeedbackSevice =new OrderFeedbackSevice()

class OrderFeedbackController {
  async feedback(req,res,next){
    try{
        const OrderId=req.params.OrderId
        orderFeedbackSevice.orderFeedback(OrderId).then(response => {
            console.log("response>>",response)
            res.send(response)
        })
    }
    catch(e){
        next(err);
    }
  }


}

export default OrderFeedbackController


