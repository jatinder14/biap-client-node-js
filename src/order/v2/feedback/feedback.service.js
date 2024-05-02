

import Order from "../../v1/db/order.js"
import Feedback from "../db/feedback.js";

class OrderFeedbackSevice{
    async  orderFeedback(orderID, body) {
        try {
    
            
            const findData = await Order.findOne({ id: orderID });
            if (findData) {
                const user = findData.userId;
                const existingFeedback = await Feedback.findOne({ orderID: orderID, userId: user });
                console.log("existingFeedback1", existingFeedback);
    
                // If feedback already exists, return the message
                if (existingFeedback) {
                    return {
                        success:"True",
                        data:"Feedback Already Submitted"
                    }
                }
                const createFeedback = await Feedback.create({
                    userId: user,
                    message: body.message,
                    orderID: orderID,
                    websiteDesign:body.websiteDesign,
                    deliveryTime:body.deliveryTime,
                    quality:body.quality,
                    recommendWebsite:body.recommendWebsite,
                    checkoutSatisfaction:body.checkoutSatisfaction

                });

                console.log("createFeedback>>>>>>",createFeedback)
                return {
                    success:"True",
                    data:createFeedback
                }
            } else {
                return {
                    success:"True",
                    data:"Order Not Found"
                }
            }
        } catch (error) {
            console.error("Error in orderFeedback:", error);
            throw error;
        }
    }
    
    
    
}


export default OrderFeedbackSevice