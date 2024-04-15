import ConfirmOrderService from './confirmOrder.service.js';
import BadRequestParameterError from '../../../lib/errors/bad-request-parameter.error.js';
// import  Notification from "../../v1/db/notification.js"
import {sendEmail} from "../../../shared/mailer.js"


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

        confirmOrderService.confirmOrder(orderRequest).then(response => {
            res.json({ ...response });
        }).catch((err) => {
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

            confirmOrderService.confirmMultipleOrder(orderRequests).then(response => {
                res.json(response);
            }).catch((err) => {
                next(err);
            });

        }
        else
            throw new BadRequestParameterError();
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

        confirmOrderService.onConfirmOrder(messageId).then(order => {
            res.json(order);
        }).catch((err) => {
            next(err);
        });
    }

    /**
    * on confirm multiple order
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

            confirmOrderService.onConfirmMultipleOrder(messageIdArray).then(async orders => {
                const userEmail=req.user.decodedToken.email
                const userName=req.user.decodedToken.name
                const orderId=orders[0].message.order.id
                await sendEmail({userEmail,orderId,HTMLtemplate: '/template/acceptedOrder.ejs',
                userName: userName || '',
                subject: 'Order has been placed'
            });
                res.json(orders);
            }).catch((err) => {
                next(err);
            });

        }
        else
            throw new BadRequestParameterError();
    }

    orderDetails(req, res, next) {
        const { params } = req;
        const { orderId } = params;

        confirmOrderService.getOrderDetails(orderId).then(orders => {
            res.json(orders);
        }).catch((err) => {
            next(err);
        });
    }
}

export default ConfirmOrderController;
