
import WishList from '../db/wishlist.js';
import WishlistItem from "../db/wishlistItem.js"

class WishListService {
  async addItem(data) {
    try {
      let wishlist;
      if (data.wishlist_key && (!data.userId == "undefined" && data.userId == "guestUser")) {
        wishlist = await WishList.findOne({ wishlist_key: data.wishlist_key });
      } else if (data.userId && (data.userId != "undefined" || data.userId != "guestUser")) {
        wishlist = await WishList.findOne({ userId: data.userId });
      }

      if (wishlist) {
        // Wishlist exists for the user, add item to the wishlist
        const existingItem = await WishlistItem.findOne({ "item.id": data.id, "wishlist": wishlist._id });
        if (existingItem) {
          return { status: "error", message: "Item already exists in wishlist" };
        } else {
          let wishlistItem = new WishlistItem();
          wishlistItem.wishlist = wishlist._id;
          wishlistItem.item = data;
          wishlistItem.added = true
          const saveData = await wishlistItem.save();
          return saveData
        }

      } else {
        // Create a new wishlist for the user
        let wishlist = {};
        if (data.wishlist_key && (!data.userId || data.userId == "undefined" || data.userId == "guestUser")) {
          wishlist = await new WishList({
            wishlist_key: data.wishlist_key,
          }).save();

        }
        else if (data.userId && (data.userId != "undefined" || data.userId != "guestUser")) {
          wishlist = await new WishList({ userId: data.userId, wishlist_key: data.wishlist_key, }).save();

        }
        // const existingItem = await WishlistItem.findOne({"item.id": data.id,"wishlist": wishlist._id});
        if (existingItem) {
          const itemId = existingItem.item.id;

          console.log("Item ID:", itemId);
          return { status: "error", message: "Item already exists in wishlist" };
        } else {
          let wishlistItem = new WishlistItem();
          wishlistItem.wishlist = wishlist._id;
          wishlistItem.item = data;
          wishlistItem.added = true

          let wishlistdata = await wishlistItem.save();
          return wishlistdata

        }

      }
    } catch (err) {
      throw err;
    }
  }

  async getWishlistItem(data) {
    try {
      let wishlist, wishlist2;
      if (data.wishlist_key) {
        wishlist = await WishList.findOne({ wishlist_key: data.wishlist_key });
      } 
      if (data.userId && (data.userId != "null" || data.userId != "undefined" || data.userId != "guestUser")) {
        wishlist2 = await WishList.findOne({ userId: data.userId });
      }

      let wishlist1Item = [];
      let newWishlist = [];
      if (wishlist) {
        wishlist1Item = await WishlistItem.find({ wishlist: wishlist._id });
        newWishlist = [...wishlist1Item];
      }

      if (wishlist2) {
        let wishlist2Item = await WishlistItem.find({ wishlist: wishlist2._id });
        newWishlist = [...newWishlist, ...wishlist2Item];
      }

      return newWishlist;
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
      if (data.userId && (data.userId != "null" || data.userId != "undefined" || data.userId != "guestUser")) {
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
