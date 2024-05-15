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
const validateToken = async (token, is_otp_login, refreshtoken) => {
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
    lokiLogger.error('-------------refreshtoken----------------', refreshtoken)
    try {
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
      lokiLogger.error(JSON.stringify(response.data));
      decodedToken = await admin.auth().verifyIdToken(response.data.access_token);

      lokiLogger.error('decodedToeken --------- inside catch:>> ', response.data);

      lokiLogger.error('Token is invalid.')
      return decodedToken;
    } catch (error) {
      lokiLogger.error('error validating refresh token -------', error)
      return null;

    }
  }
};

export default validateToken;
