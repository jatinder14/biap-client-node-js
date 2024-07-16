import {Router} from 'express';
 import { cartTranslator } from '../../../middlewares/bhashiniTranslator/cart.js';

import WishlistController from './wishlist.controller.js';

const rootRouter = new Router();

const wishListController = new WishlistController();
// -- /:wishlist_key


rootRouter.post(
    '/v2/wishlist/:userId/:deviceId',wishListController.addItem
);

rootRouter.get(
    '/v2/wishlist/:userId/:deviceId',
    wishListController.getWishlistItem
);

rootRouter.delete(
    '/v2/all/wishlist/:userId/:deviceId',
    wishListController.clearWishlist,
);

rootRouter.delete(
    '/v2/item/wishlist/:userId/:deviceId/:itemId',
    wishListController.removeWishlistItem,
);

rootRouter.delete(
    '/v2/wishlist/:userId/:productId',
    wishListController.removeWishlistItemById,
);

rootRouter.put(
    '/v2/wishlist/:userId/:itemId',
    wishListController.updateWishlistItem,
);


//#endregion
export default rootRouter;
