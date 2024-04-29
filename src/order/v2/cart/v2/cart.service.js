import Cart from "../../db/cart.js";
import CartItem from "../../db/items.js";

class CartService {
  async addItem(data) {
    // return data
    try {
      let cart;
      if (data.cart_key && (!data.userId || data.userId != "null" || data.userId == "undefined" || data.userId == "guestUser")) {
        cart = await Cart.findOne({ cart_key: data.cart_key });
      } else if (data.userId && (data.userId != "null" || data.userId != "undefined" || data.userId != "guestUser")) {
        cart = await Cart.findOne({ userId: data.userId });
      }
      if (cart) {
        let existingItem = await CartItem.findOneAndUpdate(
          {"item.id": data.id, "cart": cart._id},
          { $inc: { "item.quantity.count": 1 } }, // Increment the quantity by 1
          { new: true });
    
        if (existingItem) {
            return { status: "success", data: existingItem };
        } 
    
        let cartItem = new CartItem();
        cartItem.cart = cart?._id;
        cartItem.item = data;
        return await cartItem.save();
      } else {
        //create a new cart
        let cart = {};
        if (data.cart_key && data.cart_key != "undefined") {
          cart = { ...cart, cart_key: data.cart_key }
        }
        if (data.userId && (data.userId != "null" || data.userId != "undefined" || data.userId != "guestUser")) {
          cart = { ...cart, userId: data.userId }
        }
        let saved_cart = await new Cart({ ...cart }).save();
        let cartItem = new CartItem();
        cartItem.cart = saved_cart._id;
        cartItem.item = data;
        return await cartItem.save();
        
      }
    } catch (err) {
      throw err;
    }
  }

  async updateItem(data) {
    try {
      let cartItem = await CartItem.findOne({ _id: data.itemId });
      cartItem.item = data;
      return await cartItem.save();
    } catch (err) {
      throw err;
    }
  }

  async removeItem(data) {
    try {
      return await CartItem.deleteOne({ _id: data.itemId });
    } catch (err) {
      throw err;
    }
  }

  async clearCart(data) {
    try {
      let cart, cart2;
 
      if (data.cart_key) {
        cart2 = await Cart.findOne({ cart_key: data.cart_key });
      } 
      if (data.userId && (data.userId != "null" || data.userId != "undefined" || data.userId != "guestUser")) {
        cart = await Cart.findOne({ userId: data.userId });
      }
      let cartIds = []
      if (cart?._id) cartIds.push(cart?._id)
      if (cart2?._id) cartIds.push(cart2?._id)
      await CartItem.deleteMany({ cart: { $in: cartIds } });
      return await Cart.deleteOne({ _id: { $in: cartIds } }); 
    } catch (err) {
      throw err;
    }
  }

  // async getCartItem(data) {
  //     try {

  //         const cart = await Cart.findOne({userId:data.userId})
  //         if(cart){
  //             return  await CartItem.find({cart:cart._id});
  //         }else{
  //             return  []
  //         }

  //     }
  //     catch (err) {
  //         throw err;
  //     }
  // }
  async getCartItem(data) {
    try {
      let cart, cart2;
 
      if (data.cart_key) {
        cart2 = await Cart.findOne({ cart_key: data.cart_key });
      } 
      if (data.userId && (data.userId != "null" || data.userId != "undefined" || data.userId != "guestUser")) {
        cart = await Cart.findOne({ userId: data.userId });
      }
      console.log("data.cart_key, cart2 -------------", data.cart_key, cart2);
      console.log("data.userId, cart -------------", data.userId, cart);
      let cartIds = []
      if (cart?._id) cartIds.push(cart?._id)
      if (cart2?._id) cartIds.push(cart2?._id)
      let cartData = await CartItem.find({ cart: { $in: cartIds } });
      console.log("cartData -------------", cartData?.length);

      return cartData;
    } catch (err) {
      throw err;
    }
  }
}

export default CartService;
