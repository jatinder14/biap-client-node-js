import OrderMongooseModel from '../../v1/db/order.js';
import { protocolSearchItems } from "../../../utils/protocolApis/index.js"
import SearchService from "../../../discovery/v2/search.service.js";
const searchService = new SearchService();

class TopSellingService {
    async getTopOrderList(userId, pincode) {
        try {
            const pipeline = [
                {
                    $match: { is_order_confirmed: true }
                },
                {
                    $unwind: "$items"
                },
                {
                    $match: { "items.quantity.count": { $gte: 1 } }
                },
                {
                    $group: {
                        _id: "$items.id",
                        count: { $sum: "$items.quantity.count" }
                    }
                },
                {
                    $sort: { count: -1 }
                },
                {
                    $limit: 10
                },
                {
                    $group: {
                        _id: null,
                        itemIds: { $push: "$_id" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        itemIds: 1
                    }
                }
            ];
            let allOrders = await OrderMongooseModel.aggregate(pipeline);
            const itemIds = allOrders[0]?.itemIds;
            const itemJoin = itemIds?.join(',')
            console.log("itemJoin ================", itemJoin);
            if (itemJoin) {
                const response = await protocolSearchItems({ itemIds: itemJoin });
                if (pincode) {
                    const filteredItems = [];
                    const uniqueItemsMap = new Map();
                    for (const item of response.data) {
                        const provider = item.provider_details;
                        const uniqueKey = `${item?.item_details?.id}_${provider?.id}_${item?.id}`;
                        if (!uniqueItemsMap.has(uniqueKey)) {
                            const serviceable = await searchService.isProviderServiceable(provider, userId, pincode);
                            if (serviceable) {
                                uniqueItemsMap.set(uniqueKey, item);
                                filteredItems.push(item);
                            }
                        }
                    }

                    return filteredItems;
                } else {
                    const uniqueItemsMap = new Map();
                    for (const item of response.data) {
                        const provider = item.provider_details;
                        const uniqueKey = `${item?.item_details?.id}_${provider?.id}_${item?.id}`;
                        if (!uniqueItemsMap.has(uniqueKey)) {
                            uniqueItemsMap.set(uniqueKey, item);
                        }
                    }
                    return Array.from(uniqueItemsMap.values());
                }
            }
            else {
                return []
            }

        } catch (error) {
            throw error;
        }
    }


}

export default TopSellingService;
