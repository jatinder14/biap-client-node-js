import { protocolCancel } from "../../../utils/protocolApis/index.js";

class BppCancelService {

    /**
     * 
     * @param {Object} context 
     * @param {String} orderId 
     * @param {String} cancellationReasonId 
     * @returns 
     */
    async cancelOrder(context, orderId, cancellationReasonId = "001") {
        try {
            const cancelRequest = {
                context: context,
                message: {
                    order_id: orderId,
                    cancellation_reason_id: cancellationReasonId
                }
            }
            const response = await protocolCancel(cancelRequest);
            console.log("bpp cancelOrder response -------", response.message);
            return { context: context, message: response.message };
        }
        catch (err) {
            console.log("bpp cancelOrder -------", err);
            throw err;
        }
    }
}

export default BppCancelService;
