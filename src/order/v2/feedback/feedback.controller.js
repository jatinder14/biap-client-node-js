import OrderFeedbackSevice from "./feedback.service.js";

const orderFeedbackSevice = new OrderFeedbackSevice();

class OrderFeedbackController {
  async feedback(req, res, next) {
    try {
      const OrderId = req.params.orderId;
      const body = req.body;
      orderFeedbackSevice.orderFeedback(OrderId, body).then((response) => {
        res.send(response);
      });
    } catch (e) {
      res.status(500).json({
        success: false,
        message: "Internal Server Error!"
      });
    }
  }

  async contactUs(req, res, next) {
    try {
      const payload = req.body;
      if (!payload.email) {
        res.header("Access-Control-Allow-Origin", "*");
        res.status(400).json({
          success: false,
          message: "Email is required!"
        });
      }
      if (!payload.message) {
        res.header("Access-Control-Allow-Origin", "*");
        res.status(400).json({
          success: false,
          message: "Message is required!"
        });
      }
      if (!payload.subject) {
        res.header("Access-Control-Allow-Origin", "*");
        res.status(400).json({
          success: false,
          message: "Subject is required!"
        });
      }
      orderFeedbackSevice.contactUs(payload).then((response) => {
        res.send(response);
      });
    } catch (e) {
      res.header("Access-Control-Allow-Origin", "*");
      res.status(500).json({
        success: false,
        message: "Internal Server Error!"
      });
    }
  }
}

export default OrderFeedbackController;
