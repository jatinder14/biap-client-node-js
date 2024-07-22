import jwt from "jsonwebtoken";
const JWT_SECRET = 'secret_token';

export const createJwtToken = (payload) => {
  payload.loginWithOTP = true
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
  return token;
};

export const verifyJwtToken = (token, next) => {
  try {
    const user = jwt.verify(token, JWT_SECRET);
    if(user){
      return true;
    } else {
      return false;
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
    next(err);
  }
};

