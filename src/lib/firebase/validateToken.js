import admin from "firebase-admin";
import { decodeJwtToken } from '../../utils/token.utils.js';
import User from "../../accounts/users/db/user.js";


/**
 *
 * @param {String} token
 * @returns {String} decodedToken
 */
const validateToken = async (token, is_otp_login) => {
  let decodedToken;
  try {
    if (is_otp_login) {
      decodedToken =  decodeJwtToken(token);
    } else {
      decodedToken = await admin.auth().verifyIdToken(token);
      console.log('decodedToeken :>> ', decodedToken);
    }
    
    return decodedToken;
  } catch (e) {
    // Token is invalid.
    return null;
  }
};

export default validateToken;
