import OrderStatusService from './orderStatus.service.js';
import BadRequestParameterError from '../../../lib/errors/bad-request-parameter.error.js';
import {sendEmail} from "../../../shared/mailer.js"
import Notification from "../../v2/db/notification.js";
import {emailCronJob} from "../../../utils/emailCron.js"

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

        if (messageIds && messageIds.length && messageIds.trim().length) {
            const messageIdsArray = messageIds.split(",");
            const userEmail = req.user.decodedToken.email
            const userName = req.user.decodedToken.name

            orderStatusService.onOrderStatusV2(messageIdsArray, userEmail, userName).then(async orders => {
                const orderId = orders[0].message.order.id
                const emailWithoutNumber = orders[0].message.order.fulfillments[0].end?.contact?.email
                const nameWithoutNumber = orders[0].message.order.fulfillments[0].end?.location?.address?.name

                if (orders[0].message.order.fulfillments[0].state.descriptor.code === "Out-for-delivery") {

                    if (emailWithoutNumber && nameWithoutNumber) {
                        await Notification.create({
                            event_type: 'out-for-delivery',
                            details: `Order is out for delivery for orderId: ${orderId}`,
                            name: nameWithoutNumber
                        })

                        await sendEmail({
                            userEmails: emailWithoutNumber,
                            orderIds: orderId,
                            HTMLtemplate: '/template/outForDelivery.ejs',
                            userName: nameWithoutNumber || '',
                            subject: 'Order Update | Your Order is out for delivery'
                        });
                        res.json(orders);

                    }
                    else if (userEmail && userName) {
                        await Notification.create({
                            event_type: 'out-for-delivery',
                            details: `Order is out for delivery for orderId: ${orderId}`,
                            name: userName
                        })
                        await sendEmail({
                            userEmails: userEmail,
                            orderIds: orderId,
                            HTMLtemplate: '/template/outForDelivery.ejs',
                            userName: userName || '',
                            subject: 'Order Update | Your Order is out for delivery'
                        });
                        res.json(orders);

                    }
                    else {
                        res.json(orders);

                    }

                } else if (orders[0].message.order.fulfillments[0].state.descriptor.code === "Order-picked-up") {

                    if (emailWithoutNumber && nameWithoutNumber) {
                        await Notification.create({
                            event_type: 'order-picked-up',
                            details: `Order has been picked up with id: ${orderId}`,
                            name: nameWithoutNumber
                        })

                        await sendEmail({
                            userEmails: emailWithoutNumber,
                            orderIds: orderId,
                            HTMLtemplate: '/template/orderPickedup.ejs',
                            userName: nameWithoutNumber || '',
                            subject: 'Order Update | Your Order has been picked up'
                        });
                        console.log("orders2", orders)

                        res.json(orders);
                    }
                    else if (userEmail && userName) {
                        await Notification.create({
                            event_type: 'order-picked-up',
                            details: `Order has been picked up with id: ${orderId}`,
                            name: userName
                        })

                        await sendEmail({
                            userEmails: userEmail,
                            orderIds: orderId,
                            HTMLtemplate: '/template/orderPickedup.ejs',
                            userName: userName || '',
                            subject: 'Order Update | Your Order has been picked up'
                        });
                        console.log("orders2", orders)

                        res.json(orders);
                    }

                    else {
                        res.json(orders);

                    }

                } else if (orders[0].message.order.fulfillments[0].state.descriptor.code === "Agent-assigned") {


                    if (emailWithoutNumber && nameWithoutNumber) {
                        await Notification.create({
                            event_type: 'agent-assigned',
                            details: `Agent has been assigned for order id: ${orderId}`,
                            name: nameWithoutNumber
                        })

                        await sendEmail({
                            userEmails: emailWithoutNumber,
                            orderIds: orderId,
                            HTMLtemplate: '/template/agentAssigned.ejs',
                            userName: nameWithoutNumber || '',
                            subject: 'Order Update | Agent has been assigned for Your Order'
                        });
                        console.log("orders3", orders)

                        res.json(orders);
                    }
                    else if (userEmail && userName) {
                        await Notification.create({
                            event_type: 'agent-assigned',
                            details: `Agent has been assigned for order id: ${orderId}`,
                            name: userName
                        })

                        await sendEmail({
                            userEmails: userEmail,
                            orderIds: orderId,
                            HTMLtemplate: '/template/agentAssigned.ejs',
                            userName: userName || '',
                            subject: 'Order Update | Agent has been assigned for Your Order'
                        });
                        console.log("orders3", orders)

                        res.json(orders);
                    }
                    else {
                        res.json(orders);

                    }


                } else if (orders[0].message.order.fulfillments[0].state.descriptor.code === "Order-delivered") {

                    if (emailWithoutNumber && nameWithoutNumber) {

                        await Notification.create({
                            event_type: 'order_delivery',
                            details: `Order has been Delivered with id: ${orderId}`,
                            name: nameWithoutNumber
                        })
                        await sendEmail({
                            userEmails:emailWithoutNumber,
                            orderIds:orderId,
                            HTMLtemplate: "/template/orderDelivered.ejs",
                            userName: nameWithoutNumber || "",
                            subject: "Order Confirmation | Your order has been successfully delivered",
                        });
                        await emailCronJob(emailWithoutNumber,orderId,"/template/orderFeedback.ejs",nameWithoutNumber,"Order Feedback | Tell us about your experience")
    
    
                        res.json(orders);

                    } else if (userEmail && userName) {
                        await Notification.create({
                            event_type: 'order_delivery',
                            details: `Order has been Delivered with id: ${orderId}`,
                            name:userName || ""
                             }).then(notification => {
                         console.log('Notification created:', notification);
                        }).catch(error => {
                     console.error('Error creating notification:', error);
                       });
                        await sendEmail({
                            userEmails:userEmail,
                            orderIds:orderId,
                            HTMLtemplate: "/template/orderDelivered.ejs", 
                            subject: "Order Confirmation | Your order has been successfully delivered",
                            userName:userName || ""
                        });
                         

                         await emailCronJob(userEmail,orderId,"/template/orderFeedback.ejs",userName,"Order Feedback | Tell us about your experience")


    
    
                        res.json(orders);
    
                    }
                    else{

                        res.json(orders);

                    }

                }
                else {

                    res.json(orders);

                }

            }).catch((err) => {
                next(err);
            });

        }
        else
            throw new BadRequestParameterError();
    }
}

export default OrderStatusController;

