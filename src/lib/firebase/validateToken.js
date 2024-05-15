import admin from "firebase-admin";
import { decodeJwtToken } from '../../utils/token.utils.js';
import User from "../../accounts/users/db/user.js";
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
      console.log('decodedToeken :>> ', decodedToken);
    } else {
      console.log('jatinder------------------------bhaskar')
      decodedToken = await admin.auth().verifyIdToken(token);

      console.log('decodedToeken :>> ', decodedToken);
    }

    return decodedToken;
  } catch (e) {
    console.log('-------------refreshtoken----------------',refreshtoken)
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
      console.log(JSON.stringify(response.data));
      decodedToken = await admin.auth().verifyIdToken(response.data.access_token);

      console.log('decodedToeken --------- inside catch:>> ', response.data);

      console.log('Token is invalid.')
      return decodedToken;
    } catch (error) {
      console.log('error validating refresh token -------', error)
      return null;

    }
  }
};

export default validateToken;
