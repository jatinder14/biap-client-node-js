import OrderModel from "../order/v1/db/order.js";
import FulfillmentHistory from "../order/v2/db/fulfillmentHistory.js"
import { parseDuration } from "../utils/stringHelper.js";

export async function getOrdersHandler(req, res) {
    console.log("Insidssd")
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

        const orderCount = await OrderModel.countDocuments({})
        const allOrders = await OrderModel.find({ is_order_confirmed: true }).sort({ createdAt: -1 }).skip(skip).limit(limitValue);
      
        let orderData = allOrders.map(async ({ _id, transactionId, context, createdAt, updatedAt, state, quote, items, id, fulfillments,
            settle_status, settlement_id, settlement_reference_no, order_recon_status, counterparty_recon_status,
            counterparty_diff_amount_value, counterparty_diff_amount_currency, receiver_settlement_message, receiver_settlement_message_code, customer,
            updatedQuote, payment }) => {
            // const fulfillment_state = fulfillments.map(fulfillment => {
            //     if (fulfillment.state) {
            //         return fulfillment?.state?.descriptor?.code;
            //     } else {
            //         return null;
            //     }
            // });

            const fulfillment = await FulfillmentHistory.find({ orderId: id }).sort({ updatedAt: -1 }).lean()
            const fulfillment_state = fulfillment.length ? fulfillment[0] : {}

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
        if (state &&  state=== "Accepted") {
        const filteredData = orderData.filter((data) => data.order_status === "Accepted");
    res.send({
        success: true,
        data: filteredData,
        count: filteredData.length,
    });
} else if(state &&  state=== "Created"){
    const filteredData = orderData.filter((data) => data.order_status === "Created");
    res.send({
        success: true,
        data: filteredData,
        count: filteredData.length,
    });
}
else if(state &&  state=== "In-progress"){
    const filteredData = orderData.filter((data) => data.order_status === "In-progress");
    res.send({
        success: true,
        data: filteredData,
        count: filteredData.length,
    });
}

else {
    res.send({
        success: true,
        data: orderData,
        count: orderCount,
    });
}

        
    } catch (error) {
        console.error("Error fetching settlements:", error);
        res.status(500).send({ success: false, message: "Error fetching settlements" });
    }
}
