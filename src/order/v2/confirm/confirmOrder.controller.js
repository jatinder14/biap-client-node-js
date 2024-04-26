import ConfirmOrderService from './confirmOrder.service.js';
import BadRequestParameterError from '../../../lib/errors/bad-request-parameter.error.js';
// import  Notification from "../../v1/db/notification.js"
import {sendEmail} from "../../../shared/mailer.js"
import Notification from "../../v2/db/notification.js";
import moment from 'moment';


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
                // console.log("orders>>>>>>>>>>",JSON.stringify(orders))
                const userEmails=req.user.decodedToken.email
                const userName=req.user.decodedToken.name
                const orderIds=orders[0].message.order.id
                const itemName=orders[0].message.order.quote.breakup[0].title
                const itemQuantity=orders[0].message.order.items[0].quantity.count
                const itemPrice=orders[0].message.order.quote.price.value
                const estimatedDelivery=orders[0].message.order.fulfillments[0]['@ondc/org/TAT']
                
// Parse the duration using moment.js
const duration = moment.duration(estimatedDelivery);

// Get the days and minutes from the duration
let days = duration.days();

// If duration is less than 1 day, set days to 1
if (days === 0 && duration.asMinutes() < 1440) {
    console.log("days>>>>>",days)
    days= '1'
}
else{
    days=  `${days}`
}
                
                console.log('notifications has been created',itemName,itemQuantity,itemPrice,estimatedDelivery)
                Notification.create({
               event_type: 'order_creation',
                details: `Order has been Accepted with id: ${orderIds}`,
                name:userName
              }).then(notification => {
          console.log('Notification created:', notification);
        }).catch(error => {
          console.error('Error creating notification:', error);
        });
   

                await sendEmail({userEmails,orderIds,HTMLtemplate: '/template/acceptedOrder.ejs',
                userName: userName || '',
                subject: 'Order Accepted',
                itemName:itemName,
                itemQuantity:itemQuantity,
                itemPrice:itemPrice,
                estimatedDelivery:days
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
