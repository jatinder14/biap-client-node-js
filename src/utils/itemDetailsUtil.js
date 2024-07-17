/**
 * get Item count
 * @param {Object} quote 
 * @param {string} itemId 
 */
export function getItemQuantity(quote, itemId) {
    for (let i = 0; i < quote.breakup.length; i++) {
        const item = quote.breakup[i];
        if (item['@ondc/org/item_id'] === itemId) {
            if (item['@ondc/org/item_quantity']) {
                return item['@ondc/org/item_quantity'].count;
            } else {
                return null;
            }
        }
    }
    return null;
}
