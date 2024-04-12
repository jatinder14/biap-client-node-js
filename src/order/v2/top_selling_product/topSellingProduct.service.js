import _ from "lodash";
import { ORDER_STATUS } from "../../../utils/constants.js";

import OrderMongooseModel from '../../v1/db/order.js';
import {protocolGetLocations,protocolGetLocationDetails} from "../../../utils/protocolApis/index.js";

class TopSellingService {

    /**
     * 
     * @param {Object} user 
     * @param {String} orderId 
     * @param {String} parentOrderId 
     * @param {Number} skip 
     * @param {Number} limit 
     */


    async getTopOrderList(user, params = {}){
        try{
         console.log("121>>>>>>>>>>>>>>>>")
         let { orders, totalCount } = await this.findOrders(user, params);
         console.log("orders?>>>>",orders)
         if (!orders.length) {

            return {
                totalCount: 0,
                orders: [],
            };
        }
        else {
            console.log("jhujgk")
            // orders = orders.toJSON();
            let locations = []
            let orderList = []
            for(let order of orders){

                //construct id
                //bppid:domain_providerid_location_id
                if(order.provider.locations.length>0){
                    let id = `${order.bppId}_${order.domain}_${order.provider.id}_${order.provider.locations[0].id}`
                    const response = await protocolGetLocationDetails({id:id})                    // locations.push(response)
                    console.log("response>>>>>>>",response)

                    // order.locations = response//.data?response.data[0]:[]
                }
                // orderList.push({...order})


            }

            // return {
            //     totalCount: totalCount,
            //     orders: [...orderList],
            // }
        }

        }
        catch{

        }
    }
}

export default TopSellingService;
