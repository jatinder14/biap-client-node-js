import jwt from "jsonwebtoken";
// const { JWT_DECODE_ERR } = require("../errors");
// const { JWT_SECRET } = require("../../");
const JWT_SECRET = 'secret_token';

export const createJwtToken = (payload) => {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
  return token;
};

export const verifyJwtToken = (token, next) => {
  try {
    const { userId } = jwt.verify(token, JWT_SECRET);
    return userId;
  } catch (err) {
    next(err);
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

