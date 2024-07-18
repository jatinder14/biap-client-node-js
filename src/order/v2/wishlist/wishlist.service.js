
import WishList from '../db/wishlist.js';
import WishlistItem from "../db/wishlistItem.js"
import { protocolGetItemList } from '../../../utils/protocolApis/index.js';
import { transformProductDetails } from "../../../utils/mapData/transformProductDetails.js"

class WishListService {
  async addItem(data) {
    try {
      let wishlist, wishlist_ids = [], device_wishlist, login_wishlist;
      if (data.deviceId && data.deviceId != "undefined") {
        wishlist = await WishList.findOne({ device_id: data.deviceId });
        if (wishlist?._id) {
          wishlist_ids.push(wishlist?._id)
          device_wishlist = wishlist?._id
        }

      }
      if (data.userId && (data.userId != "null" && data.userId != "undefined" && data.userId != "guestUser")) {
        wishlist = await WishList.findOne({ userId: data.userId });
        if (wishlist?._id) {
          wishlist_ids.push(wishlist?._id)
          login_wishlist = wishlist?._id
        }
      }

      if (wishlist_ids.length) {
        const existingItem = await WishlistItem.findOne({ item_id: data.local_id, "wishlist": (device_wishlist ? device_wishlist : login_wishlist) });
        if (existingItem) {
          return { status: "error", message: "Item already exists in wishlist" };
        } else {
          let wishlistItem = new WishlistItem();
          wishlistItem.wishlist = device_wishlist ? device_wishlist : login_wishlist;
          wishlistItem.item_id = data.local_id;
          wishlistItem.provider_id = data.provider.id;
          wishlistItem.count = data.quantity.count;
          wishlistItem.added = true
          const saveData = await wishlistItem.save();
          return saveData
        }

      } else {
        let wishlist = {};
        if (data.deviceId && (!data.userId || data.userId == "undefined" || data.userId == "guestUser")) {
          wishlist = {
            ...wishlist,
            device_id: data.deviceId,
          }

        }
        if (data.userId && (data.userId != "null" && data.userId != "undefined" && data.userId != "guestUser")) {
          wishlist = {
            ...wishlist,
            userId: data.userId,
          }
        }

        const saved_wishlist = await new WishList(wishlist).save();

        let wishlistItem = new WishlistItem();
        wishlistItem.wishlist = saved_wishlist._id;
        wishlistItem.item_id = data.local_id;
        wishlistItem.provider_id = data.provider.id;
        wishlistItem.count = data.quantity.count;
        wishlistItem.added = true

        let wishlistdata = await wishlistItem.save();
        return wishlistdata

      }
    } catch (err) {
      throw err;
    }
  }

  async getWishlistItem(data) {
    try {
      let wishlist, wishlist2;
      if (data.deviceId) {
        wishlist = await WishList.findOne({ device_id: data.deviceId });
      }
      if (data.userId && (data.userId != "null" && data.userId != "undefined" && data.userId != "guestUser")) {
        wishlist2 = await WishList.findOne({ userId: data.userId });
      }
      let wishlistIds = []
      if (wishlist?._id) wishlistIds.push(wishlist?._id)
      if (wishlist2?._id) wishlistIds.push(wishlist2?._id)
      let wishlistData = await WishlistItem.find({ wishlist: { $in: wishlistIds } });
      let providerIds = wishlistData.map(item => item?.provider_id || '').join(',');
      let itemIds = wishlistData.map(item => item?.item_id || '').join(',');

      let result = await protocolGetItemList({ "itemIds":itemIds, providerIds });
      let productsDetailsArray = result.data;

      wishlistData = wishlistData.map(item => {
        const product = transformProductDetails(item, productsDetailsArray)
        if (product) {
          return {
            ...product._doc,
            item: product.item
          }
        } else {
          return product
        }
      }).filter(el => el != null);
      return wishlistData;
    } catch (err) {
      throw err;
    }
  }

  async wishlistCart(req, res, next) {
    try {
      return res.send(await cartService.clearCart({ ...req.params }));
    }
    catch (err) {
      next(err);
    }
  }

  async clearWishlist(data) {
    try {
      let wishlist = {}, wishlist2 = {};
      if (data.deviceId) {
        wishlist = await WishList.findOne({ device_id: data.deviceId });
      }
      if (data.userId && (data.userId != "null" && data.userId != "undefined" && data.userId != "guestUser")) {
        wishlist2 = await WishList.findOne({ userId: data.userId });
      }
      let wishlistIds = []
      if (wishlist?._id) wishlistIds.push(wishlist?._id)
      if (wishlist2?._id) wishlistIds.push(wishlist2?._id)
      await WishlistItem.deleteMany({ wishlist: { $in: wishlistIds } });
      return await WishList.deleteOne({ _id: { $in: wishlistIds } });
    } catch (err) {
      throw err;
    }
  }

  async removeWishlistItem(data) {
    try {
      let wishlist, wishlist2;
      if (data.deviceId) {
        wishlist = await WishList.findOne({ device_id: data.deviceId });
      }
      if (data.userId && (data.userId != "null" && data.userId != "undefined" && data.userId != "guestUser")) {
        wishlist2 = await WishList.findOne({ userId: data.userId });
      }
      let wishlistIds = []
      if (wishlist?._id) wishlistIds.push(wishlist?._id)
      if (wishlist2?._id) wishlistIds.push(wishlist2?._id)

      return await WishlistItem.deleteOne({ wishlist: { $in: wishlistIds }, item_id: data.itemId });
    } catch (err) {
      throw err;
    }
  }

  async removeWishlistItemById(wishlistId) {
    try {
      return await WishlistItem.deleteOne({ _id: wishlistId });
    } catch (err) {
      throw err;
    }
  }

  async updateWishlistItem(data) {
    try {
      let wishlistItem = await WishlistItem.findOne({ item_id: data.itemId });
      wishlistItem.item = data;
      return await wishlistItem.save();
    } catch (err) {
      throw err;
    }
  }

}


export default WishListService;
