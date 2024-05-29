import NoRecordFoundError from "../../../lib/errors/no-record-found.error.js";
import OrderMongooseModel from './order.js';
import OrderRequestLogMongooseModel from "./orderRequestLog.js";
import OrderHistory from "../../v2/db/orderHistory.js";
import FulfillmentHistory from "../../v2/db/fulfillmentHistory.js";
import { BUYER_STATES } from "../../../utils/constant/order.js";
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
    return await OrderMongooseModel.findOneAndUpdate(
        {
            transactionId: transactionId,
            "provider.id": providerId       
        
        },
        {
            ...orderSchema
        },
        { upsert: true }
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
    });

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
    const order = await OrderMongooseModel.find({
        transactionId: transactionId,
        "provider.id": providerId,
        buyer_state:BUYER_STATES.UNCONFIRMED
    });
  console.log('order111', JSON.stringify(order))
    if (!(order || order.length))
        throw new NoRecordFoundError();
    else
        return order?.[0];
};

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
            let orderHistory = await OrderHistory.find({ orderId: orderId })
            let fulfillmentHistory = await FulfillmentHistory.find({ orderId: orderId })
            order[0].orderHistory = orderHistory
            order[0].fulfillmentHistory = fulfillmentHistory
            return order;
        }
    }
    catch (error) {
        return error
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

export { getOrderRequest, addOrUpdateOrderWithdOrderId, getOrderRequestLatestFirst, saveOrderRequest, addOrUpdateOrderWithTransactionIdAndOrderId, addOrUpdateOrderWithTransactionId, getOrderByTransactionIdAndProvider, getOrderByTransactionId, getOrderById, addOrUpdateOrderWithTransactionIdAndProvider, getOrderByTransactionAndOrderId };
