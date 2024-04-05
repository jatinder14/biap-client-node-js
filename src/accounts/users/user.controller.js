import { createJwtToken } from '../../utils/token.utils.js';

import User from './db/user.js';
import sendOTPUtil from  '../../utils/otp.js';
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

 async verifyOTP (req, res) {
    const { phone, otp } = req.body;
  
    try {
      // Find user by phone number and OTP
      const user = await User.findOne({ phone:phone, phone_otp:otp });
  
      if (!user) {
        // || user.otpExpiration < Date.now()
        return res.status(400).json({ success: false, message: 'Invalid OTP' });
      }

      const token = createJwtToken({ userId: user._id, uid: user._id });
  
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

}

export default UserController;
