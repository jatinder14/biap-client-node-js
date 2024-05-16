import mongoose from "mongoose";

const ConfigurationSchema = new mongoose.Schema(
    {
        name: { type: String, default: null },
        logo: { type: String, default: null },
        color: { type: String, default: null },
        image: { type: String, default: null },
        bankName: { type: String, default: null },
        ifscCode: { type: String, default: null },
        accountNumber: { type: String, default: null },
        bankAddress: { type: String, default: null },
        accountHolderName: { type: String, default: null },
        finderFee: { type: String, default: null },
        finderFeeType: { type: String, default: null },
    },{ timestamps: true }
);

const Configuration = mongoose.model('configuration', ConfigurationSchema, "configuration");

export default Configuration;