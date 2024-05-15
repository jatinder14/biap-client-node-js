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
const validateToken = async (token, is_otp_login,refreshtoken) => {
  let decodedToken;
  try {
    if (is_otp_login) {
      decodedToken =  decodeJwtToken(token);
      lokiLogger.error('decodedToeken :>> ', decodedToken);
    } else {
      lokiLogger.error('jatinder------------------------bhaskar')
      decodedToken = await admin.auth().verifyIdToken(token);

      lokiLogger.error('decodedToeken :>> ', decodedToken);
    }
    
    return decodedToken;
  } catch (e) {
    lokiLogger.error('-------------refreshtoken----------------',refreshtoken)

    let data = qs.stringify({
      'grant_type': process.env.GRANT_TYPE || 'refresh_token',
      'refresh_token': refreshtoken || 'AMf-vBzZsZhjwy0R-AM368kITPw4puNSx696CZf7T7w-CzTWiHEc8qzmJnK9anOx96bQslZfpFhENS69g0EwP73J5A2S1VANT1I8UDi6C5sCe-mJ-5L69rD7Wo-S7Sm5u3HegvhfC--k4qxs61pSR0h33eKqYFyNc54yzlaxwlhF_gorIEXH4jU744MHYJmm-QfxRdyymU2vhB_kH8n6fgO1JVOnNuHYsOw9u2O0xsckb5R_OO1bjgSKHwd4i6dyuI91wQA7rRnl67piLJY_AuqL6lbBmeznnM3DN81W4oLz7nRo_irIxnXs0oqI11hSSargB8o9XR9IP10llPjnxUd-aLXKH7myKuZ3rCjm6tus9sgde07EO0Zwy-B7YONDV7EV8n-9XoAURAKyX_4T7-_U5GJ_JttZXDi9DcE_tkwxUXOipoVqtxG-LyaBw1s6UMfZZReD_k0fvrN2cc6ME_g0xBf8ZVKt7w' 
    });
    
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      // url: process.env.REFRESH_TOKEN_URL||`https://securetoken.googleapis.com/v1/token?key=${ process.env.REACT_APP_FIREBASE_API_KEY || AIzaSyDc8UzM8eqonz-FFtOhJ6H-YexzsE54aoI}`,
      url: process.env.REFRESH_TOKEN_URL||`https://securetoken.googleapis.com/v1/token?key=AIzaSyDc8UzM8eqonz-FFtOhJ6H-YexzsE54aoI`, //devkey
      // url: process.env.REFRESH_TOKEN_URL||`https://securetoken.googleapis.com/v1/token?key=AIzaSyD-AR-uT5nXo5S-sG_Ewh7Zit8WK4DXT1Q`, //local key
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data : data
    };
    
    let response = await axios.request(config)
    lokiLogger.error(JSON.stringify(response.data));
    decodedToken = await admin.auth().verifyIdToken(response.data.access_token);

    lokiLogger.error('decodedToeken --------- inside catch:>> ', response.data);

    lokiLogger.error('Token is invalid.')
    return decodedToken;
  }
};

export default validateToken;
