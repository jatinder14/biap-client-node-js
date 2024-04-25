import mongoose from "mongoose";



const AddressSchema = new mongoose.Schema(
    {
        door: { type: String, default: null },
        name: { type: String, default: null },
        building: { type: String, default: null },
        street: { type: String, default: null },
        locality: { type: String, default: null },
        ward: { type: String, default: null },
        city: { type: String, default: null },
        state: { type: String, default: null },
        country: { type: String, default: null },
        areaCode: { type: String, default: null },
        tag:{ type: String, default: null },
        lat:{ type: String, default: null },
        lng:{ type: String, default: null }
    },
    { _id: false }
);

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
// UserSchema.index({ phone_otp: 1 }, { expireAfterSeconds: 10 });


const User  = mongoose.model('user', UserSchema, "User");

export default User;