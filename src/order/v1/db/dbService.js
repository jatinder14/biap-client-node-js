import NoRecordFoundError from "../../../lib/errors/no-record-found.error.js";
import OrderMongooseModel from './order.js';
import OrderRequestLogMongooseModel from "./orderRequestLog.js";
import OrderHistory from "../../v2/db/orderHistory.js";
import FulfillmentHistory from "../../v2/db/fulfillmentHistory.js";
/**
* INFO: upsert order based on transaction id
 * @param {String} transactionId 
 * @param {Object} orderSchema 
 */
const addOrUpdateOrderWithTransactionId = async (transactionId, orderSchema = {}) => {
    return await OrderMongooseModel.findOneAndUpdate(
        {
            transactionId: transactionId
        },
        {
            ...orderSchema
        },
        { upsert: true }
    );
};

/**
 * INFO: Order upsert based on transaction and provider id
 * @param {String} transactionId 
 * @param {String} providerId 
 * @param {Object} orderSchema 
 * @returns 
 */
const addOrUpdateOrderWithTransactionIdAndProvider = async (transactionId, providerId, orderSchema = {}) => {
    return await OrderMongooseModel.findOneAndUpdate({
        transactionId: transactionId,
        "provider.id": providerId
    }, {
        ...orderSchema
    }, { upsert: true }
    );
};

/**
 * INFO: Order upsert based on order and transaction id
 * @param {String} transactionId 
 * @param {String} orderId 
 * @param {Object} orderSchema 
 * @returns 
 */
const addOrUpdateOrderWithTransactionIdAndOrderId = async (transactionId, orderId, orderSchema = {}) => {
    return await OrderMongooseModel.findOneAndUpdate(
        {
            transactionId: transactionId,
            "id": orderId
        },
        {
            ...orderSchema
        },
        { upsert: true }
    );
};

/**
 * INFO: Upsert order details
 * @param {String} orderId 
 * @param {Object} orderSchema 
 * @returns 
 */
const addOrUpdateOrderWithdOrderId = async (orderId, orderSchema = {}) => {
    return await OrderMongooseModel.findOneAndUpdate(
        {
            "id": orderId
        },
        {
            ...orderSchema
        },
        { upsert: true }
    );

};

/**
 * get the order with passed transaction id from the database
 * @param {String} transactionId 
 * @returns 
 */
const getOrderByIdAndTransactionId = async (transactionId, orderId) => {
    const order = await OrderMongooseModel.find({
        transactionId: transactionId,
        id: orderId,
    });

    if (!(order || order.length))
        throw new NoRecordFoundError();
    else
        return order;
};

/**
 * get the order with passed transaction id from the database
 * @param {String} transactionId 
 * @returns 
 */
const getOrderByTransactionId = async (transactionId) => {
    const order = await OrderMongooseModel.find({
        transactionId: transactionId
    });

    if (!(order || order.length))
        throw new NoRecordFoundError();
    else
        return order?.[0];
};

/**
 * get the order with passed transaction_id and order_id from the database
 * @param {String} transactionId 
 * @returns 
 */
const getOrderByTransactionAndOrderId = async (transactionId, orderId) => {
    const order = await OrderMongooseModel.find({
        transactionId: transactionId,
        id: orderId
    }).lean().exec();

    if (!(order || order.length))
        throw new NoRecordFoundError();
    else
        return order?.[0];
};

/**
 * INFO: get order by tranction and provider id
 * @param {String} transactionId 
 * @param {String} providerId 
 * @returns 
 */
const getOrderByTransactionIdAndProvider = async (transactionId, providerId) => {
    const order = await OrderMongooseModel.findOne({
        transactionId: transactionId,
        "provider.id": providerId
    });

    if (!order)
        throw new NoRecordFoundError();
    else
        return order;
};

/**
 * INFO: get unique items id's only
 * @param {Array} items 
 * @returns 
 */
const getUniqueItems = (items) => {
    const uniqueItems = items.reduce((acc, item) => {
        let existingItem = acc.find(entry => entry.id === item.id);

        if (existingItem) {
            existingItem.quantity.count += item.quantity.count;
        } else {
            acc.push({
                id: item.id,
                quantity: { count: item.quantity.count },
                product: item.product
            });
        }

        return acc;
    }, []);
    return uniqueItems;
}

/**
 * INFO: get fulfillment tracking details
 * @param {Array} uniqueItems 
 * @param {Array} fulfillmentHistory 
 * @returns 
 */
const getFulfillmentTacking = (uniqueItems, fulfillmentHistory) => {
    const fulfillmentTracking = [];
    for (let item of uniqueItems) {
        let track = { item_id: item.id, item_details: item, tracking: [] };
        const tracking = []
        for (let history of fulfillmentHistory) {
            if ((["Cancel", "Return"].includes(history.type) || history.state == "Cancelled") && history?.itemIds?.hasOwnProperty(item.id)) {
                tracking.push(history);
            } else if (!(["Cancel", "Return"].includes(history.type) || history.state == "Cancelled")) {
                tracking.push(history);
            }
        }
        track.tracking = tracking
        fulfillmentTracking.push(track);
    }
    return fulfillmentTracking
}

