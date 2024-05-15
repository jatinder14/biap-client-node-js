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
                        "context": {
                            "domain": context.domain,
                            "country": context.country,
                            "city": context.city,
                            "action": context.action,
                            "core_version": context.core_version,
                            "bap_id": context.bap_id,
                            "bpp_id": context.bpp_id,
                            "bpp_uri": context.bpp_uri,
                            "transaction_id": context.transaction_id,
                            "message_id": context.message_id,
                            "timestamp": context.timestamp,
                            "ttl": context.ttl      
                        },
                        "message": {
                            "update_target": order.update_target,
                            "order": {
                                "id": order.order.id,
                                "fulfillments": order.order.fulfillments.map(fulfillment => ({
                                    "type": fulfillment.type,
                                    "tags": fulfillment.tags.map(tag => ({
                                        "code": tag.code,
                                        "list": tag.list.map(item => ({
                                            "code": item.code,
                                            "value": item.value
                                        }))
                                    }))
                                }))
                            }
                        }
                    }
                }
            };
    
            const data = JSON.stringify(payload);
           console.log('data64', data)
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
