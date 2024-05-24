import RazorPayService from "./razorPay.service.js";
import lokiLogger from "../utils/logger.js";
//import {Payment} from "../models";

const razorPayService = new RazorPayService();

class RazorPayController {
  /**
   * create payment
   * @param {*} req    HTTP request object
   * @param {*} res    HTTP response object
   * @param {*} next   Callback argument to the middleware function
   * @return {callback}
   */
  createPayment(req, res, next) {
    const { orderId: orderId } = req.params;
    const currentUser = req.user;
    const data = req.body;

    const currentUserAccessToken = res.get("currentUserAccessToken");
    razorPayService
      .createPayment(orderId, data, currentUser, currentUserAccessToken)
      .then((user) => {
        res.json({ data: user });
      })
      .catch((err) => {
        next(err);
      });
  }

  createOrder(req, res, next) {
    const { amount, currency } = req.body;
    razorPayService
      .createOrder(amount, currency)
      .then((user) => {
        res.json({ data: user });
      })
      .catch((err) => {
        next(err);
      });
  }

  /**
   * verify payment
   * @param {*} req    HTTP request object
   * @param {*} res    HTTP response object
   * @param {*} next   Callback argument to the middleware function
   * @return {callback}
   */
  verifyPayment(req, res, next) {
    const data = req.body;
    const signature = req.headers["x-razorpay-signature"];
    razorPayService
      .verifyPayment(signature, data)
      .then((user) => {
        res.json({ data: user });
      })
      .catch((err) => {
        next(err);
      });
  }
  async refundPayment(req, res, next) {
    try{
    console.log(`-------------refundPayment-----------`)
    const data = req?.body;
    const razorpayPaymentId = data?.paymentId;
    const refundAmount = data?.amount;
    // const signature = req?.headers["x-razorpay-signature"];
    // razorPayService
    //   .verifyPayment(signature, data)
    //   .then((user) => {
    //     res.json({ data: user });
    //   })
    //   .catch((err) => {
    //     next(err);
    //   });
      if (razorpayPaymentId && refundAmount) {
          let razorpayRefundAmount = Math.abs(refundAmount).toFixed(2) * 100;
          lokiLogger.info(`------------------amount-passed-to-razorpay-- ${razorpayRefundAmount}`)
          let response = await razorPayService.refundOrder(razorpayPaymentId, razorpayRefundAmount)
          lokiLogger.info(`response_razorpay_on_update>>>>>>>>>> ${JSON.stringify(response)}`)
          // const refundDetails = new Refund({
          //     orderId: dbResponse.id,
          //     refundId: response.id,
          //     refundedAmount: (response.amount) / 100,
          //     itemId: dbResponse.items[0].id,
          //     itemQty: dbResponse.items[0].quantity.count,
          //     isRefunded: true,
          //     transationId: dbResponse?.transactionId,
          //     razorpayPaymentId: dbResponse?.payment?.razorpayPaymentId
          // })
          // lokiLogger.info(`refundDetails>>>>>>>>>>, ${JSON.stringify(refundDetails)}`)
          console.log(`--------response---${JSON.stringify(response)}`)
          return res.json({
            status: true,
            message: `refund amount of ${response} is successfull`
          }) 
      }
      return res.json({
        status: false,
        message: `refund failed`
      })
    }catch(e){
      lokiLogger.info(`error found in refunding the money ------${JSON.stringify(e)}`);
      console.log(`error found in refunding the money ------${JSON.stringify(e)}`);
      return res.json({
        status: false,
        message: e?.error?.description
      })
    }
  }

  async rzr_webhook(req, res) {
    try {
      const data = req.body;
      const signature = req.headers["x-razorpay-signature"];
      razorPayService
        .verifyPayment(signature, data)
        .then((user) => {
          res.json({ data: user });
        })
        .catch((err) => {
          throw err;
        });
    } catch (error) {
      console.log(error);
      res.header("Access-Control-Allow-Origin", "*");
      return res.status(400).send(error);
    }
  }

  async keys(req, res) {
    try {
      res.json({ keyId: process.env.RAZORPAY_KEY_ID });
    } catch (error) {
      console.log(error);
      res.header("Access-Control-Allow-Origin", "*");
      return res.status(400).send(error);
    }
  }

    // /**
    // * verify payment
    // * @param {*} req    HTTP request object
    // * @param {*} res    HTTP response object
    // * @param {*} next   Callback argument to the middleware function
    // * @return {callback}
    // */
    // verifyPayment(req, res, next) 
    // {
      
    //     const confirmdata = req.body.confirmRequest;
    //     const razorPaydata = req.body.razorPayRequest;
    //     const signature = razorPaydata.razorpay_signature
    //     razorPayService.verifyPaymentDetails(signature,razorPaydata,confirmdata).then(response => {
    //         res.json(response);
    //     }).catch((err) => {
    //         next(err);
    //     });
    // }

}

export default RazorPayController;