/**
 * INFO: get order details by id
 * @param {String} orderId 
 * @returns 
 */
const getOrderById = async (orderId) => {
    try {
        let order = await OrderMongooseModel.find({
            id: orderId
        }).lean();

        if (!(order || order.length))
            throw new NoRecordFoundError();
        else {
            // order = order.toJSON();
            let orderHistory = await OrderHistory.find({ orderId: orderId }).lean().exec()
            let fulfillmentHistory = await FulfillmentHistory.find({ orderId: orderId }).lean().exec()
            order[0].orderHistory = orderHistory
            order[0].fulfillmentHistory = fulfillmentHistory
            const uniqueItems = getUniqueItems(order[0].items);
            const fulfillmentTracking = getFulfillmentTacking(uniqueItems, fulfillmentHistory);
            order[0].fulfillmentTracking = fulfillmentTracking;
            order[0]?.items?.forEach(el => {
                const breakup = order?.[0]?.quote?.breakup?.find(breakupItem => {
                    return breakupItem?.['@ondc/org/item_id'] === el?.id;
                });
                const updatedBreakup = order?.[0]?.updatedQuote?.breakup?.find(breakupItem => {
                    return breakupItem?.['@ondc/org/item_id'] === el?.id;
                });
                if (order[0]?.state === "Cancelled") {
                    el.fulfillment_status = "Cancelled";
                }
                el.boughtItemcount = breakup?.["@ondc/org/item_quantity"]?.count ?? 0;
                el.cancelItemcount = (breakup?.["@ondc/org/item_quantity"]?.count - updatedBreakup?.["@ondc/org/item_quantity"]?.count) ?? 0;
            });

            return order;
        }
    }
    catch (error) {
        throw error
    }

};

/**
 * INFO: get order details by id
 * @param {String} orderId 
 * @returns 
 */
const getOrderBasicDetailsById = async (orderId) => {
    try {
        let order = await OrderMongooseModel.findOne({
            id: orderId
        }).lean().exec();

        if (!order)
            throw new NoRecordFoundError();

        return order;
    }
    catch (error) {
        throw error
    }

};

/**
 * INFO: Save order requirest
 * @param {Object} data 
 * @returns 
 */
const saveOrderRequest = async (data) => {
    const transactionId = data.context.transaction_id
    const messageId = data.context.message_id
    const request = data.data
    const requestType = data.context.action
    const order = new OrderRequestLogMongooseModel({ requestType, transactionId, messageId, request })
    await order.save();

    return order;
};

/**
 * INFO: Get order requirest
 * @param {Object} data 
 * @returns 
 */
const getOrderRequest = async (data) => {
    const transactionId = data.transaction_id
    const messageId = data.message_id
    const requestType = data.requestType
    const order = await OrderRequestLogMongooseModel.findOne({ transactionId, messageId, requestType })
    return order;
};

/**
 * INFO: Get order requirest in Descending order on added date
 * @param {Object} data 
 * @returns 
 */
const getOrderRequestLatestFirst = async (data) => {
    const transactionId = data.transaction_id
    const requestType = data.requestType
    const order = await OrderRequestLogMongooseModel.findOne({ transactionId, requestType }).sort({ "createdAt": -1 })
    return order;
};

const getTotalOrderedItemsCount = async (orderId) => {
    const totalItemsCountData = await OrderMongooseModel.aggregate([
        {
            $match: { id: orderId },
        },
        {
            $unwind: "$items",
        },
        {
            $group: {
                _id: null,
                totalCount: { $sum: "$items.quantity.count" },
            },
        },
    ]);
    return totalItemsCountData[0]?.totalCount;
}


const getTotalItemsCountByAction = async (orderId, action) => {
    const totalItemsCountByActionData = await FulfillmentHistory.aggregate(
        [
            {
                $match: {
                    orderId: orderId,
                    state: action
                }
            },
            {
                $project: {
                    itemIds: { $objectToArray: "$itemIds" }
                }
            },
            { $unwind: "$itemIds" },
            {
                $group: {
                    _id: null,
                    totalQuantity: {
                        $sum: { $toInt: "$itemIds.v.quantity" }
                    }
                }
            },
            {
                $project: { _id: 0, totalQuantity: 1 }
            }
        ]);

    return totalItemsCountByActionData[0]?.totalQuantity ? Number(totalItemsCountByActionData[0]?.totalQuantity) : 0;

}
export { getOrderRequest, addOrUpdateOrderWithdOrderId, getOrderRequestLatestFirst, saveOrderRequest, getOrderByIdAndTransactionId, addOrUpdateOrderWithTransactionIdAndOrderId, addOrUpdateOrderWithTransactionId, getOrderByTransactionIdAndProvider, getOrderByTransactionId, getOrderById, addOrUpdateOrderWithTransactionIdAndProvider, getTotalOrderedItemsCount, getTotalItemsCountByAction, getOrderByTransactionAndOrderId, getOrderBasicDetailsById };
