import admin from "firebase-admin";
import { decodeJwtToken } from '../../utils/token.utils.js';
import User from "../../accounts/users/db/user.js";
import lokiLogger from '../../utils/logger.js'
import axios from "axios";
import qs from 'qs';

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
      lokiLogger.error('decodedToeken :>> ', decodedToken);
    } else {
      decodedToken = await admin.auth().verifyIdToken(token);

      lokiLogger.error('decodedToeken :>> ', decodedToken);
    }

    return decodedToken;
  } catch (e) {
      lokiLogger.error('error validating refresh token -------', e)
      return null;
  }
};

export default validateToken;
