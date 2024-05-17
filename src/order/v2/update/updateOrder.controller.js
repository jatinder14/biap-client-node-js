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

                    console.log("update orders--------------->", order);
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

    async sendDataToEssentialDashboard(order) {
        try {
            const lastFulfillment =
                order?.message?.order?.fulfillments[
                order?.message?.order?.fulfillments.length - 1
                ];
            let returnState = lastFulfillment?.state?.descriptor?.code;
            const returnId = lastFulfillment?.id;

            const validReturnStates = ["Liquidated", "Rejected", "Reverse-QC"];

            const returnType = lastFulfillment?.type;

            // const essentialDashboardUri = process.env.ESSENTIAL_DASHBOARD_URI;
            const essentialDashboardUri = process.env.ESSENTIAL_DASHBOARD_URI;
            if (
                validReturnStates.includes(returnState) &&
                essentialDashboardUri &&
                order.context?.transaction_id &&
                order.context?.bap_id
            ) {
                const payload = {
                    0: {
                        json: {
                            id: returnId,
                            remarks: returnType,
                            returnStatus: returnState,
                        },
                    },
                };

                const data = JSON.stringify(payload);
                const config = {
                    method: "post",
                    maxBodyLength: Infinity,
                    url: `${essentialDashboardUri}/trpc/return.updateReturnBySeller?batch=1`,
                    headers: {
                        "Content-Type": "application/json",
                    },
                    data: data,
                };
                const response = await axios.request(config);
                console.log(
                    "Response from Essential Dashboard API:",
                    JSON.stringify(response.data)
                );
            } else {
                return;
            }
        } catch (error) {
            console.log("error sendDataToEssentialDashboard update order ===================", error);
            throw error;
        }
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

        if (messageId) {
            cancelOrderService.onUpdate(messageId).then(async order => {
                await this.sendDataToEssentialDashboard(order)
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
