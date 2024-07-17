/**
 * get Item count
 * @param {Object} quote 
 * @param {string} itemId 
 */
export function getItemQuantity(quote, itemId) {
    let qty = 0
    for (let item of quote.breakup) {
        if (item['@ondc/org/item_id'] === itemId) {
            if (item['@ondc/org/item_quantity']) {
                qty = item['@ondc/org/item_quantity']?.count ? Number(item['@ondc/org/item_quantity'].count) : 0;
                break;
            }
        }
    }
    return qty;
}
