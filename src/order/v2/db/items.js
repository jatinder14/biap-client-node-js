import mongoose from "mongoose";
import Cart from "./cart.js";

const  CartItemSchema = new mongoose.Schema(
    {
        item_id: { type: String },
        provider_id:{type:String},
        count:{type:Number},
        cart:{type:String, ref:'Cart'}
    },
    { _id: true, timestamps: true }
);

//OrderSchema.index({userId: 1, createdAt: -1});

const CartItem  = mongoose.model('cartItem', CartItemSchema, "cartItem");

export default CartItem;