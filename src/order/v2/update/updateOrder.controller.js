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
        const { body: orders } = req;
        const onUpdateOrderResponse = await Promise.all(
            orders.map(async order => {
                try {
                    return await cancelOrderService.update(order);
                } catch (err) {
                    console.log("error update order ----", err)
                    if (err?.response?.data) {
                        return err?.response?.data;
                    } else if (err?.message) {
                        return {
                            success: false,
                            message: "We are encountering issue while updating the order!",
                            error: err?.message
                        }
                    } else {
                        return {
                            success: false,
                            message: "We are encountering issue while updating the order!"
                        }
                    }

                }
            })
        );

        res.json(onUpdateOrderResponse);

        // return onUpdateOrderResponse;
    }

    /**
    * INFO: on update order
    * @param {*} req    HTTP request object
    * @param {*} res    HTTP response object
    * @param {*} next   Callback argument to the middleware function
    * @return {callback}
    */
    onUpdate(req, res, next) {
        const { query } = req;
        const { messageId } = query;

        if (messageId) {
            cancelOrderService.onUpdate(messageId).then(async order => {
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
