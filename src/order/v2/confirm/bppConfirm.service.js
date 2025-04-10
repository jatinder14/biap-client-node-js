import { v4 as uuidv4 } from 'uuid';

import { PAYMENT_COLLECTED_BY, PAYMENT_TYPES, PROTOCOL_PAYMENT } from "../../../utils/constants.js";
import {protocolConfirm, protocolGetDumps} from '../../../utils/protocolApis/index.js';
import OrderMongooseModel from "../../v1/db/order.js";
import lokiLogger from '../../../utils/logger.js';
import Configuration from "../../../configuration/db/configuration.js"

class BppConfirmService {

    /**
     * bpp confirm order
     * @param {Object} confirmRequest 
     * @returns 
     */
    async confirm(confirmRequest = {}) {
        try {
            const response = await protocolConfirm(confirmRequest);
            if (response.error) {
                return { success: false, message: response.data, error: response.error };
            } else {
                return { context: confirmRequest.context, message: response.message };
            }
        }
        catch (err) {
            throw err;
        }
    }

    pad(str, count=2, char='0') {
        str = str.toString();
        if (str.length < count)
            str = Array(count - str.length).fill(char).join('') + str;
        return str;
    };

    /**
     * bpp confirm order
     * @param {Object} context 
     * @param {Object} order 
     * @returns 
     */
    async confirmV1(context, order = {}) {
        try {

            const provider = order?.items?.[0]?.provider || {};

            const confirmRequest = {
                context: context,
                message: {
                    order: {
                        id: uuidv4(),
                        billing: order.billing_info,
                        items: order?.items,
                        provider: {
                            id: provider.id,
                            locations: provider.locations.map(location => {
                                return { id: location }
                            })
                        },
                        fulfillments: [{
                            end: {
                                contact: {
                                    email: order.delivery_info.email,
                                    phone: order.delivery_info.phone
                                },
                                location: order.delivery_info.location,
                            },
                            type: order.delivery_info.type,
                            customer: {
                                person: {
                                    name: order.delivery_info.name
                                }
                            },
                            provider_id: provider.id
                        }],
                        payment: {
                            params: {
                                amount: order?.payment?.paid_amount?.toString(),
                                currency: "INR",
                                transaction_id:order?.jusPayTransactionId//payment transaction id
                            },
                            status: order?.payment?.type === PAYMENT_TYPES["ON-ORDER"] ?
                                PROTOCOL_PAYMENT.PAID :
                                PROTOCOL_PAYMENT["NOT-PAID"],
                            type: order?.payment?.type,
                            collected_by: order?.payment?.type === PAYMENT_TYPES["ON-ORDER"] ? 
                                PAYMENT_COLLECTED_BY.BAP : 
                                PAYMENT_COLLECTED_BY.BPP,
                        },
                        quote: {
                            ...order?.quote
                        },
                        created_at:new Date(),
                        updated_at:new Date()
                    }
                }
            }

            console.log("confirmRequest----------v2----------->",confirmRequest.message.order.payment.params);

            return await this.confirm(confirmRequest);
        }
        catch (err) {
            throw err;
        }
    }

