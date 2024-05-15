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
  const refreshtoken = req.headers.refreshtoken;

  
  let idToken = authHeader 
  let is_otp_login=false;
  if (authHeader) {
    idToken = authHeader.split(" ")[1];

    const noramlToken = verifyJwtToken(idToken, JWT_SECRET);
   
    if(noramlToken){
      is_otp_login = true
    }

    validateToken(idToken, is_otp_login, refreshtoken).then((decodedToken) => {
      if (decodedToken) {
        req.user = { decodedToken: decodedToken, token: idToken };
        next();
      } else {
        // next(new UnauthenticatedError(MESSAGES.LOGIN_ERROR_USER_ACCESS_TOKEN_INVALID));
        res.header("Access-Control-Allow-Origin", "*");
        res.header(
          "Access-Control-Allow-Headers",
          "Origin, X-Requested-With, Content-Type, Accept, Authorization"
        );
        res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
        return res.status(401).json({'success' : false, 'message': "Authentication failed: Please login again!" })
      }
    }).catch(err => { 
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
      );
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE"); 
      return res.status(401).json({'success' : false, 'message': "Authentication failed: Please login again!", error: err?.message })
    });
  } else {
    // next(new UnauthenticatedError(MESSAGES.LOGIN_ERROR_USER_ACCESS_TOKEN_INVALID));
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    return res.status(401).json({'success' : false, 'message': "Authentication failed: Please login again!" })
  }
}catch(error){
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  return res.status(403).json({'success' : false, 'message':"Invalid Token Signature!" })
}
};

export default authentication;
