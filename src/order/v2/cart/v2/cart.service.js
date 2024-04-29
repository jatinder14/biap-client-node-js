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
        if (data.cart_key && (!data.userId || data.userId == "undefined" || data.userId == "guestUser")) {
          cart = await new Cart({
            cart_key: data.cart_key,
          }).save();
        } else if (data.userId && (data.userId != "undefined" || data.userId != "guestUser")) {
          cart = await new Cart({ 
            userId: data.userId, cart_key: data.cart_key,
          }).save();
        }
        let existingItem = await CartItem.findOneAndUpdate(
          {"item.id": data.id, "cart": cart._id},
          { $inc: { "item.quantity.count": 1 } }, // Increment the quantity by 1
          { new: true });
      
        if (existingItem) {
            return { status: "success", data: existingItem };
        } else {
          let cartItem = new CartItem();
          cartItem.cart = cart._id;
          cartItem.item = data;
          return await cartItem.save();
        }
        
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
      let cart1Item = [];
      let newCart = [];
      if (cart) {
        cart1Item = await CartItem.find({ cart: cart._id });
        newCart = [...cart1Item];
      }

      if (cart2) {
        let cart2Item = await CartItem.find({ cart: cart2._id });
        newCart = [...newCart, ...cart2Item];
      }
      console.log("newCart -------------", newCart?.length);

      return newCart;
    } catch (err) {
      throw err;
    }
  }
}

export default CartService;
