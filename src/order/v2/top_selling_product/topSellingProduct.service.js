import OrderMongooseModel from '../../v1/db/order.js';

class TopSellingService {
    async getTopOrderList(user) {
        try {
            // Fetch all orders
            const allOrders = await OrderMongooseModel.find({});
            
            // Flatten items from all orders into a single array
            const allItems = allOrders.flatMap(order => order.items);
            
            // Filter items to include only those in the specified JSON format
            const filteredItems = allItems.filter(item => {
                const product = item.product;
                return (
                    product &&
                    product.id &&
                    product.subtotal &&
                    product.time &&
                    product.time.label &&
                    product.time.timestamp &&
                    product.descriptor &&
                    product.descriptor.name &&
                    product.quantity &&
                    product.quantity.unitized &&
                    product.quantity.unitized.measure &&
                    product.quantity.unitized.measure.unit &&
                    product.quantity.unitized.measure.value &&
                    product.quantity.available &&
                    product.quantity.available.count &&
                    product.quantity.maximum &&
                    product.quantity.maximum.count &&
                    product.price &&
                    product.price.currency &&
                    product.price.value &&
                    product.price.maximum_value &&
                    product.tags &&
                    product.tags.length > 0 &&
                    product.fulfillments &&
                    product.fulfillments.length > 0
                );
            });
            
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
            
            // Return sorted products with quantity count
            return sortedProducts.map(({product} ) => ( {product} ));
        } catch (error) {
            throw error;
        }
    }
    
    
}

export default TopSellingService;
