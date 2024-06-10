
import { Router } from 'express';
//v1
import accountRoutes from "../accounts/accounts.routes.js";
import migrationsRoutes from "../migrations/migrations.routes.js";
import orderRoutes from "../order/v1/order.routes.js";
import paymentRoutes from "../payment/payment.routes.js";
import searchRoutes from "../discovery/v1/search.routes.js";
import sseRoutes from "../sse/v1/sse.routes.js";
import supportRoutes from "../support/v1/support.routes.js";
import trackRoutes from "../fulfillment/v1/track.routes.js";
//v2
import orderRoutesv2 from "../order/v2/order.routes.js";
import searchRoutesv2 from "../discovery/v2/search.routes.js";
import supportRoutesv2 from "../support/v2/support.routes.js";
import trackRoutesv2 from "../fulfillment/v2/track.routes.js";
import cartRoutesv2 from "../order/v2/cart/v2/cart.routes.js";
import sseRoutesv2 from "../sse/v2/sse.routes.js";
import razorPayv2 from "../razorPay/razorpay.routes.js";
import rspRoutes from "../rsp_integration/rsp_routes/rsfRoutes.js"
import wishlistRoutes from "../order/v2/wishlist/wishlist.routes.js"
import User from '../accounts/users/db/user.js';
import rootRouter from '../accounts/accounts.routes.js';
import configurationRouter from '../configuration/index.js';
import Order from '../order/v1/db/order.js';
import Refund from '../order/v2/db/refund.js';
import Settlements from '../order/v2/db/settlement.js';
import Fulfillments from '../order/v2/db/fulfillments.js';
import FulfillmentHistory from '../order/v2/db/fulfillmentHistory.js';
import WishList from '../order/v2/db/wishlist.js';

const router = new Router();
router.get("/users",async (req,res) => {
    let data = await User.find();
 
     res.status(200).json({"use": "testing",
     data: data
 })
 })
//  for testing
router.get("/users/:id",async (req,res) => {
    console.log('req.params.id',req.params.id)
    let data = await User.findOne({userId : req.params.id});
 
     res.status(200).json({"use": "testing",
     data: data
 })
 })
router.get("/orders",async (req,res) => {
    let data = await Order.find();
 
     res.status(200).json({"use": "testing",
     data: data
 })
 })
router.get("/refunds",async (req,res) => {
    let data = await Refund.find();
     res.status(200).json({"use": "testing",
     data: data
 })
 })
router.get("/settlements",async (req,res) => {
    let data = await Settlements.find();
     res.status(200).json({"use": "testing",
     data: data
 })
 })
router.get("/fulfillments",async (req,res) => {
    let data = await Fulfillments.find();
     res.status(200).json({"use": "testing",
     data: data
 })
 })
router.get("/fulfillment-History",async (req,res) => {
    let data = await FulfillmentHistory.find();
     res.status(200).json({"use": "testing",
     data: data
 })
 })
router.get("/orders/:id",async (req,res) => {
    console.log('req.params.id',req.params.id)
    let data = await Order.findOne({id: req.params.id});
    if(!data) {
     data = await Order.findOne({userId: req.params.id});
    }
 
     res.status(200).json({"use": "testing",
     data: data
 })
 })
router.get("/wishlishts",async (req,res) => {
    let data = await WishList.find();

     res.status(200).json({"use": "testing",
     data: data 
 })
 })
router.use("/refresh-token", rootRouter);
//v1
router.use(accountRoutes);
router.use(migrationsRoutes);
router.use(orderRoutes);
router.use(paymentRoutes);
router.use(searchRoutes);
router.use(sseRoutes);
router.use(supportRoutes);
router.use(trackRoutes);
router.use(rspRoutes)

//v2
router.use(orderRoutesv2);
router.use(searchRoutesv2);
router.use(supportRoutesv2);
router.use(trackRoutesv2);
router.use(cartRoutesv2);
router.use(sseRoutesv2);
router.use(razorPayv2);
router.use(wishlistRoutes);
router.use(configurationRouter)

export default router;