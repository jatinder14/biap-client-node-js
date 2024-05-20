import OrderMongooseModel from '../../v1/db/order.js';


import { protocolSearchItems } from "../../../utils/protocolApis/index.js"
import logger from '../../../utils/logger.js';
class TopSellingService {
    async getTopOrderList() {
        try {

            // Fetch all orders
            const allOrders = await OrderMongooseModel.find({ is_order_confirmed: true });
            // Flatten items from all orders into a single array
            const allItems = allOrders.flatMap(order => order.items);
            // Filter items whose count is greater then 1
            const filteredItems = allItems.filter(item => item.quantity.count > 1)
            logger.info('filteredItems_top_selling----------',JSON.stringify(filteredItems))
            // Count occurrences of each product and store their details
            const productCounts = {};
         filteredItems.forEach(item => {
                const productId = item.product.id;
                if (!productCounts[productId]) {
                    productCounts[productId] = { product: item.product, quantityCount: 0 };
                }
                productCounts[productId].quantityCount += parseInt(item.quantity.count);
            });

            // Convert object into array
            const productsArray = Object.values(productCounts);

            // Sort products by quantity count in descending order
            const sortedProducts = productsArray.sort((a, b) => b.quantityCount - a.quantityCount);
            const productsIdsrray= sortedProducts.map(({product} ) => ( product.id));


            const response = await protocolSearchItems({});
            const data=await response.data
            logger.info('topSellingData--------',JSON.stringify(data))
            const matchedItemDetails = [];
            productsIdsrray.forEach(productId => {

                const matchingItem = data?.find(item => productId===item.item_details.id );
                if (matchingItem) {
                    matchedItemDetails.push(matchingItem);
                }
            });

            logger.info('matchedItemDetails', JSON.stringify(matchedItemDetails))
            return matchedItemDetails;            // Find the details of top selling products from searchRequest

        } catch (error) {
            throw error;
        }
    }


}

export default TopSellingService;