    /**
     * bpp confirm order v2
     * @param {Object} context 
     * @param {Object} order 
     * @param {Object} storedOrder 
     * @returns 
     */
    async confirmV2(context, order = {}, storedOrder = {}) {
        try {
            storedOrder = storedOrder?.toJSON();
            const n = new Date();
            let on_select = await protocolGetDumps({ type: "on_select", transaction_id: context.transaction_id })
            let on_select_fulfillments = on_select.request?.message?.order?.fulfillments ?? []
            let orderId = `${n.getFullYear()}-${this.pad(n.getMonth() + 1)}-${this.pad(n.getDate())}-${Math.floor(100000 + Math.random() * 900000)}`;
            let qoute = { ...(order?.quote || storedOrder?.quote) }
            let value = "" + qoute?.price?.value
            qoute.price.value = value

            let bpp_term = storedOrder?.tags?.find(x => x.code === 'bpp_terms')
            let tax_number = bpp_term?.list?.find(x => x.code === 'tax_number')

            let bpp_terms = [
                {
                    code: "bpp_terms",
                    list:
                        [
                            {
                                "code": "tax_number",
                                "value": tax_number?.value
                            }
                        ]
                },
                {
                    code: "bap_terms",
                    list:
                        [
                            {
                                "code": "tax_number",
                                "value": process.env.BAP_GSTNO
                            }
                        ]
                }
            ]

            // Created - when created by the buyer app;
            // Accepted - when confirmed by the seller app;
            // In-progress - when order is ready to ship;
            // Completed - when all fulfillments completed
            // Cancelled - when order cancelled

            let settlement_details = order?.payment?.type === PAYMENT_TYPES["ON-ORDER"] ?
                storedOrder?.settlementDetails?.["@ondc/org/settlement_details"] :
                order.payment['@ondc/org/settlement_details']
            const bapId = process.env.BAP_ID
            const finder_data = await Configuration.findOne({ bapId })
            const finderFeeType = finder_data?.finderFeeType ?? process.env.BAP_FINDER_FEE_TYPE;
            const finderFee = finder_data?.finderFee ?? process.env.BAP_FINDER_FEE_AMOUNT;

            const confirmRequest = {
                context: context,
                message: {
                    order: {
                        id: orderId,
                        state: "Created",
                        billing: {
                            address: {
                                name: storedOrder?.billing?.address?.name,
                                building: storedOrder?.billing?.address?.building,
                                locality: storedOrder?.billing?.address?.locality,
                                ward: storedOrder?.billing?.address?.ward,
                                city: storedOrder?.billing?.address?.city,
                                state: storedOrder?.billing?.address?.state,
                                country: storedOrder?.billing?.address?.country,
                                area_code: storedOrder?.billing?.address?.areaCode
                            },
                            phone: storedOrder?.billing?.phone,
                            name: storedOrder?.billing?.name,
                            email: storedOrder?.billing?.email,
                            created_at: storedOrder?.billing?.created_at,
                            updated_at: storedOrder?.billing?.updated_at
                        },
                        items: storedOrder?.items && storedOrder?.items?.length &&
                            [...storedOrder?.items].map(item => {
                                return {
                                    id: item.id,
                                    quantity: {
                                        count: item.quantity.count
                                    },
                                    fulfillment_id: item.fulfillment_id,
                                    tags: item.tags,
                                    parent_item_id: item.parent_item_id ?? undefined
                                };
                            }) || [],
                        provider: { id: storedOrder?.provider.id, locations: storedOrder?.provider.locations },
                        fulfillments: [...storedOrder.fulfillments].map((fulfillment) => {
                            let mappedFulfillment = on_select_fulfillments.find((data) => { return data.id == fulfillment?.id });

                            return {
                                '@ondc/org/TAT': mappedFulfillment['@ondc/org/TAT'],
                                id: fulfillment?.id,
                                tracking: fulfillment?.tracking ?? false,
                                end: {
                                    contact: {
                                        email: fulfillment?.end?.contact?.email,
                                        phone: fulfillment?.end?.contact?.phone,
                                    },
                                    person: {
                                        name: fulfillment?.customer?.person?.name
                                    },
                                    location: {
                                        gps: fulfillment?.end?.location?.gps,
                                        address: {
                                            name: fulfillment?.end?.location?.address?.name,
                                            building: fulfillment?.end?.location?.address?.building,
                                            locality: fulfillment?.end?.location?.address?.locality,
                                            ward: fulfillment?.end?.location?.address?.ward,
                                            city: fulfillment?.end?.location?.address?.city,
                                            state: fulfillment?.end?.location?.address?.state,
                                            country: fulfillment?.end?.location?.address?.country,
                                            area_code: fulfillment?.end?.location?.address?.areaCode
                                        }
                                    }
                                },
                                type: "Delivery"
                            }
                        }),
                        payment: {
                            // uri: order?.payment?.type === PAYMENT_TYPES["ON-ORDER"] ? "https://razorpay.com/" :
                            //     undefined, //In case of pre-paid collection by the buyer app, the payment link is rendered after the buyer app sends ACK for /on_init but before calling /confirm;
                            // tl_method: order?.payment?.type === PAYMENT_TYPES["ON-ORDER"] ?
                            //     "http/get" :
                            //     undefined,
                            // razorpayPaymentId: order?.payment?.razorpayPaymentId,
                            params: {
                                amount: order?.payment?.paid_amount?.toFixed(2)?.toString(),
                                currency: "INR",
                                transaction_id: uuidv4()
                            },
                            status: order?.payment?.type === PAYMENT_TYPES["ON-ORDER"] ?
                                PROTOCOL_PAYMENT.PAID :
                                PROTOCOL_PAYMENT["NOT-PAID"],
                            type: order?.payment?.type,
                            collected_by: order?.payment?.type === PAYMENT_TYPES["ON-ORDER"] ?
                                PAYMENT_COLLECTED_BY.BAP :
                                PAYMENT_COLLECTED_BY.BPP,
                            '@ondc/org/buyer_app_finder_fee_type': finderFeeType,
                            '@ondc/org/buyer_app_finder_fee_amount': finderFee,
                            '@ondc/org/settlement_basis': order.payment['@ondc/org/settlement_basis'] ?? "delivery",
                            '@ondc/org/settlement_window': order.payment['@ondc/org/settlement_window'] ?? "P1D",
                            '@ondc/org/withholding_amount': order.payment['@ondc/org/withholding_amount'] ?? "0",
                            "@ondc/org/settlement_details": settlement_details,

                        },
                        quote: {
                            ...(qoute)
                        },
                        tags: bpp_terms
                        ,
                        created_at: context.timestamp,
                        updated_at: context.timestamp
                    }
                }
            };
            let confirmResponse = await this.confirm(confirmRequest);
            return confirmResponse
        }
        catch (err) {
            throw err;
        }
    }
}

export default BppConfirmService;
