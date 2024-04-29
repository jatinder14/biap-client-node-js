
import WishList from '../db/wishlist.js';
import WishlistItem from "../db/wishlistItem.js"

class WishListService {
  async addItem(data) {
    try {
      let wishlist, wishlist_ids = [], device_wishlist, login_wishlist;
      if (data.wishlist_key && data.wishlist_key != "undefined") {
        wishlist = await WishList.findOne({ wishlist_key: data.wishlist_key });
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
        console.log("wishlist_ids ----------------------", wishlist_ids);
        // Wishlist exists for the user, add item to the wishlist
        const existingItem = await WishlistItem.findOne({ "item.id": data.id, "wishlist": (device_wishlist ? device_wishlist : login_wishlist) });
        if (existingItem) {
          return { status: "error", message: "Item already exists in wishlist" };
        } else {
          let wishlistItem = new WishlistItem();
          wishlistItem.wishlist = device_wishlist ? device_wishlist : login_wishlist;
          wishlistItem.item = data;
          wishlistItem.added = true
          const saveData = await wishlistItem.save();
          return saveData
        }

      } else {
        // Create a new wishlist for the user
        let wishlist = {};
        if (data.wishlist_key && (!data.userId || data.userId == "undefined" || data.userId == "guestUser")) {
          wishlist = { ...wishlist,
            wishlist_key: data.wishlist_key,
          }

        }
        if (data.userId && (data.userId != "null" && data.userId != "undefined" && data.userId != "guestUser")) {
          wishlist = { ...wishlist,
            userId: data.userId,
          }

        }

        const saved_wishlist = await new WishList({
          wishlist_key: data.wishlist_key,
        }).save();
        
        let wishlistItem = new WishlistItem();
        wishlistItem.wishlist = saved_wishlist._id;
        wishlistItem.item = data;
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
      console.log("data.wishlist_key -------", data.wishlist_key);
      console.log("data.userId -------", data.userId);
      if (data.wishlist_key) {
        wishlist = await WishList.findOne({ wishlist_key: data.wishlist_key });
      } 
      if (data.userId && (data.userId != "null" && data.userId != "undefined" && data.userId != "guestUser")) {
        wishlist2 = await WishList.findOne({ userId: data.userId });
      }
      let wishlistIds = []
      if (wishlist?._id) wishlistIds.push(wishlist?._id)
      if (wishlist2?._id) wishlistIds.push(wishlist2?._id)
      console.log("data.wishlist2 -------", wishlistIds);
      let wishlistData = await WishlistItem.find({ wishlist: { $in: wishlistIds } });
      console.log("data.wishlistData -------", wishlistData?.length);

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
      if (data.wishlist_key) {
        wishlist = await WishList.findOne({ wishlist_key: data.wishlist_key });
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
      return await WishlistItem.deleteOne({ _id: data.itemId });
    } catch (err) {
      throw err;
    }
  }

  async updateWishlistItem(data) {
    try {
      let wishlistItem = await WishlistItem.findOne({ _id: data.itemId });
      wishlistItem.item = data;
      return await wishlistItem.save();
    } catch (err) {
      throw err;
    }
  }

}


export default WishListService;
