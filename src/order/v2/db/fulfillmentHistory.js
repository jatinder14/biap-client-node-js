import mongoose from "mongoose";

const  FulfillmentsHistory = new mongoose.Schema(
    {
        orderId:{ type: String },
        type:{ type: String },
        state:{ type: Object },
        id:{ type: String },
        updatedAt:{ type: Date },
        itemIds: {
            type: Map,
            of: new mongoose.Schema({
              quantity: { type: Number, required: true },
              value: { type: Number, required: true },
            }),
          },
    },
    { _id: true, timestamps: true }
);

//OrderSchema.index({userId: 1, createdAt: -1});

const FulfillmentHistory  = mongoose.model('fulfillmentHistory', FulfillmentsHistory, "fulfillmentHistory");

export default FulfillmentHistory;