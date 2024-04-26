

import Order from "../../v1/db/order.js"


class OrderFeedbackSevice{
    async orderFeedback(orderID){
        console.log("findUser",orderID)

        // const {orderId}= req.params.orderId
        const findData = await Order.find({});
        const findUser=findData.map((data)=>{
            console.log("findUser",orderID)
            console.log("data.id=",data.id)

            if(data.id===orderID){
                return data.userId
            }
        })
        console.log("findUser>>>",findUser)
        return {
            success:true,
            data:"Thank You for Your Feedback"
        }
    }
}

export default OrderFeedbackSevice