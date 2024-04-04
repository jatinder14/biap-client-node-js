import OrderModel from "../order/v1/db/order.js";
import ConfirmModel from "../order/v1/db/onConfirmDump.js";

export async function getSettlementsHandler(req, res) {
    try {
        const apiKey = req.headers['wil-api-key'];

        if (apiKey!==process.env.WIL_API_KEY) {
            res.status(401).send('Missing or wrong wil-api-key header');
            return;
        }
        const { limit = 20, page = 1, bppId } = req.query;
         // Parse limit and page to integers
         const limitValue = parseInt(limit);
         const pageValue = parseInt(page);
 
         // Calculate skip value based on page number and limit
         const skip = (pageValue - 1) * limitValue;
 
         // Fetch completed orders with pagination
         const completedOrders = await OrderModel.find({}).sort({createdAt:-1})
             .limit(limitValue)
             .skip(skip);

        const orderCount = await OrderModel.countDocuments({})

        let sumCompletedOrderAmount = 0; // Need to manage calculation
        let sumPendingOrderAmount = 0; // Need to manage calculation
        const settlementData = [];

        completedOrders.forEach(({ _id, transactionId, context, createdAt, updatedAt, state, quote, items, id, 
            settle_status, is_settlement_sent, settlement_id, settlement_reference_no, order_recon_status, counterparty_recon_status,
            counterparty_diff_amount_value, counterparty_diff_amount_currency, receiver_settlement_message, receiver_settlement_message_code  }) => {
            sumCompletedOrderAmount += parseFloat(quote?.price?.value) || 0;
            const settlementItem = {
                id: id || _id,
                order_id: _id,
                transaction_id: transactionId,
                buyer_order_id: _id,
                domain: context ? context.domain : "ONDC:RET18",
                bpp_uri: context ? context.bpp_uri : "",
                bpp_id: context ? context.bpp_id : "",
                bap_uri: context ? context.bap_uri : "",
                bap_id: context ? context.bap_id : "",
                settlement_id: settlement_id,
                settlement_reference_no: settlement_reference_no,
                order_recon_status: order_recon_status,
                counterparty_recon_status: counterparty_recon_status,
                counterparty_diff_amount_value: counterparty_diff_amount_value,
                counterparty_diff_amount_currency: counterparty_diff_amount_currency,
                receiver_settlement_message: receiver_settlement_message,
                receiver_settlement_message_code: receiver_settlement_message_code,
                created_at: createdAt,
                order_status: state || "Accepted",
                updated_at: updatedAt,
                collector_recon_sent: false,
                on_collector_recon_received: false,
                order_amount: quote?.price?.value , // Apply optional chaining
                settle_status,
                // order_amount: 529,

                items: items.map(({ id, title, price, quantity,product }) => ({
                    sku: id,
                    name: product?.descriptor?.name,
                    price: product?.price?.value,
                    title: product?.descriptor?.name,
                    vendor:product?.provider_details?.descriptor?.name,
                    item_id: id,
                    quantity: quantity?.count,
                    product_id: product?.id,
                    variant_id: 'Variant ID',
                    return_window: '@ondc/org/return_window',
                    variant_title: 'Variant Title'
                })),
                return_window: '@ondc/org/return_window',
                payment_type: 'PREPAID',
                shopify_order_status: 'unfulfilled',
                replaced_with_order_id: null,
                customer_id: 'Customer ID',
                replaced_order_details: null,
                settlement_type: settle_status || 'Pending'
            };

            settlementData.push(settlementItem);
        });

        res.send({
            success: true,
            data: settlementData,
            count: orderCount,
            sumCompletedOrderAmount: sumCompletedOrderAmount.toFixed(2),
            sumPendingOrderAmount: sumPendingOrderAmount.toFixed(2),
        });
    } catch (error) {
        console.error("Error fetching settlements:", error);
        res.status(500).send({ success: false, message: "Error fetching settlements" });
    }
}
