import OrderModel from "../order/v1/db/order.js";
import FulfillmentHistory from "../order/v2/db/fulfillmentHistory.js"
import { parseDuration } from "../utils/stringHelper.js";

    export async function getOrdersHandler(req, res) {
        try {
            const apiKey = req.headers['wil-api-key'];

            if (apiKey !== process.env.WIL_API_KEY) {
                res.status(401).send('Missing or wrong wil-api-key header');
                return;
            }

            const { limit = 100, page = 1, bppId } = req.query;

            const limitValue = parseInt(limit);
            const pageValue = parseInt(page);

            const skip = (pageValue - 1) * limitValue;

            const orderCount = await OrderModel.countDocuments({ is_order_confirmed: true })
            const allOrders = await OrderModel.find({ is_order_confirmed: true }).sort({ createdAt: -1 })
            const fulfillment = await FulfillmentHistory.find({})

            let orderData = allOrders.map(async ({ _id, transactionId, context, createdAt, updatedAt, state, quote, items, id, fulfillments,
                settle_status, settlement_id, settlement_reference_no, order_recon_status, counterparty_recon_status,
                counterparty_diff_amount_value, counterparty_diff_amount_currency, receiver_settlement_message, receiver_settlement_message_code, customer,
                updatedQuote, payment }) => {
                

                const orderFulfillmentData = fulfillment.filter(data => data?.orderId === id);

                const fulfillment_state = orderFulfillmentData.length?orderFulfillmentData[orderFulfillmentData.length - 1]:{};
                
                const logistics_details = fulfillments.find(fulfillment => {
                    if (fulfillment?.agent) {
                        return { agent_name: fulfillment?.agent?.name || "", vehicle: fulfillment?.vehicle?.registration || "" }
                    }
                }) || {}

                const orderItem = {
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
                    quote: quote,
                    updatedQuote: updatedQuote,
                    payment: payment,
                    updated_at: updatedAt,
                    collector_recon_sent: false,
                    on_collector_recon_received: false,
                    order_amount: quote?.price?.value,
                    settle_status,
                    fulfillment_state: fulfillment_state?.state || 'Pending',
                    customer: {
                        id: customer?._id,
                        person: {
                            name: customer?.person?.name || "",
                            gender: customer?.person?.gender || "",
                        },
                        contact: {
                            phone: customer?.contact?.phone || "",
                            email: customer?.contact?.email || "",
                        }
                    },
                    logistics_details: logistics_details,
                    items: items.map(({ id, title, price, quantity, product }) => ({
                        sku: id,
                        name: product?.descriptor?.name,
                        price: product?.price?.value,
                        title: product?.descriptor?.name,
                        vendor: product?.provider_details?.descriptor?.name,
                        item_id: id,
                        quantity: quantity?.count,
                        product_id: product?.id,
                        variant_id: 'Variant ID',
                        return_window: parseDuration(product["@ondc/org/return_window"]) || '',
                        variant_title: 'Variant Title'
                    })),
                    return_window: '@ondc/org/return_window',
                    payment_type: 'PREPAID',
                    shopify_order_status: 'unfulfilled',
                    replaced_with_order_id: null,
                    replaced_order_details: null,
                    settlement_type: settle_status || 'Pending',
                    returns: null,
                    return_logistics_id: null,
                    replaced_order_details: null
                };
            
                return orderItem;
            });
           
            orderData = await Promise.all(orderData)
            const {state} = req.query;
            

            if (state) {
                const states = state.split(','); // Split the input state string into an array
                // Define an array to store filtered data for each state combination
                const filteredDataArray = states.map(state => {
                    const filteredData =orderData.filter(data => data.fulfillment_state === state);
                    return filteredData
                });

                // Combine filtered data for each state combination
                const combinedData = filteredDataArray.reduce((acc, curr) => acc.concat(curr), []);
                const startIndex = (pageValue - 1) * limitValue;
                const endIndex = startIndex + limitValue;
                const paginatedData = combinedData.slice(startIndex, endIndex);




                res.send({
                    success: true,
                    data: paginatedData,
                    count: combinedData.length,
                });
            } else {
                // Apply pagination to the settlement data
            const startIndex = (pageValue - 1) * limitValue;
            const endIndex = startIndex + limitValue;
            const paginatedData = orderData.slice(startIndex, endIndex);

                res.send({
                    success: true,
                    data: paginatedData,
                    count: orderCount,
                });
            }
            
        } catch (error) {
            console.error("Error fetching settlements:", error);
            res.status(500).send({ success: false, message: "Error fetching settlements" });
        }
    }
