import { UnauthenticatedError } from "../lib/errors/index.js";
import validateToken from "../lib/firebase/validateToken.js";
import admin from "firebase-admin";
import MESSAGES from "../utils/messages.js";
import jwt from "jsonwebtoken";
const JWT_SECRET = 'secret_token';
import { verifyJwtToken } from '../utils/token.utils.js';

const authentication = (options) => async(req, res, next) => {
  try{
  const authHeader = req.headers.authorization;

  
  let idToken = authHeader 
  let is_otp_login=false;
  if (authHeader) {
    idToken = authHeader.split(" ")[1];

    const noramlToken = verifyJwtToken(idToken, JWT_SECRET);
   
    if(noramlToken){
      is_otp_login = true
    }

    validateToken(idToken, is_otp_login).then((decodedToken) => {
      if (decodedToken) {
        req.user = { decodedToken: decodedToken, token: idToken };
        next();
      } else {
        next(
          new UnauthenticatedError(
            MESSAGES.LOGIN_ERROR_USER_ACCESS_TOKEN_INVALID
          )
        );
      }
    });
  } else {
    next(
      new UnauthenticatedError(MESSAGES.LOGIN_ERROR_USER_ACCESS_TOKEN_INVALID)
    );
  }
}catch(error){
 res.status(403).json({'success' : false, 'message':"Invalid Token Signature" })
}
};

export default authentication;
