 
    import WishList from '../db/wishlist.js';

    class WishListService {
        async addItem(req, res, next) {
            console.log("8>>>>>>>>>>>>")

            try {
                let cart;
                if (data.cart_key && (!data.userId || data.userId == "undefined" || data.userId == "guestUser")) {
                  cart = await WishList.findOne({ cart_key: data.cart_key });
                } else if (data.userId && (data.userId != "undefined" || data.userId != "guestUser")) {
                  cart = await WishList.findOne({ userId: data.userId });
                }
                if (cart) {
                //Can be implement further
                //    // Check if the cart belongs to a guest user and is now being accessed by a logged-in user
                //   if (cart.userId !== data.userId && data.userId !== "guestUser") {
                //     // Delete cart items for guest users
                //     await CartItem.deleteMany({ cart: cart._id });
                // }
          
                  let cartItem = new CartItem();
                  cartItem.cart = cart?._id;
                  cartItem.item = data;
                  return await cartItem.save();
                } else {
                  //create a new cart
                  let cart = {};
                  if (data.cart_key && (!data.userId || data.userId == "undefined" || data.userId == "guestUser")) {
                    cart = await new Cart({
                      cart_key: data.cart_key,
                    }).save();
                  } else if (data.userId && (data.userId != "undefined" || data.userId != "guestUser")) {
                    cart = await new Cart({ userId: data.userId, cart_key: data.cart_key,}).save();
                  }
                  let cartItem = new CartItem();
                  cartItem.cart = cart._id;
                  cartItem.item = data;
                  return await cartItem.save();
                }
              } catch (err) {
                throw err;
              }
        }
    }


    export default WishListService;
