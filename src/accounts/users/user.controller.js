import { createJwtToken, verifyJwtToken } from '../../utils/token.utils.js';
import { v4 as uuidv4 } from "uuid";

import User from './db/user.js';
import sendOTPUtil from  '../../utils/otp.js';
import validateToken from '../../lib/firebase/validateToken.js';
import DeliveryAddress from '../deliveryAddress/db/deliveryAddress.js';
const JWT_SECRET = 'secret_token';
// const {randomInt} = require('crypto');

class UserController{

  async signUp(req, res) {
    const { name, phone, email } = req.body;
    let digits ="0123456789";
    let otp = "";
    for(let i=0; i<4; i++){
      otp+= digits[Math.floor(Math.random()*10)];
    }
    console.log("otp::",otp);
    try {
      // Save OTP and its expiration time in the database
      const user = await User.findOneAndUpdate(
        { phone },
        { phone_otp : otp }, // OTP expires in 10 minutes
        // otpExpiration: Date.now() + 600000
        { upsert: true, new: true }
      );
  
      // Send OTP via SMS
      await sendOTPUtil(phone, otp);
  
      res.status(200).json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
      console.error('Error sending OTP:', error);
      res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
};

 async  verifyOTP (req, res) {
    const { phone, otp } = req.body;
  
    try {
      // Find user by phone number and OTP
      const user = await User.findOne({ phone:phone, phone_otp:otp });
  
      if (!user) {
        // || user.otpExpiration < Date.now()
        return res.status(400).json({ success: false, message: 'Invalid OTP' });
      }

      const token = createJwtToken({ userId: user._id, uid: user._id, phone: phone });
  
      user.phone_otp = "";
      await user.save();
  
      res.status(201).json({
        type: "success",
        message: "OTP verified successfully",
        data: {
          token,
          userId: user._id,
        },
      });
    } catch (error) {
      console.error('Error verifying OTP:', error);
      res.status(500).json({ success: false, message: 'Failed to verify OTP' });
    }
  }

  async userProfile(req, res) {
    try {
      const { body: request, user } = req;
      let phone = user?.decodedToken?.phone || ""
      let email = user?.decodedToken?.email || ""
      let user_id = user?.decodedToken?.user_id || uuidv4()
      const existingUser = await User.findOne({ $or: [{ phone: phone }, { email: email }] });
      if (existingUser) {
        // User already exists, update their profile

        if (request.userName) existingUser.userName = request.userName;
        if (request.phone && !existingUser.phone) existingUser.phone = request.phone;
        if (request.email && !existingUser.email) existingUser.email = request.email;
        if (request.picture || user?.decodedToken?.picture) existingUser.userImage = request.picture || user?.decodedToken?.picture;
        if (request.address || user?.delivery_address) existingUser.address = request.address || user?.delivery_address;
        if (request.userId) existingUser.userId = request.userId
        if (request.cart_key) existingUser.cart_key = request.cart_key
        if (request.wishlist_key) existingUser.wishlist_key = request.wishlist_key
        existingUser.user_id = user_id
        const existingDefaultAddress = await DeliveryAddress.findOne({
          userId: existingUser._id
        })
        await existingUser.save();

        if (!existingDefaultAddress) {

          let defalutAdress = new DeliveryAddress({
            id: uuidv4(),
            userId: existingUser._id,
            address: request.address
          })
          await defalutAdress.save();
        }

        res.status(200).json({ message: 'User profile updated successfully', data: existingUser });
      } else {
        // User does not exist, create a new profile
        const newUser = new User({
          userName: request.userName || user?.decodedToken?.name,
          phone: user?.decodedToken?.phone || request.phone,
          email: user?.decodedToken?.email || request.email,
          userImage: user?.decodedToken?.picture || null,
          delivery_address: request.address || user?.decodedToken?.address,
          userId: request.userId || "",
          cart_key: request.cart_key || "",
          wishlist_key: request.wishlist_key || "",
          user_id
        });

        await newUser.save();
        res.status(201).json({ message: 'New user profile created', data: newUser });
      }
    }
    catch (error) {
      res.status(500).json({
        error: true,
        message: error.message
      })
    }

  }


  // async getUserProfile(req,res){
  //   const {id:userId} = req.params;
  //   try {
  //     const userDetails = await User.findOne({
  //       _id: userId,
  //     });

  //     if (!userDetails) {
  //       // User not found, return custom error message
  //       return res.status(404).json({
  //           success: false,
  //           message: 'User not found',
  //       });
  //   }

  //     console.log('userDetails-------------------- :>> ', userDetails);
  //     res.status(200).json({
  //       success:true,
  //       message:{
  //       userImage:userDetails.userImage,
  //       userName:userDetails.userName,
  //       email:userDetails.email,
  //       phone:userDetails.phone
  //       }
  //     });
  //   } catch (err) {
  //     res.status(500).json({success:false,
  //     message:err.message
  //     })
  //   }
  // }

  async getUserProfile(req, res) {
    const { user } = req;
    console.log("decodedToken =================", user?.decodedToken);
    let phone = user?.decodedToken?.phone || ""
    let email = user?.decodedToken?.email || ""
    let user_id = user?.decodedToken?.user_id || ""
    try {
      const userDetails = await User.findOne({ $or: [{ phone: phone }, { email: email }] });
      console.log('userDetails :>> ', userDetails);

      return res.status(200).json({
        success: true,
        data: {
          userImage: userDetails?.userImage || "",
          userName: userDetails?.userName || "",
          email: userDetails?.email || "",
          phone: userDetails?.phone || "",
          address: userDetails?.address || "",
          user_id: userDetails?.user_id || ""
        },
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

}

export default UserController;
