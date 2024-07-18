import Cart from "../../db/cart.js";
import CartItem from "../../db/items.js";
import User from '../../../../accounts/users/db/user.js';
import { encryptString } from "../../../../utils/cryptic.js";
import mongoose from 'mongoose';
import { protocolGetItemList } from '../../../../utils/protocolApis/index.js';
import { transformProductDetails } from "../../../../utils/mapData/transformProductDetails.js"

class CartService {
  async addItem(data) {
    // return data
    try {
      let cart;
      if (data.deviceId && data.userId && data.deviceId != "undefined" && data.userId != "null" && data.userId != "undefined" && data.userId != "guestUser") {
        await User.findOneAndUpdate(
          { userId: data.userId },
          { $set: { device_id: data.deviceId } },
          { new: true, upsert: true });
        cart = await Cart.findOne({ device_id: data.deviceId, userId: data.userId });
      }
      if (!cart && data.deviceId && data.deviceId != "undefined") {
        cart = await Cart.findOne({ device_id: data.deviceId });
      }
      if (!cart && data.userId && (data.userId != "null" && data.userId != "undefined" && data.userId != "guestUser")) {
        cart = await Cart.findOne({ userId: data.userId });
      }

      if (cart) {
        let existingItem = await CartItem.findOne(
          { item_id: data.local_id, "cart": cart._id }).lean()
        if (existingItem) {
          const updateData = await CartItem.findOneAndUpdate(
            { item_id: data.local_id, "cart": cart._id },
            { $inc: { count: 1 } },
            { new: true });
            console.log("updateData ----------------------- ", updateData);
          return { status: "success", data: existingItem };
        }

        let cartItem = new CartItem();
        cartItem.cart = cart?._id;
        cartItem.item_id = data.local_id;
        cartItem.provider_id = data.provider.id;
        cartItem.count = data.quantity.count;
        cartItem.customisationState = data?.customisationState;
        cartItem.customisations = data?.customisations;
        cartItem.hasCustomisations = data?.hasCustomisations;
        console.log('data.quantity.count46', data.quantity.count)

        return await cartItem.save();
      } else {
        //create a new cart
        cart = {};
        if (data.deviceId && data.deviceId != "undefined") {
          cart = { ...cart, device_id: data.deviceId }
        }
        if (data.userId && (data.userId != "null" && data.userId != "undefined" && data.userId != "guestUser")) {
          cart = { ...cart, userId: data.userId }
        }
        let saved_cart = await new Cart({ ...cart }).save();
        let cartItem = new CartItem();
        cartItem.cart = saved_cart._id;
        cartItem.item_id = data.local_id;
        cartItem.provider_id = data.provider.id;
        cartItem.count = data.quantity.count;
        cartItem.customisationState = data?.customisationState;
        cartItem.customisations = data?.customisations;
        cartItem.hasCustomisations = data?.hasCustomisations;
        console.log('cartItem60', cartItem)
        return await cartItem.save();

      }
    } catch (err) {
      throw err;
    }
  }

  async updateItem(data) {
    try {
      let cartItem = await CartItem.findOne({ _id: data.itemId });
      if (data?._id) delete data?._id
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
      let cart, cart2, cart3;

      if (data.deviceId && data.deviceId != "undefined") {
        cart2 = await Cart.findOne({ device_id: data.deviceId });
      }
      if (data.userId && (data.userId != "null" && data.userId != "undefined" && data.userId != "guestUser")) {
        cart = await Cart.findOne({ userId: data.userId });
        const userDetails = await User.findOne({ userId: data.userId });
        if (userDetails?.device_id) {
          cart3 = await Cart.findOne({ device_id: userDetails.deviceId });
        }
      }
      let cartIds = []
      if (cart?._id) cartIds.push(cart?._id)
      if (cart2?._id) cartIds.push(cart2?._id)
      if (cart3?._id) cartIds.push(cart3?._id)
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

      if (data.deviceId && data.deviceId != "undefined") {
        cart2 = await Cart.findOne({ device_id: data.deviceId });
      }
      if (data.userId && (data.userId != "null" && data.userId != "undefined" && data.userId != "guestUser")) {
        cart = await Cart.findOne({ userId: data.userId });
      }
      let cartIds = []
      if (cart?._id) cartIds.push(cart?._id)
      if (cart2?._id) cartIds.push(cart2?._id)
      let cartData = await CartItem.find({ cart: { $in: cartIds } }).lean().exec();
      if (!cartData.length) {
        return [];
      }
      let providerIds = cartData.map(item => item?.provider_id || '').join(',');
      let itemIds = cartData.map(item => item?.item_id || '').join(',');
      let result = await protocolGetItemList({ "itemIds": itemIds, providerIds });
      let productsDetailsArray = result.data;
      cartData = cartData.map(item => {
        const product = transformProductDetails(item, productsDetailsArray)
        return product
      }).filter(el => el != null);

      return cartData;
    } catch (err) {
      throw err;
    }
  }
}

export default CartService;
