import { Router } from "express";
import { authentication } from "../middlewares/index.js";
import {bhashiniTranslator} from '../../src/middlewares/bhashiniTranslator/deliveryAddress.js';
import BillingController from "./billings/billing.controller.js";
import DeliveryAddressController from "./deliveryAddress/deliveryAddress.controller.js";
import MapController from "./map/map.controller.js";
import UserController from "../accounts/users/user.controller.js";

const rootRouter = new Router();

const billingController = new BillingController();
const mapController = new MapController();
const deliveryAddressController = new DeliveryAddressController();
const userController = new UserController();

//#region billing details

rootRouter.post(
  "/v1/billing_details",
  authentication(),
  billingController.billingAddress
);

rootRouter.get(
  "/v1/billing_details",
  authentication(),
  billingController.onBillingDetails
);


rootRouter.post('/signup', userController.signUp);
rootRouter.post('/resendOtp', userController.resendOtp);
  
rootRouter.post('/verifyotp', userController.verifyOTP);

rootRouter.post('/userProfile', authentication(), userController.userProfile);

rootRouter.get('/getUserProfile',authentication(), userController.getUserProfile);

rootRouter.get('/', userController.getRefreshToken);

  
//I have to work on this route once cart issue will merge i will work on refresh token
// rootRouter.post('/refreshToken', userController.genRefreshToken);



rootRouter.post(
  "/v1/update_billing_details/:id",
  authentication(),
  billingController.updateBillingAddress
);


rootRouter.delete('/v1/delete_billing_details/:id',
  authentication(),
  billingController.deleteBillingAddress
);

//#endregion

//#region delivery address details

rootRouter.post(
  "/v1/delivery_address",
  authentication(),
  deliveryAddressController.deliveryAddress
);

rootRouter.get(
  "/v1/delivery_address",
  authentication(),
  deliveryAddressController.onDeliveryAddressDetails,
  bhashiniTranslator
);

rootRouter.post(
  "/v1/update_delivery_address/:id",
  authentication(),
  deliveryAddressController.updateDeliveryAddress
);

rootRouter.delete(
  "/v1/delete_delivery_address/:id",
  authentication(),
  deliveryAddressController.deleteDeliveryAddress
);

rootRouter.get("/v2/map/accesstoken", mapController.mmiToken);

rootRouter.get("/v2/map/getCordinates", mapController.getCoordinates);
rootRouter.get("/v2/map/getPinCode", mapController.getPincode);

//#endregion
export default rootRouter;