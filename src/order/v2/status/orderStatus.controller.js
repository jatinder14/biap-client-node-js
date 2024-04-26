import OrderStatusService from './orderStatus.service.js';
import BadRequestParameterError from '../../../lib/errors/bad-request-parameter.error.js';
import {sendEmail} from "../../../shared/mailer.js"
import Notification from "../../v2/db/notification.js";
 
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
               
                const orderId=orders[0].message.order.id
                if (orders[0].message.order.fulfillments[0].state.descriptor.code === "Out-for-delivery") {
                    Notification.create({
                        event_type: 'out-for-delivery',
                        details: `Order is out for delivery for orderId: ${orderId}`,
                        name:userName
                         }).then(notification => {
                     console.log('Notification created:', notification);
                    }).catch(error => {
                 console.error('Error creating notification:', error);
                   });
           
                    await sendEmail({
                        userEmails:userEmail,
                        orderIds:orderId,
                        HTMLtemplate: '/template/outForDelivery.ejs',
                        userName: userName || '',
                        subject: 'Order Update | Your Order is out for delivery'
                    });
                    res.json(orders);

                } else if (orders[0].message.order.fulfillments[0].state.descriptor.code === "Order-Picked-Up") {
                    Notification.create({
                        event_type: 'order-picked-up',
                        details: `Order has been picked up with id: ${orderId}`,
                        name:userName
                         }).then(notification => {
                     console.log('Notification created:', notification);
                    }).catch(error => {
                 console.error('Error creating notification:', error);
                   });
           
                    await sendEmail({
                        userEmails:userEmail,
                        orderIds:orderId,
                        HTMLtemplate: '/template/orderPickedup.ejs',
                        userName: userName || '',
                        subject: 'Order Update | Your Order has been picked up'
                    });
                    console.log("orders2",orders)

                    res.json(orders);

                } else if (orders[0].message.order.fulfillments[0].state.descriptor.code === "Agent-assigned") {
                    Notification.create({
                        event_type: 'agent-assigned',
                        details: `Agent has been assigned for order id: ${orderId}`,
                        name:userName
                         }).then(notification => {
                     console.log('Notification created:', notification);
                    }).catch(error => {
                 console.error('Error creating notification:', error);
                   });
           
                    await sendEmail({
                        userEmails:userEmail,
                        orderIds:orderId,
                        HTMLtemplate: '/template/agentAssigned.ejs',
                        userName: userName || '',
                        subject: 'Order Update | Agent has been assigned for Your Order'
                    });
                    console.log("orders3",orders)

                    res.json(orders);

                }
                else if (orders[0].message.order.fulfillments[0].state.descriptor.code === "Order-delivered") {
                    Notification.create({
                        event_type: 'order_delivery',
                        details: `Order has been Delivered with id: ${orderId}`,
                        name:userName
                         }).then(notification => {
                     console.log('Notification created:', notification);
                    }).catch(error => {
                 console.error('Error creating notification:', error);
                   });
                    await sendEmail({
                        userEmails:userEmail,
                        orderIds:orderId,
                        HTMLtemplate: "/template/orderDelivered.ejs", // Adjust the template path accordingly
                        userName: userName || "",
                        subject: "Order Confirmation | Your order has been successfully delivered",
                    });
                    // setTimeout(async () => {
                    //     await sendEmail({
                    //         userEmails:userEmail,
                    //     orderIds:orderId,
                    //         HTMLtemplate: "/template/orderFeedback.ejs", // Adjust the template path accordingly
                    //         userName: userName || "",
                    //         subject: "We'd love to hear your feedback on your recent order",
                    //     });
                    // }, 180000); // 15 seconds delay before sending the feedback email

                    // console.log("orders3",orders)

                    res.json(orders);

                }
             else{
                console.log("orders4",orders)

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
