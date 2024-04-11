import Cart from "../../db/cart.js";
import CartItem from "../../db/items.js";

class CartService {
  async addItem(data) {
    // return data
    try {
      let cart;
      if (data.cart_key && (!data.userId || data.userId == "undefined" || data.userId == "guestUser")) {
        cart = await Cart.findOne({ cart_key: data.cart_key });
      } else if (data.userId && (data.userId != "undefined" || data.userId != "guestUser")) {
        cart = await Cart.findOne({ userId: data.userId });
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
      let cart = {}
      if (data.cart_key && (!data.userId || data.userId == "undefined" || data.userId == "guestUser")) {
        cart = await Cart.findOne({ cart_key: data.cart_key });
      } else if (data.userId && (data.userId != "undefined" || data.userId != "guestUser")) {
        cart = await Cart.findOne({ userId: data.userId });
      }
      await CartItem.deleteMany({ cart: cart?._id });
      return await Cart.deleteOne({ _id: cart?._id }); 
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
      if (data.cart_key && (!data.userId || data.userId == "undefined" || data.userId == "guestUser")) {
        cart = await Cart.findOne({ cart_key: data.cart_key });
      } else if (data.userId && (data.userId != "undefined" || data.userId != "guestUser")) {
        cart = await Cart.findOne({ userId: data.userId });
      }
      if (data.cart_key) {
        cart2 = await Cart.findOne({ cart_key: data.cart_key });
      }

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

      return newCart;
    } catch (err) {
      throw err;
    }
  }
}

export default CartService;
