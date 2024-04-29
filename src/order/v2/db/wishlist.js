// wishlist.js
import mongoose from "mongoose";

const WishListSchema = new mongoose.Schema(
  {
    userId: { type: String },
    wishlist_key: { type: String },
  },
  { timestamps: true }
);

const WishList = mongoose.model('user_wishlist', WishListSchema);

export default WishList;
