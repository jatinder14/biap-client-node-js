import mongoose from "mongoose";

const  UserSchema = new mongoose.Schema(
    {
        userId: { type: String },
        phone: { type: String,required: true},
        phone_otp : {type : String},
        name : {type : String},
        email : {type : String},
        phone_otp_expiry_date : {type : String},
        email_otp_expiry_date : {type : String},

    },
    { _id: true, timestamps: true }
);
// UserSchema.index({ phone_otp: 1 }, { expireAfterSeconds: 10 });


const User  = mongoose.model('user', UserSchema, "User");

export default User;