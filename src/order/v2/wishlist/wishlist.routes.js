import {Router} from 'express';
 import { cartTranslator } from '../../../middlewares/bhashiniTranslator/cart.js';

import WishlistController from './wishlist.controller.js';

const rootRouter = new Router();

const wishListController = new WishlistController();
// -- /:wishlist_key


rootRouter.post(
    '/v2/wishlist/:userId/:wishlist_key',wishListController.addItem
);

rootRouter.get(
    '/v2/wishlist/:userId/:wishlist_key',
    wishListController.getWishlistItem
);

rootRouter.delete(
    '/v2/all/wishlist/:userId/:wishlist_key',
    wishListController.clearWishlist,
);

rootRouter.delete(
    '/v2/item/wishlist/:userId/:wishlist_key/:itemId',
    wishListController.removeWishlistItem,
);

rootRouter.delete(
    '/v2/wishlist/:userId/:withlist_id',
    wishListController.removeWishlistItemById,
);

rootRouter.put(
    '/v2/wishlist/:userId/:itemId',
    wishListController.updateWishlistItem,
);


//#endregion
export default rootRouter;
