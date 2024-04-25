import mongoose from "mongoose";

const  UserSchema = new mongoose.Schema(
    {
        userId: { type: String },
        userName:{ type: String, default: null },
        userImage:{ type: String, default: null },
        phone: { type: String},
        email: { type: String, default: null },
        phone_otp : {type : String},
        email : {type : String},
        phone_otp_expiry_date : {type : String},
        email_otp_expiry_date : {type : String}
},
    { _id: true, timestamps: true }
);


const User  = mongoose.model('user', UserSchema, "User");

export default User;