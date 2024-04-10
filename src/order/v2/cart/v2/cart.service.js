import Cart from "../../db/cart.js";
import CartItem from "../../db/items.js";

class CartService {
  async addItem(data) {
    try {
      let cart = {};
      if (data.userId == "undefined") {
        cart = await Cart.findOne({
          ipAddress: data.ipAddress,
          cart_key: data.cart_key,
        });
      } else {
        cart = await Cart.findOne({ userId: data.userId });
      }
      if (cart) {
        //add items to the cart

        let cartItem = new CartItem();
        cartItem.cart = cart._id;
        cartItem.item = data;
        return await cartItem.save();
      } else {
        //create a new cart
        let cart = {};
        if (data.userId == "undefined")
          cart = await new Cart({
            ipAddress: data.ipAddress,
            cart_key: data.cart_key,
          }).save();
        else {
          cart = await new Cart({ userId: data.userId }).save();
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
      const cart = await Cart.findOne({ userId: data.userId });
      return await CartItem.deleteMany({ cart: cart?._id });
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
      let cart = {};
      let cart2 = false;
      if (data.userId == "undefined")
        cart = await Cart.findOne({ ipAddress: data.ipAddress,cart_key: data.cart_key });
      else {
        cart = await Cart.findOne({ userId: data.userId });
        cart2 = await Cart.findOne({ ipAddress: data.ipAddress, cart_key: data.cart_key });
        
      }

      let cart1Item = [];
      let newCart = [];
      if (cart) {
        cart1Item = await CartItem.find({ cart: cart._id });
        newCart = [...cart1Item];
      }

      if (cart2) {
        let cart2Item = await CartItem.find({ cart: cart2._id });
        newCart = [...cart1Item, ...cart2Item];
      }

      return newCart;
    } catch (err) {
      throw err;
    }
  }
}

export default CartService;
