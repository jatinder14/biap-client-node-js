import { protocolSearch } from "../../utils/protocolApis/index.js";
import Configuration from "../../configuration/db/configuration.js";
class BppSearchService {

    /**
     * 
     * @param {Object} context 
     * @param {Object} req 
     * @returns 
     */
    async search(context = {}, req = {}) {
        try {
            const { criteria = {}, payment = {} } = req || {};
            const bapId = process.env.BAP_ID
            const finder_data = await Configuration.findOne({ bapId })
            const finderFeeType = finder_data?.finderFeeType ?? process.env.BAP_FINDER_FEE_TYPE;
            const finderFee = finder_data?.finderFee ?? process.env.BAP_FINDER_FEE_AMOUNT;

            const searchRequest = {
                context: context,
                message: {
                    intent: {
                        ...(
                            criteria?.search_string && {
                                item: {
                                    descriptor: {
                                        name: criteria.search_string
                                    }
                                }
                            }
                        ),
                        ...((criteria?.provider_id || criteria?.category_id || criteria?.provider_name) && {
                            provider: {
                                ...(criteria?.provider_id && {
                                    id: criteria?.provider_id
                                }),
                                ...(criteria?.category_id && {
                                    category_id: criteria.category_id
                                }),
                                ...(criteria?.provider_name && {
                                    descriptor: {
                                        name: criteria?.provider_name
                                    }
                                })
                            }
                        }),
                        ...((criteria?.pickup_location || criteria?.delivery_location)? {
                            fulfillment: {
                                type:"Delivery",
                                ...(criteria?.pickup_location && {
                                    start: {
                                        location: {
                                            gps: criteria?.pickup_location
                                        }
                                    }
                                }),
                                ...(criteria?.delivery_location && {
                                    end: {
                                        location: {
                                            gps: criteria?.delivery_location
                                        }
                                    }
                                })
                            }
                        }:{fulfillment: {
                            type:"Delivery"}}),
                        ...(
                            (criteria?.category_id || criteria?.category_name) && {
                                category: {
                                    ...(criteria?.category_id && {
                                        id: criteria?.category_id
                                    }),
                                    ...(criteria?.category_name && {
                                        descriptor: {
                                            name: criteria?.category_name
                                        }
                                    }
                                    )
                                }
                            }
                        ),
                        payment: {
                            "@ondc/org/buyer_app_finder_fee_type": finderFeeType,
                            "@ondc/org/buyer_app_finder_fee_amount": finderFee,
                        }
                    }
                }
            }

            const response = await protocolSearch(searchRequest);

            return { context: context,searchRequest:searchRequest, message: response.message };
        }
        catch (err) {
            throw err;
        }
    }
}

export default BppSearchService;
