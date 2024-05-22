import { protocolUpdate } from "../../../utils/protocolApis/index.js";
import axios from "axios"
class BppUpdateService {

    /**
     * 
     * @param {Object} context 
     * @param {String} orderId 
     * @param {String} cancellationReasonId 
     * @returns 
     */
    async sendDataToEssentialDashboard(context, order, orderDetails) {
        try {
            const orderDetailsData = orderDetails[0].billing
            const essentialDashboardUri = process.env.ESSENTIAL_DASHBOARD_URI;

            if (!essentialDashboardUri || !context?.transaction_id || !context.bap_id) {
                return;
            }
            context.subscriber_id = "buyer-app-stage.thewitslab.com" // context.bap_id - Need to fix this once id will subscribe
            const payload = {
                "0": {
                    "json": {
                        "clientId": orderDetails[0].userId,
                        "customer_details": {
                            "name": orderDetailsData.name,
                            "email": orderDetailsData.email,
                            "phone": orderDetailsData.phone
                        },
                        "context": context,
                        "message": {
                            "update_target": order.update_target,
                            "order": {
                                "id": order.order.id,
                                "fulfillments": order.order.fulfillments
                            }
                        }
                    }
                }
            };

            const data = JSON.stringify(payload);
            const config = {
                method: "post",
                maxBodyLength: Infinity,
                url: `${essentialDashboardUri}/trpc/return.createReturn?batch=1`,
                headers: {
                    "Content-Type": "application/json",
                },
                data: data,
            };

            const response = await axios.request(config);
            console.log("Response from Essential Dashboard API:", JSON.stringify(response.data));
            return response.data;
        } catch (error) {
            console.error("Error sending data to Essential Dashboard:", error);
            throw error;
        }
    }

    async update(context, update_target, order, orderDetails) {
        try {

            const cancelRequest = {
                context: context,
                message: order
            }

            const response = await protocolUpdate(cancelRequest);
            console.log("update_target----------------------->",update_target)
            console.log("response----------------------->",response)
            console.log("context----------------------->",context)
            console.log("order----------------------->",JSON.stringify(order))
            console.log("orderDetails----------------------->",JSON.stringify(orderDetails))

            if (update_target == 'Return') await this.sendDataToEssentialDashboard(context, order, orderDetails);


            return { context: context, message: response.message };
        }
        catch (err) {
            throw err;
        }
    }
}

export default BppUpdateService;
