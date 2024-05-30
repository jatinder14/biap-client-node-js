import FulfillmentHistory from "../../v2/db/fulfillmentHistory.js";
import { ORDER_TYPE } from "../../../utils/constants.js";
import lokiLogger from "../../../utils/logger.js";

const createNewFullfilmentObject = (
  incomingFulfillment,
  fullfillmentHistoryData,
  orderData,
  orderId
) => {
  let newfullfilment = undefined;

  const fullfilmentExist = fullfillmentHistoryData.filter((fullfillment) => {
    return incomingFulfillment.id == fullfillment.id &&
      incomingFulfillment?.state?.descriptor?.code ==
      fullfillment.state &&
      incomingFulfillment.type == fullfillment.type
  });
  lokiLogger.info(`fullfilmentExist---------, ${JSON.stringify(fullfilmentExist)}`)
  if (fullfilmentExist.length === 0 && [ORDER_TYPE.CANCEL, ORDER_TYPE.RETURN].includes(incomingFulfillment?.type?.toLowerCase())) {
    const itemsIdData = getItemsIdsDataForFulfillment(incomingFulfillment, orderData);
    lokiLogger.info(`itemsIdData---------, ${JSON.stringify(itemsIdData)}`)
    newfullfilment = new FulfillmentHistory({
      id: incomingFulfillment.id,
      type: incomingFulfillment.type,
      state: incomingFulfillment.state.descriptor.code,
      orderId: orderId,
      itemIds: itemsIdData,
    });
  }
  lokiLogger.info(`newfullfilment--------------------, ${JSON.stringify(newfullfilment)}`)
  return newfullfilment;
};

const getItemsIdsDataForFulfillment = (incomingFulfillment, orderData) => {
  const quoteTrailIndex = incomingFulfillment.tags?.findIndex(
    (tag) => tag.code === "quote_trail"
  );

  let cancelledItemData = incomingFulfillment?.tags?.[
    quoteTrailIndex
  ]?.list.reduce(
    (acc, curr) => {
      switch (curr.code.toLowerCase()) {
        case "id":
          acc.data[curr.value] = { quantity: 0, value: 0 };
          if (acc.tempId && acc.data?.[acc?.tempId]?.quantity === 0) {
            const itemIndex = orderData?.items?.findIndex((item) => {
              item.id === acc?.tempId
            });
            acc.data[acc.tempId].quantity = orderData?.items[itemIndex]?.quantity?.count;
          }
          acc.tempId = curr.value;
          break;
        case "quantity":
          acc.data[acc.tempId].quantity = curr.value;
          break;
        case "price":
          acc.data[acc.tempId].value = curr.value;
          break;
      }
      return acc;
    },
    { tempId: null, data: {} }
  );
  return cancelledItemData?.data || {};
}

export { createNewFullfilmentObject, getItemsIdsDataForFulfillment }