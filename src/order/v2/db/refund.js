import mongoose from "mongoose";

const RefundSchema = mongoose.Schema({
        refundId:{type: String},
        orderId: { type: String, ref: 'Order' },
        refundedAmount:{ type: String },
        itemId:{ type: String }, 
        itemQty:{ type: String },
        isRefunded:{ type: String, default: false},
        transationId:{ type: String },
        razorpayPaymentId:{ type: String }
},
)

RefundSchema.index({ createdAt: -1 });

const Refund = mongoose.model('refund', RefundSchema, "refund");

export default Refund;
