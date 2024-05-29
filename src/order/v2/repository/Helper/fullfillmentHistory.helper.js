import FulfillmentHistory from "../../db/fulfillmentHistory";

export const fullfilment = (fullfillmentHistoryData,incomingFulfillment,state,type) => {
    let newfullfilment =undefined

const fullfilmentExist = fullfillmentHistoryData.filter((fullfillment) => {
    incomingFulfillment.id == fullfillment.id && incomingFulfillment?.state?.descriptor?.code?.toLowerCase() == fullfillment.state
  })
  if (!fullfilmentExist && incomingFulfillment?.state?.descriptor?.code?.toLowerCase() == state && incomingFulfillment?.type?.toLowerCase() == type) {

    const quoteTrailIndex = incomingFulfillment.tags.findIndex(
      (tag) => tag.code === 'quote_trail'
    );

    let cancelledItemData = incomingFulfillment.tags?.[quoteTrailIndex]?.list.reduce((acc, curr) => {
      switch (curr.code.toLowerCase()) {
        case "id":
          acc.data[curr.value] = { "quantity": 0, "value": 0 };
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
    }, { tempId: null, data: {} })

     newfullfilment = new FulfillmentHistory({
      id: dbResponse.id,
      type: fulfillment.type,
      state: fulfillment.state.descriptor.code,
      orderId: fulfillment.id,
      itemIds: cancelledItemData.data
    })
    
   
  }
  
  return newfullfilment
}