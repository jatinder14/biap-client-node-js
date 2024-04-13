import OrderMongooseModel from '../../v1/db/order.js';

class TopSellingService {
    async getTopOrderList(user) {
        try {
            // Fetch all orders
            const allOrders = await OrderMongooseModel.find({});
            
            // Flatten items from all orders into a single array
            const allItems = allOrders.flatMap(order => order.items);
            
            // Count occurrences of each product and store their details
            const productCounts = {};
            allItems.forEach(item => {
                const productId = item.product.id;
                if (!productCounts[productId]) {
                    productCounts[productId] = item.product;
                    productCounts[productId].count = 0;
                }
                productCounts[productId].count++;
            });
            
            // Convert object into array
            const productsArray = Object.values(productCounts);
            
            // Sort products by occurrence count in descending order
            const sortedProducts = productsArray.sort((a, b) => b.count - a.count);
            
            // Return sorted products
            return sortedProducts;
        } catch (error) {
            throw error;
        }
    }
}

export default TopSellingService;
