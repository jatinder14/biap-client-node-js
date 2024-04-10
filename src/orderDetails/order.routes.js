// settlementRoute.js
import express from "express"
const rootRouter = express.Router();
import { getOrdersHandler } from "./order.controller.js";

rootRouter.get('/orderdetails', getOrdersHandler);

export default rootRouter;
