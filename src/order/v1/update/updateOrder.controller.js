import UpdateOrderService from './updateOrder.service.js';
import BadRequestParameterError from '../../../lib/errors/bad-request-parameter.error.js';

const cancelOrderService = new UpdateOrderService();

class UpdateOrderController {
    /**
    * cancel order
    * @param {*} req    HTTP request object
    * @param {*} res    HTTP response object
    * @param {*} next   Callback argument to the middleware function
    * @return {callback}
    */
    async update(req, res, next) {
        const {body: orders} = req;

        // console.log("orderStatus-------------------->",orders)
        const onUpdateOrderResponse = await Promise.all(
            orders.map(async order => {
                try {

                    console.log("update orders--------------->",order);
                    return await cancelOrderService.update(order);
                }  catch (err) {
                    console.log("error cancelOrderService.update ----", err)
                    if (err?.response?.data) {
                        return err?.response?.data;
                    } else if (err?.message) {
                        return {
                            success: false,
                            message: "We are encountering issue while updating this order",
                            error: err?.message
                        }
                    } else {
                        return {
                            success: false,
                            message: "We are encountering issue while updating this order!"
                        }
                    }
                }
            })
        );

        res.json(onUpdateOrderResponse);

        // return onUpdateOrderResponse;
    }


    /**
    * on cancel order
    * @param {*} req    HTTP request object
    * @param {*} res    HTTP response object
    * @param {*} next   Callback argument to the middleware function
    * @return {callback}
    */
    onUpdate(req, res, next) {
        const { query } = req;
        const { messageId } = query;
        
        if(messageId) {
            cancelOrderService.onUpdate(messageId).then(order => {
                res.json(order);
            }).catch((err) => {
                next(err);
            });
        }
        else
            throw new BadRequestParameterError();

    }

}

export default UpdateOrderController;
