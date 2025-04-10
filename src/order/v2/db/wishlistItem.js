import mongoose from "mongoose";
import WishList from "./wishlist.js";
const WishListItemSchema = new mongoose.Schema(
    {
        item_id: { type: String },
        id: { type: String },
        provider_id: { type: String },
        count: { type: Number },
        wishlist: { type: String, ref: 'user_wishlist' },
        added: { type: Boolean, default: false } // Added field to indicate if the item was added

    },
    { _id: true, timestamps: true }
);

//OrderSchema.index({userId: 1, createdAt: -1});

const WishlistItem = mongoose.model('wishlistitem', WishListItemSchema, "wishlistitem");

export default WishlistItem;