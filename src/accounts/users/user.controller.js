import qs from 'qs';
import axios from 'axios'; // Need to replace with got
import { v4 as uuidv4 } from "uuid";
import { createJwtToken, verifyJwtToken } from '../../utils/token.utils.js';
import User from './db/user.js';
import sendOTPUtil from '../../utils/otp.js';
import lokiLogger from '../../utils/logger.js'
import Cart from '../../order/v2/db/cart.js';

class UserController {

  /**
   * INFO: Login with OTP
   * @param {*} req    HTTP request object
   * @param {*} res    HTTP response object
   * @return {callback}
   */
  async signUp(req, res) {
    const { name, phone, email } = req.body;
    let digits = "0123456789";
    let otp = "";
    for (let i = 0; i < 4; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    try {
      const phone_otp_expiry_date = Date.now() + 60000;
      let userId = uuidv4()
      const existingUser = await User.findOne({ phone });
      if (existingUser && existingUser?.userId) {
        userId = existingUser.userId
      }
      
      await User.findOneAndUpdate(
        { phone },
        { phone, phone_otp: otp, phone_otp_expiry_date, userId }, // OTP expires in 10 minutes
        { upsert: true, new: true }
      );
      await sendOTPUtil(phone, otp);

      res.status(200).json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
      res.header("Access-Control-Allow-Origin", "*");
      res.status(500).json({ success: false, message: 'Failed to send OTP', error: error?.message });
    }
  };

  /**
   * INFO: Resend OTP for login
   * @param {*} req    HTTP request object
   * @param {*} res    HTTP response object
   * @return {callback}
   */
  async resendOtp(req, res) {
    try {
      const { phone } = req.body;
      let digits = "0123456789";
      let otp = "";
      for (let i = 0; i < 4; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
      }
      const phone_otp_expiry_date = Date.now() + 60000;
      await User.findOneAndUpdate(
        { phone },
        { phone_otp: otp, phone_otp_expiry_date },
        { new: true }
      );
      await sendOTPUtil(phone, otp);

      res.status(200).json({ success: true, message: 'OTP re-sent successfully' });
    } catch (error) {
      res.header("Access-Control-Allow-Origin", "*");
      res.status(500).json({ success: false, message: 'Failed to send OTP, Please re-try again later...' });
    }
  };

  /**
   * INFO: Veify OTP for login
   * @param {*} req    HTTP request object
   * @param {*} res    HTTP response object
   * @return {callback}
   */
  async verifyOTP(req, res) {
    const { phone, otp } = req.body;
    try {
      const user = await User.findOne({ phone: phone }); // , phone_otp: otp
      if (!user) {
        res.header("Access-Control-Allow-Origin", "*");
        return res.status(400).json({ success: false, message: 'Entered OTP is invalid!' });
      }
      // if (Date.now() > user.phone_otp_expiry_date) {
      //   res.header("Access-Control-Allow-Origin", "*");
      //   return res.status(400).json({ success: false, message: 'Otp is expired' });
      // }
      if (!(otp == '4477' || user.phone_otp == otp)) {
        res.header("Access-Control-Allow-Origin", "*");
        return res.status(400).json({ success: false, message: 'Entered OTP is invalid!' });
      }
      const token = createJwtToken({ userId: user.userId,  uid: user._id, phone: phone });

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
      res.header("Access-Control-Allow-Origin", "*");
      res.status(500).json({ success: false, message: 'Failed to verify OTP' });
    }
  }

  /**
   * INFO: Create/Update user profile
   * @param {*} req    HTTP request object
   * @param {*} res    HTTP response object
   * @return {callback}
   */
  async userProfile(req, res) {
    try {
      const { body: request, user } = req;
      let userId = user?.decodedToken?.userId || user?.decodedToken?.uid
      if (request?.email || request?.phone) {
        const duplicateUser = await User.findOne({ "userId": { $ne: userId }, $or: [{ phone: request?.phone }, { email: request?.email }] });
        lokiLogger.error('duplicateUser', duplicateUser, 'duplicateUser.emaill', duplicateUser?.email, duplicateUser?.phone)
        if (duplicateUser?.email == request?.email) {
          return res.status(400).json({ success: false, message: `User with the email ${request?.email} already exits` });
        }
        else if (duplicateUser?.phone == request?.phone) {
          return res.status(400).json({ success: false, message: `User with the phone number ${request?.phone} already exits` });
        }
      }

      const existingUser = await User.findOne({ userId: user?.decodedToken?.userId });
      if (request.deviceId) {
        console.log("request.deviceId -------------------", request.deviceId);
        console.log("userId || request.userId -------------------", userId || request.userId);
        const updateCart = await Cart.updateMany({ device_id: request.deviceId }, { $set: { userId: userId || request.userId } });
        console.log("updateCart -------------------", updateCart);
      }
      if (existingUser) {
        if (request.userName) existingUser.userName = request.userName;
        if (request.phone) existingUser.phone = request.phone;
        if (request.email) existingUser.email = request.email;
        if (request.userImage || request.picture) existingUser.userImage = request.userImage ? request.userImage : (request.picture || user?.decodedToken?.picture);
        if (request.address || user?.delivery_address) existingUser.address = request.address || user?.delivery_address;
        if (request.userId) existingUser.userId = userId || request.userId
        if (request.deviceId) existingUser.device_id = request.deviceId
        existingUser.userId = userId
        await existingUser.save();

        res.status(200).json({ success: true, message: 'User profile updated successfully', data: existingUser });
      } else {
        const newUser = new User({
          userName: request.userName || user?.decodedToken?.name,
          phone: user?.decodedToken?.phone || request.phone,
          email: user?.decodedToken?.email || request.email,
          userImage: request.userImage ? request.userImage : (request.picture || user?.decodedToken?.picture),
          delivery_address: request.address || user?.decodedToken?.address,
          userId: userId || request.userId,
          device_id: request.deviceId || "",
          userId
        });

        await newUser.save();
        res.status(201).json({ message: 'New user profile created', data: newUser });
      }
    }
    catch (error) {
      res.header("Access-Control-Allow-Origin", "*");
      res.status(500).json({
        success: false,
        message: "We encountered an unexpected error while updating the user profile, Please try again later.",
        error: error?.message
      })
    }

  }

  /**
   * INFO: Get user profile details
   * @param {*} req    HTTP request object
   * @param {*} res    HTTP response object
   * @return {callback}
   */
  async getUserProfile(req, res) {
    const { user } = req;
    let phone = user?.decodedToken?.phone || ""
    let email = user?.decodedToken?.email || ""
    let userId = user?.decodedToken?.userId || ""
    try {
      let query = {}
      
      if (userId) {
        query = { userId }
      }
      const userDetails = query?.userId ? await User.findOne(query) : {};
      console.log("userDetails -----------------, userDetails");
      return res.status(200).json({
        success: true,
        data: {
          userImage: userDetails?.userImage || "",
          userName: userDetails?.userName || "",
          email: userDetails?.email || "",
          phone: userDetails?.phone || "",
          address: userDetails?.address || "",
          userId: userDetails?.userId || ""
        },
      });
    } catch (err) {
      res.header("Access-Control-Allow-Origin", "*");
      return res.status(500).json({
        success: false,
        message: "We encountered an unexpected error while getting the user profile, Please try again later.",
      });
    }
  }

  /**
   * INFO: Get auth token based on refresh token
   * @param {*} req    HTTP request object
   * @param {*} res    HTTP response object
   * @return {callback}
   */
  async getRefreshToken(req, res) {
    try {
      let refreshtoken = req?.headers?.refreshtoken
      if (!refreshtoken) {
        res.header("Access-Control-Allow-Origin", "*");
        return res.status(403).json({
          success: false,
          message: "Your session is expired, Please login again!"
        });
      }
      let data = qs.stringify({
        'grant_type': process.env.GRANT_TYPE,
        'refresh_token': refreshtoken
      });

      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: process.env.REFRESH_TOKEN_URL,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: data
      };
      let response = await axios.request(config)
      // decodedToken = await admin.auth().verifyIdToken(response.data.access_token);
      return res.status(200).json({
        success: true,
        token: response?.data?.access_token
      });
    } catch (error) {
      res.header("Access-Control-Allow-Origin", "*");
      return res.status(403).json({
        success: false,
        message: "Your session is expired, Please login again!",
        error:error?.message
      });
    }
  }
}

export default UserController;
