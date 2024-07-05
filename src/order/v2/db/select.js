import mongoose from "mongoose";

// Define the schema
const SelectSchema = new mongoose.Schema({
    transactionId: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    items: [{
        item_id: { type: String },
        error_code: { type: String },
        providerId: {type: String },

    }]
});

// Create the model
const Select = mongoose.model('Select', SelectSchema, "select");

export default Select;