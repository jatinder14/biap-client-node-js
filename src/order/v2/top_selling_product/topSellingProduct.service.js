import OrderMongooseModel from '../../v1/db/order.js';


import {protocolSearchItems} from "../../../utils/protocolApis/index.js"
import NoRecordFoundError from '../../../lib/errors/no-record-found.error.js';
class TopSellingService {
    async getTopOrderList() {
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
              const itemJoin=itemIds?.join(',')
            if(itemJoin){
              const response = await protocolSearchItems({ itemIds:itemJoin });
              return response.data    
            }
            else{
              return []
            }
            
        } catch (error) {
            throw error;
        }
    }
    
    
}

export default TopSellingService;
