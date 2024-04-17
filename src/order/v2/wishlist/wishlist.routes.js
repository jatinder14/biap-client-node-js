import {Router} from 'express';
//  import { cartTranslator } from '../../../../middlewares/bhashiniTranslator/cart.js';

import WishlistController from './wishlist.controller.js';

const rootRouter = new Router();

const wishListController = new WishlistController();
// -- /:cart_key


rootRouter.post(
    '/v2/wishlist:userId/:itemId',wishListController.addItem
);

// rootRouter.get(
//     '/v2/wishlist/:userId/:itemId');


//#endregion
export default rootRouter;
