import admin from "firebase-admin";
import { decodeJwtToken } from '../../utils/token.utils.js';
import lokiLogger from '../../utils/logger.js'

/**
 *
 * @param {String} token
 * @returns {String} decodedToken
 */
const validateToken = async (token, is_otp_login) => {
  let decodedToken;
  try {
    if (is_otp_login) {
      decodedToken = decodeJwtToken(token);
    } else {
      decodedToken = await admin.auth().verifyIdToken(token);
      if (decodedToken.user_id) decodedToken.userId = decodedToken.user_id
    }

    return decodedToken;
  } catch (e) {
      lokiLogger.error('error validating refresh token -------', e)
      return null;
  }
};

export default validateToken;
