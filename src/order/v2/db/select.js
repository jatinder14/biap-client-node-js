import mongoose from "mongoose";

// Define the schema
const SelectSchema = new mongoose.Schema({
    transaction_id: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    items: [{
        cart_id: { type: String },
        error_code: { type: String },
        provider_id: {type: String },

    }]
});

// Create the model
const Select = mongoose.model('Select', SelectSchema, "select");

export default Select;