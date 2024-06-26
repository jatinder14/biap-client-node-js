import moment from "moment";
import ConfirmOrderService from "./confirmOrder.service.js";
import BadRequestParameterError from "../../../lib/errors/bad-request-parameter.error.js";
// import  Notification from "../../v1/db/notification.js"
import { sendEmail } from "../../../shared/mailer.js";
import Notification from "../../v2/db/notification.js";

const confirmOrderService = new ConfirmOrderService();
class ConfirmOrderController {
  /**
   * confirm order
   * @param {*} req    HTTP request object
   * @param {*} res    HTTP response object
   * @param {*} next   Callback argument to the middleware function
   * @return {callback}
   */
  confirmOrder(req, res, next) {
    const { body: orderRequest } = req;

    confirmOrderService
      .confirmOrder(orderRequest)
      .then((response) => {
        res.json({ ...response });
      })
      .catch((err) => {
        next(err);
      });
  }

  /**
   * confirm multiple orders
   * @param {*} req    HTTP request object
   * @param {*} res    HTTP response object
   * @param {*} next   Callback argument to the middleware function
   * @return {callback}
   */
  confirmMultipleOrder(req, res, next) {
    const { body: orderRequests } = req;
    if (orderRequests && orderRequests.length) {
      confirmOrderService.confirmMultipleOrder(orderRequests)
        .then((response) => {
          if (response?.some(el => el.success == false || el.status == 'failed')) {
            res.header("Access-Control-Allow-Origin", "*");
            res.status(400).json(response);
          } else {
              res.json(response);
          }
        })
        .catch((err) => {
          next(err);
        });
    } else throw new BadRequestParameterError();
  }

  /**
   * on confirm order
   * @param {*} req    HTTP request object
   * @param {*} res    HTTP response object
   * @param {*} next   Callback argument to the middleware function
   * @return {callback}
   */
  onConfirmOrder(req, res, next) {
    const { query } = req;
    const { messageId } = query;

    confirmOrderService
      .onConfirmOrder(messageId)
      .then((order) => {
        res.json(order);
      })
      .catch((err) => {
        next(err);
      });
  }

  /**
   * INFO: on confirm multiple order
   * @param {*} req    HTTP request object
   * @param {*} res    HTTP response object
   * @param {*} next   Callback argument to the middleware function
   * @return {callback}
   */
  async onConfirmMultipleOrder(req, res, next) {
    const { query } = req;
    const { messageIds } = query;

    if (messageIds && messageIds.length && messageIds.trim().length) {
      const messageIdArray = messageIds.split(",");

      confirmOrderService
        .onConfirmMultipleOrder(messageIdArray)
        .then(async (orders) => {
          if (orders?.some(el => el.success == false || el.status == 'failed')) {
            res.header("Access-Control-Allow-Origin", "*");
            res.status(400).json(orders);
          } else {
            const userEmails = req.user.decodedToken.email;
            const userName = req.user.decodedToken.name;
            triggerOrderNotification(orders, userEmails, userName)
            res.json(orders);
          }

        })
        .catch((err) => {
          next(err);
        });
    } else throw new BadRequestParameterError();
  }

  orderDetails(req, res, next) {
    const { params } = req;
    const { orderId } = params;

    confirmOrderService
      .getOrderDetails(orderId)
      .then((orders) => {
        res.json(orders);
      })
      .catch((err) => {
        next(err);
      });
  }
}

const triggerOrderNotification = (orders, userEmails, userName) => {
  for (let order of orders) {
    const orderIds = order?.message?.order?.id;
    const emailWithoutNumber = order?.message?.order?.fulfillments?.[0]?.end?.contact?.email
    const nameWithoutNumber = order?.message?.order?.fulfillments?.[0]?.end?.location?.address?.name
    const itemPrice = order?.message?.order?.quote?.price?.value;
    const estimatedDelivery = order?.message?.order?.fulfillments?.[0]["@ondc/org/TAT"];
    const duration = estimatedDelivery ? moment.duration(estimatedDelivery) : undefined;
    let days = duration?.days();
    // If duration is less than 1 day, set days to 1
    if (days === 0 && duration?.asMinutes() < 1440) {
      days = "1";
    } else {
      days = Math.ceil(`${days}`);
    }
    const itemList = order?.message?.order?.quote?.breakup?.filter(el => el['@ondc/org/title_type'] == 'item').map(el => {
      return {
        name: el.title,
        quantity: el['@ondc/org/item_quantity'].count,
        price: el?.price?.value,
        estimatedDelivery: days,
      }
    })

    const HTMLtemplate = order?.message?.order?.plateform === "app" ? "/appTemplate/acceptedOrder.ejs" : "/template/acceptedOrder.ejs";
    if (emailWithoutNumber && nameWithoutNumber) {
      Notification.create({
        event_type: "order_creation",
        details: `Order has been Accepted with id: ${orderIds}`,
        name: nameWithoutNumber,
      })

      sendEmail({
        userEmails: emailWithoutNumber,
        orderIds,
        HTMLtemplate,
        userName: nameWithoutNumber || "",
        subject: "Order Acceptance | Your Order has been Accepted",
        items: itemList,
        totalPrice: itemPrice
      });

    } else if (userEmails && userName) {
      Notification.create({
        event_type: "order_creation",
        details: `Order has been Accepted with id: ${orderIds}`,
        name: userName,
      })

      sendEmail({
        userEmails,
        orderIds,
        HTMLtemplate,
        userName: userName || "",
        subject: "Order Acceptance | Your Order has been Accepted",
        items: itemList,
        totalPrice: itemPrice
      });
    }
  }
}

export default ConfirmOrderController;
