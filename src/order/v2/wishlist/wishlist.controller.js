import WishListService from './wishlist.service.js';


const wishlistService = new WishListService();

class WishlistController {

    async addItem(req, res, next) {
        try {
           
            return res.send(await wishlistService.addItem({ ...req.body, ...req.params }));
        } catch (err) {
            next(err);
        }
    }

    async getWishlistItem(req, res, next) {
        try {
            const wishlistItem = await wishlistService.getWishlistItem({ ...req.query, ...req.params })
            res.send(wishlistItem)
        } catch (err) {
            next(err);
        }
    }
    async clearWishlist(req, res, next) {
        try {
            return res.send(await wishlistService.clearWishlist({ ...req.params }));
        } catch (err) {
            next(err);
        }
    }
    async removeWishlistItem(req, res, next) {
        try {
            return res.send(await wishlistService.removeWishlistItem({ ...req.body, ...req.params }));

        } catch (err) {
            next(err);
        }
    }
    async removeWishlistItemById(req, res, next) {
        try {
            const { wishlistId } = req.params;
            return res.send(await wishlistService.removeWishlistItemById(wishlistId));

        } catch (err) {
            next(err);
        }
    }
    async updateWishlistItem(req, res, next) {
        try {
            return res.send(await wishlistService.updateWishlistItem({ ...req.body, ...req.params }));
        } catch (err) {
            next(err);
        }
    }


}

export default WishlistController;
