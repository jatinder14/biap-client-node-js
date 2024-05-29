import Order from "../../v1/db/order.js";
import Feedback from "../db/feedback.js";
import { sendEmail } from "../../../shared/mailer.js";

class OrderFeedbackSevice {
  async orderFeedback(orderID, body) {
    try {
      const findData = await Order.findOne({ id: orderID });
      if (findData) {
        const user = findData.userId;
        const existingFeedback = await Feedback.findOne({
          orderID: orderID,
          userId: user,
        });
        if (existingFeedback) {
          return {
            success: false,
            message: "You have already submitted the feedback for this order!",
          };
        }
        const createFeedback = await Feedback.create({
          userId: user,
          message: body.message,
          orderID: orderID,
          websiteDesign: body.websiteDesign,
          deliveryTime: body.deliveryTime,
          quality: body.quality,
          recommendWebsite: body.recommendWebsite,
          checkoutSatisfaction: body.checkoutSatisfaction,
        });
        return {
          success: true,
          data: createFeedback,
          message: "Your feedback has been submitted successfully!",
        };
      } else {
        return {
          success: false,
          message: "You are trying to submit feedback for invalid order!",
        };
      }
    } catch (error) {
      console.error("Error in orderFeedback:", error);
      throw error;
    }
  }

  async getorderFeedback(orderID, body) {
    try {
      const existingFeedback = await Feedback.findOne({ orderID });
      if (!existingFeedback) {
        throw new Error("Feedback is not created for this order");
      } else {
        return {
          success: true,
          data: existingFeedback
        };
      }
    } catch (error) {
      console.error("Error in orderFeedback:", error?.message);
      return {
        success: false,
        message: error?.message
      };
    }
  }


  async contactUs(payload) {
    try {
      const { email, subject, message, username } = payload;
      const from = process.env.CONTACTUS_EMAIL_ADDRESS;
      await sendEmail({
        fromEmail: from,
        userEmails: email,
        message,
        HTMLtemplate: "/template/contactUs.ejs",
        userName: username || "",
        subject
      });
      return {
        success: true,
        message: "Your request is recorded, we will look into it",
      };
    } catch (error) {
      console.error("Error in contactUs:", error);
      throw error;
    }
  }
}

export default OrderFeedbackSevice;
