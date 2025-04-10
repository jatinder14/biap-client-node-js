import OrderModel from "../order/v1/db/order.js";
import { SETTLE_STATUS } from "../utils/constants.js";
import { parseDuration } from "../utils/stringHelper.js";

export async function getSettlementsHandler(req, res) {
    try {
        const apiKey = req.headers['wil-api-key'];

        if (apiKey!==process.env.WIL_API_KEY) {
            res.status(401).send('Missing or wrong wil-api-key header');
            return;
        }
        const { limit = 50, page = 1, bppId } = req.query;
         // Parse limit and page to integers
         const limitValue = parseInt(limit);
         const pageValue = parseInt(page);
        
         // Calculate skip value based on page number and limit
         const skip = (pageValue - 1) * limitValue;
         const orderCount = await OrderModel.countDocuments({ is_order_confirmed: true })

         // Fetch completed orders with pagination
         const completedOrders = await OrderModel.find({ is_order_confirmed: true }).sort({createdAt:-1})

             
        const allOrders = await OrderModel.find({ is_order_confirmed: true }).sort({createdAt:-1}).lean()

        let sumCompletedOrderAmount = 0;
        let sumPendingOrderAmount = 0;
        let sumTodayOrderAmount = 0;

        const orderAnalysis = {
            year: {},
            month: {},
            week: {},
        }

        allOrders.forEach((el) => {
            let { createdAt, items, quote, settle_status, refunded_amount } = el
            const refundedAmount = refunded_amount ? refunded_amount : 0
            const gross_order_price = quote?.price?.value ? Number(quote?.price?.value) - refundedAmount : 0
            const item_price = items.reduce((accumulator, currentItem) => accumulator + (currentItem.product?.price?.value || 0) * (currentItem.quantity?.count || 0), 0);
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "June",
                "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
            // Extract year, month, and week from createdAt
            createdAt = new Date(createdAt);
            const year = createdAt.getFullYear();
            const month = monthNames[createdAt.getMonth()];
            const week = Math.ceil((createdAt.getDate() + new Date(createdAt.getFullYear(), 0, 1).getDay()) / 7);
            const orderYear = year
            const orderMonth = month
            const orderWeek = week
            const grossOrderPrice = gross_order_price
            const itemPrice = item_price

            if (settle_status == SETTLE_STATUS.SETTLE)  {
                sumCompletedOrderAmount += gross_order_price;
            } else {
                sumPendingOrderAmount += gross_order_price;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (createdAt >= today) {
                    sumTodayOrderAmount += gross_order_price;
                }
            }

            // Group by year
            if (!orderAnalysis.year[orderYear]) {
            orderAnalysis.year[orderYear] = { grossOrderPrice: 0, netItemPrice: 0 }
            }

            orderAnalysis.year[orderYear].grossOrderPrice += parseFloat(grossOrderPrice)
            orderAnalysis.year[orderYear].netItemPrice += parseFloat(itemPrice)

            // Group by month
            if (!orderAnalysis.month[orderMonth]) {
            orderAnalysis.month[orderMonth] = { grossOrderPrice: 0, netItemPrice: 0 }
            }

            orderAnalysis.month[orderMonth].grossOrderPrice += parseFloat(grossOrderPrice)
            orderAnalysis.month[orderMonth].netItemPrice += parseFloat(itemPrice)

            // Group by week
            if (!orderAnalysis.week[orderWeek]) {
            orderAnalysis.week[orderWeek] = { grossOrderPrice: 0, netItemPrice: 0 }
            }

            orderAnalysis.week[orderWeek].grossOrderPrice += parseFloat(grossOrderPrice)
            orderAnalysis.week[orderWeek].netItemPrice += parseFloat(itemPrice)
        })
        const settlementData = await Promise.all(completedOrders.map(async ({ _id, transactionId, messageId, context, createdAt, updatedAt, state, quote, items, id, 
            settle_status, is_settlement_sent, settlement_id, settlement_reference_no, order_recon_status, counterparty_recon_status, refunded_amount,
            counterparty_diff_amount_value, counterparty_diff_amount_currency, receiver_settlement_message, receiver_settlement_message_code,
            updatedQuote, payment, settlementDetails }) => {

            const refundedAmount = refunded_amount ? refunded_amount : 0
            const paymentAmount = payment?.params?.get('amount') ? Number(payment?.params?.get('amount')) - refundedAmount : 0
            const buyerPercentage = paymentAmount * (Number(settlementDetails['@ondc/org/buyer_app_finder_fee_amount']) / 100)
            const withHoldAmount = !settlementDetails['@ondc/org/withholding_amount'] ? 0 : settlementDetails['@ondc/org/withholding_amount']    

            const settlementAmount = settlementDetails["@ondc/org/buyer_app_finder_fee_type"]?.toLowerCase()=='percent'?
            paymentAmount - Number(buyerPercentage) - Number(withHoldAmount)
            : paymentAmount - Number(settlementDetails['@ondc/org/buyer_app_finder_fee_amount']) - Number(withHoldAmount)

            const buyer_take = settlementDetails["@ondc/org/buyer_app_finder_fee_type"]?.toLowerCase()=='percent'?
            Number(buyerPercentage) + Number(withHoldAmount)
            : Number(settlementDetails['@ondc/org/buyer_app_finder_fee_amount']) + Number(withHoldAmount)

            const orderAmount = quote?.price?.value ? parseFloat((Number(quote?.price?.value) - refundedAmount).toFixed(2)) : 0
            const seller_take = orderAmount ? orderAmount - Number(buyer_take) : 0
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
                order_amount: orderAmount?.toFixed(2),
                settle_status,
                quote, 
                updatedQuote, 
                payment,
                buyer_take: buyer_take?.toFixed(2), 
                seller_take: seller_take?.toFixed(2),
                settlement_amount: seller_take?.toFixed(2),
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
                    return_window: parseDuration(product['@ondc/org/return_window']) || '',
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

            return settlementItem;
        }));
       
        const {state} = req.query;
        if (state) {
            const states = state.split(','); // Split the input state string into an array
        
            // Define an array to store filtered data for each state combination
            const filteredDataArray = states.map(state => {
                return settlementData.filter(data => data?.settlement_type === state);
            });
            const combinedFilteredData = filteredDataArray.reduce((acc, curr) => acc.concat(curr), []);
            const startIndex = (pageValue - 1) * limitValue;
            const endIndex = startIndex + limitValue;
            const paginatedData = combinedFilteredData.slice(startIndex, endIndex);


            res.send({
                success: true,
                data: paginatedData,
                count: orderCount,
                filterCount:combinedFilteredData.length,
                sumCompletedOrderAmount: sumCompletedOrderAmount.toFixed(2),
                sumPendingOrderAmount: sumPendingOrderAmount.toFixed(2),
                sumTodayOrderAmount: sumTodayOrderAmount.toFixed(2),
                orderAnalysis: orderAnalysis
            });
        } else {
            const startIndex = (pageValue - 1) * limitValue;
            const endIndex = startIndex + limitValue;
            const paginatedData = settlementData.slice(startIndex, endIndex);

            res.send({
                success: true,
                data: paginatedData,
                count: orderCount,
                filterCount:orderCount,
                sumCompletedOrderAmount: sumCompletedOrderAmount.toFixed(2),
                sumPendingOrderAmount: sumPendingOrderAmount.toFixed(2),
                sumTodayOrderAmount: sumTodayOrderAmount.toFixed(2),
                orderAnalysis: orderAnalysis
            });
        }
        
        
    } catch (error) {
        console.error("Error fetching settlements:", error);
        res.status(500).send({ success: false, message: "Error fetching settlements" });
    }
}
