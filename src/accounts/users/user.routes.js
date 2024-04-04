import { Router } from "express";

const {
  sendOTP,
  verifyOTP,
} = require("./user.controller");

const rootRouter = new Router();

router.post('/sendotp', sendOTP);
  
router.post('/verifyotp', verifyOTP);
  
export default rootRouter;