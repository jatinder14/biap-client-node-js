// settlementRoute.js
import express from "express"
const rootRouter = express.Router();
import { getSettlementsHandler } from "../settlement/settle.controller.js"
import analyticsRouter from "../utils/analytics/router.js"
import orderRouter from "../orderDetails/order.routes.js"

rootRouter.get('/settlements', getSettlementsHandler);
rootRouter.use("/analytics", analyticsRouter)
rootRouter.use('/db', orderRouter)

export default rootRouter;
