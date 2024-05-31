import FulfillmentHistory from "../../v2/db/fulfillmentHistory.js";
import { ORDER_TYPE } from "../../../utils/constants.js";
import lokiLogger from "../../../utils/logger.js";

const createNewFullfillmentObject = (
  incomingFulfillment,
  fullfillmentHistoryData,
  orderData,
  orderId,
  incomingItemQuoteTrailData = {}
) => {
  try {
    let newFullfillment;

    // Check if the fulfillment already exists
    const fulfillmentExists = checkFulfillmentExistence(incomingFulfillment, fullfillmentHistoryData);

    if (!fulfillmentExists && isCancelableOrReturn(incomingFulfillment)) {
      const currentFulfillmentHistoryData = getItemsIdsDataForFulfillment(
        incomingFulfillment,
        orderData,
        incomingItemQuoteTrailData
      );
      newFullfillment = createFulfillmentHistory(incomingFulfillment, orderId, currentFulfillmentHistoryData);
    }

    lokiLogger.info(`newFullfillment--------------------, ${JSON.stringify(newFullfillment)}`);
    return newFullfillment;
  } catch (err) {
    console.error("Error in createNewFullfillmentObject:", err);
    throw err;
  }
};

const checkFulfillmentExistence = (incomingFulfillment, fullfillmentHistoryData) => {
  return fullfillmentHistoryData.some((fulfillment) => {
    return (
      incomingFulfillment.id === fulfillment.id &&
      incomingFulfillment?.state?.descriptor?.code === fulfillment.state &&
      incomingFulfillment.type === fulfillment.type
    );
  });
};

const isCancelableOrReturn = (incomingFulfillment) => {
  const type = incomingFulfillment?.type?.toLowerCase();
  return [ORDER_TYPE.CANCEL, ORDER_TYPE.RETURN].includes(type);
};

const createFulfillmentHistory = (incomingFulfillment, orderId, currentFulfillmentHistoryData) => {
  return new FulfillmentHistory({
    id: incomingFulfillment.id,
    type: incomingFulfillment.type,
    state: incomingFulfillment.state.descriptor.code,
    orderId: orderId,
    itemIds: currentFulfillmentHistoryData,
  });
};

const getItemsIdsDataForFulfillment = (
  incomingFulfillment,
  orderData,
  incomingItemQuoteTrailData
) => {
  try {
    const fulfillmentType = incomingFulfillment?.type?.toLowerCase();
    addFulfillmentType(fulfillmentType, incomingItemQuoteTrailData);

    const quoteTrailIndex = incomingFulfillment.tags?.findIndex(tag => tag.code === "quote_trail");
    const cancelledItemData = extractCancelledItemData(incomingFulfillment, quoteTrailIndex, orderData, incomingItemQuoteTrailData, fulfillmentType);

    lokiLogger.info(`cancelledItemData?.data--------------------, ${JSON.stringify(cancelledItemData?.data)}`);
    return cancelledItemData?.data || {};
  } catch (err) {
    console.error("Error in getItemsIdsDataForFulfillment:", err);
    throw err;
  }
};

const addFulfillmentType = (type, incomingItemQuoteTrailData) => {
  if (!incomingItemQuoteTrailData[type]) {
    incomingItemQuoteTrailData[type] = {
      data: {},
      totalCancelledItems: 0,
      totalCancelledItemsValue: 0,
    };
  } else {
    console.log(`Type "${type}" already exists.`);
  }
};

const extractCancelledItemData = (incomingFulfillment, quoteTrailIndex, orderData, incomingItemQuoteTrailData, fulfillmentType) => {
  const incomingFulfillmentId = incomingFulfillment.id;
  return incomingFulfillment?.tags?.[quoteTrailIndex]?.list.reduce((acc, curr) => {
    switch (curr.code.toLowerCase()) {
      case "id":
        processId(acc, curr, incomingItemQuoteTrailData, fulfillmentType);
        break;
      case "quantity":
        processQuantity(acc, curr, incomingItemQuoteTrailData, fulfillmentType);
        break;
      case "value":
        processValue(acc, curr, orderData, incomingItemQuoteTrailData, fulfillmentType,incomingFulfillmentId);
        break;
    }
    return acc;
  }, { tempId: null, data: {} });
};

const processId = (acc, curr, incomingItemQuoteTrailData, fulfillmentType) => {
  acc.data[curr.value] = { quantity: 0, value: 0 };
  acc.tempId = curr.value;
  incomingItemQuoteTrailData[fulfillmentType].data[acc.tempId] = { quantity: 0, value: 0 };
};

const processQuantity = (acc, curr, incomingItemQuoteTrailData, fulfillmentType) => {
  const { tempId } = acc;
  acc.data[tempId].quantity = curr.value;
  if (incomingItemQuoteTrailData[fulfillmentType].data[tempId]) {
    incomingItemQuoteTrailData[fulfillmentType].data[tempId].quantity = curr.value;
    incomingItemQuoteTrailData[fulfillmentType].totalCancelledItems += curr.value;
  }
};

const processValue = (acc, curr, orderData, incomingItemQuoteTrailData, fulfillmentType,incomingFulfillmentId) => {
  const { tempId } = acc;
  acc.data[tempId].value = Math.abs(curr.value);
  let itemIndex = {};

  if (tempId && acc.data[tempId].quantity === 0) {
    itemIndex = orderData?.items?.find((item) => {
      return item.id === tempId && item.fulfillment_id === incomingFulfillmentId;
    });
    acc.data[tempId].quantity = itemIndex?.quantity?.count || 0 ;
  }

  if (incomingItemQuoteTrailData[fulfillmentType].data[tempId]) {
    incomingItemQuoteTrailData[fulfillmentType].data[tempId].quantity = itemIndex?.quantity?.count;
    incomingItemQuoteTrailData[fulfillmentType].data[tempId].value = Math.abs(curr.value);
    incomingItemQuoteTrailData[fulfillmentType].totalCancelledItems += incomingItemQuoteTrailData[fulfillmentType].data[tempId].quantity;
    incomingItemQuoteTrailData[fulfillmentType].totalCancelledItemsValue += Math.abs(curr.value);
  }
};

/**
 * INFO: Get Fulfilement by id
 * @param {String} orderId 
 * @returns 
 */
const getFulfillmentById = async (fulfilmentId) => {
  return await FulfillmentHistory.findOne({id: fulfilmentId }).lean().exec();
};

/**
 * INFO: Get Fulfilement by order id
 * @param {String} orderId 
 * @returns 
 */
const getFulfillmentByOrderId = async (orderId) => {
  return await FulfillmentHistory.findOne({orderId: orderId }).lean().exec();
};

export { createNewFullfillmentObject, getItemsIdsDataForFulfillment, getFulfillmentById, getFulfillmentByOrderId };
