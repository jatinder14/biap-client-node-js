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
    async sendDataToEssentialDashboard(context, order,orderDetails) {
        try {
            const orderDetailsData=orderDetails[0].billing
            const essentialDashboardUri = process.env.ESSENTIAL_DASHBOARD_URI;
            
            if (!essentialDashboardUri || !context?.transaction_id || !context.bap_id) {
                return;
            }
    
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
    
    async update(context, update_target,order,orderDetails) {
        try {

            const cancelRequest = {
                context: context,
                message: order
            }

            const response = await protocolUpdate(cancelRequest);
            console.log("response----------------------->",response)

            await this.sendDataToEssentialDashboard(context, order,orderDetails);


            return { context: context, message: response.message };
        }
        catch (err) {
            throw err;
        }
    }
}

export default BppUpdateService;
