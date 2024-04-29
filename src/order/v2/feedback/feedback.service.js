

import Order from "../../v1/db/order.js"
import Feedback from "../db/feedback.js";

class OrderFeedbackSevice{
    async  orderFeedback(orderID, message, userId) {
        try {
            console.log("findUser", orderID);
    
            // Assuming you have imported the necessary modules and defined the Order and Feedback models
    
            // Check if feedback already exists for the given orderID and userId
            const existingFeedback = await Feedback.findOne({ orderID: orderID, userId: userId });
    
            // If feedback already exists, return the message
            if (existingFeedback) {
                return "Feedback Already Submitted";
            }
    
            // If feedback doesn't exist, proceed to create new feedback entry
            const findData = await Order.findOne({ id: orderID });
    
            if (findData) {
                const user = findData.userId;
    
                const createFeedback = await Feedback.create({
                    userId: user,
                    message: message,
                    orderID: orderID
                });
    
                return createFeedback;
            } else {
                throw new Error("Order not found");
            }
        } catch (error) {
            console.error("Error in orderFeedback:", error);
            throw error;
        }
    }
    
    
    
}


export default OrderFeedbackSevice