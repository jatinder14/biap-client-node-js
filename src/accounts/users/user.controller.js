import { createJwtToken, verifyJwtToken } from '../../utils/token.utils.js';

import User from './db/user.js';
import sendOTPUtil from  '../../utils/otp.js';
import validateToken from '../../lib/firebase/validateToken.js';
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

  async userProfile(req,res){
    const { body: request, user} = req;
    console.log('user :>> ', user);
    let phone =user.decodedToken.phone
    console.log('phone :>> ', phone);
    let email=user?.decodedToken?.email
    console.log('email :>> ', email);
    // const phone =user?.decodedToken?.phone

    // if(!phone){
    //   const existingUser = await User.findOne({ $or: [{ phone }, { email }] });
    // }
    const existingUser = await User.findOne({ $or: [{ phone:phone  }, { email:email }] });
    console.log('existingUser :>>---------------------', existingUser);
    if (existingUser) {
      // User already exists, update their profile
      existingUser.userName = user?.decodedToken?.name;
      existingUser.phone = user?.decodedToken?.phone;
      existingUser.email = user?.decodedToken?.email;
      existingUser.userImage = user?.decodedToken?.picture;
      existingUser.delivery_address=user?.delivery_address
      await existingUser.save();
      res.status(200).json({ message: 'User profile updated successfully', data: existingUser });
  } else {
      // User does not exist, create a new profile
      const newUser = new User({
          userName:user?.decodedToken?.name||null,
          phone:user?.decodedToken?.phone||null,
          email:user?.decodedToken?.email||null,
          userImage:user?.decodedToken?.picture||null,
          delivery_address:user?.decodedToken?.picture||null
      });
      await newUser.save();
      res.status(201).json({ message: 'New user profile created', data: newUser });
  }


    // res.status(200).json({request:request,user:user,existingUser:existingUser})


    // res.status(200).json({request:request,user:user})
  }


  async getUserProfile(req,res){
    const { id } = params;
    try {
      const userDetails = await User.find({
        _id: id,
      });

      return userDetails;
    } catch (err) {
      throw err;
    }
  }
  
}

export default UserController;
