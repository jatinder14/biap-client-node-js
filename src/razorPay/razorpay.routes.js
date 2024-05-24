import { Router } from "express";
import RazorPayController from "./razorPay.controller.js";
import { authentication } from "../middlewares/index.js";
const router = new Router();

const razorPayController = new RazorPayController();

//Make Order
router.post(
  "/v2/razorpay/createOrder",
  authentication(),
  razorPayController.createOrder
);

//Make payment
router.post(
  "/v2/razorpay/:orderId",
  authentication(),
  razorPayController.createPayment
);

//verify payment
router.post("/v2/razorpay/verify/process", razorPayController.verifyPayment);

router.post("/v2/razorpay/razorPay/webhook", razorPayController.rzr_webhook);

router.get(
  "/v2/razorpay/razorPay/keys",
  // authentication(),
  razorPayController.keys
);

//Make refund
router.post(
  "/v2/razorpay/refund/item",
  razorPayController.refundPayment
);


export default router;
