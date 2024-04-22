import OrderStatusService from './orderStatus.service.js';
import BadRequestParameterError from '../../../lib/errors/bad-request-parameter.error.js';
import {sendEmail} from "../../../shared/mailer.js"
 
const orderStatusService = new OrderStatusService();

class OrderStatusController {

    /**
    * order status
    * @param {*} req    HTTP request object
    * @param {*} res    HTTP response object
    * @param {*} next   Callback argument to the middleware function
    * @return {callback}
    */
    orderStatus(req, res, next) {
        const { body: order } = req;

        orderStatusService.orderStatus(order).then(response => {
            res.json({ ...response });
        }).catch((err) => {
            next(err);
        });
    }

    /**
    * multiple order status
    * @param {*} req    HTTP request object
    * @param {*} res    HTTP response object
    * @param {*} next   Callback argument to the middleware function
    * @return {callback}
    */
    orderStatusV2(req, res, next) {
        const { body: orders } = req;

        if (orders && orders.length) {

            orderStatusService.orderStatusV2(orders).then(response => {
                res.json(response);
            }).catch((err) => {
                next(err);
            });

        }
        else
            throw new BadRequestParameterError();
    }

    /**
    * on order status
    * @param {*} req    HTTP request object
    * @param {*} res    HTTP response object
    * @param {*} next   Callback argument to the middleware function
    * @return {callback}
    */
    onOrderStatus(req, res, next) {
        const { query } = req;
        const { messageId } = query;
        
        orderStatusService.onOrderStatus(messageId).then(order => {
            res.json(order);
        }).catch((err) => {
            next(err);
        });
    }

    /**
    * on multiple order status
    * @param {*} req    HTTP request object
    * @param {*} res    HTTP response object
    * @param {*} next   Callback argument to the middleware function
    * @return {callback}
    */
     onOrderStatusV2(req, res, next) {
        const { query } = req;
        const { messageIds } = query;
        
        if(messageIds && messageIds.length && messageIds.trim().length) { 
            const messageIdsArray = messageIds.split(",");
            const userEmail=req.user.decodedToken.email
            const userName=req.user.decodedToken.name

            orderStatusService.onOrderStatusV2(messageIdsArray,userEmail,userName).then(async orders => {

                console.log("orders>>>>>>>>>>>",JSON.stringify(orders[0].message.order.fulfillments[0].state.descriptor.code))
                if(orders[0].message.order.fulfillments[0].state.descriptor.code==="Out-for-delivery"){
                    await sendEmail({userEmail,orderId,HTMLtemplate: '/template/acceptedOrder.ejs',
                    userName: userName || '',
                    subject: 'Order has been placed'
                });
                }else if(orders[0].message.order.fulfillments[0].state.descriptor.code==="Out-for-delivery"){
                    await sendEmail({userEmail,orderId,HTMLtemplate: '/template/acceptedOrder.ejs',
                    userName: userName || '',
                    subject: 'Order has been placed'
                });
                }
                else if(orders[0].message.order.fulfillments[0].state.descriptor.code==="Out-for-delivery"){
                    await sendEmail({userEmail,orderId,HTMLtemplate: '/template/acceptedOrder.ejs',
                    userName: userName || '',
                    subject: 'Order has been placed'
                });
                }
                
                res.json(orders);
            }).catch((err) => {
                next(err);
            });
            
        }
        else
            throw new BadRequestParameterError();
    }
}

export default OrderStatusController;
