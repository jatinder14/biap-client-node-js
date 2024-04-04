import jwt from "jsonwebtoken";
const JWT_SECRET = 'secret_token';

export const createJwtToken = (payload) => {
  payload.loginWithOTP = true
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
  return token;
};

export const verifyJwtToken = (token, next) => {
  try {
    const { userId } = jwt.verify(token, JWT_SECRET);
    if(userId){
      return true;
    }
  } catch (err) {
    return false;
  }
};
export const decodeJwtToken = (token, next) => {
  try {
    const decodedToken = jwt.decode(token, JWT_SECRET);
    return decodedToken;
  } catch (err) {
   return false;
  }
};

