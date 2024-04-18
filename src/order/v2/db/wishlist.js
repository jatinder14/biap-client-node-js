// wishlist.js
import mongoose from "mongoose";

const WishListSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WishlistItem' }]
  },
  { timestamps: true }
);

const WishList = mongoose.model('WishList', WishListSchema);

export default WishList;
