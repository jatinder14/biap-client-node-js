import {Router} from 'express';
 import { cartTranslator } from '../../../middlewares/bhashiniTranslator/cart.js';

import WishlistController from './wishlist.controller.js';

const rootRouter = new Router();

const wishListController = new WishlistController();
// -- /:cart_key


rootRouter.post(
    '/v2/wishlist/:userId/:cart_key',wishListController.addItem
);

rootRouter.get(
    '/v2/wishlist/:userId/:cart_key',
    wishListController.getWishlistItem
);

rootRouter.delete(
    '/v2/wishlist/:userId/:cart_key',
    wishListController.clearWishlist,
);

rootRouter.delete(
    '/v2/wishlist/:userId/:itemId',
    wishListController.removeWishlistItem,
);

rootRouter.put(
    '/v2/wishlist/:userId/:itemId',
    wishListController.updateWishlistItem,
);


//#endregion
export default rootRouter;
