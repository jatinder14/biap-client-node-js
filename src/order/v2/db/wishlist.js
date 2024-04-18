import mongoose from "mongoose";

const  WishListSchema = new mongoose.Schema(
    {
        userId: { type: String },
        wishlist_key: { type: String } 
        
    },
    { _id: true, timestamps: true }
);

//OrderSchema.index({userId: 1, createdAt: -1});

const WishList  = mongoose.model('wishlist', WishListSchema, "cart");

export default WishList;