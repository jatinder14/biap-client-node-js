 
    import WishList from '../db/wishlist.js';
    import WishlistItem from "../db/wishlistItem.js"

    class WishListService {
      async addItem(data) {
        try {
          let wishlist;
          if (data.userId && (data.userId !== "undefined" && data.userId !== "guestUser")) {
            wishlist = await WishList.findOne({ wishlist_key: data.userId });
          }else if (data.userId && (data.userId != "undefined" || data.userId != "guestUser")) {
            cart = await Cart.findOne({ userId: data.userId });
          }
      
          if (wishlist) {
            // Wishlist exists for the user, add item to the wishlist
            let wishlistItem = new WishlistItem();
            wishlistItem.wishlist = wishlist._id;
            wishlistItem.item = data.item; // Assuming 'item' contains the details of the item to be added
            return await wishlistItem.save();
          } else {
            // Create a new wishlist for the user
            let newWishlist = await new WishList({ userId: data.userId }).save();
            
            // Add item to the newly created wishlist
            let wishlistItem = new WishlistItem();
            wishlistItem.wishlist = newWishlist._id;
            wishlistItem.item = data.item;
            return await wishlistItem.save();
          }
        } catch (err) {
          throw err;
        }
      }
      
    }


    export default WishListService;
