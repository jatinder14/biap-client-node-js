import WishListService from './wishlist.service.js';

const wishlistService = new WishListService();

class WishlistController {

   async addItem(req, res, next) {
        try {
            return res.send(await wishlistService.addItem({...req.body, ...req.params}));
        }
        catch (err) {
            console.log("err>>>>",err)
            next(err); // Forward the error to the error handling middleware

                   }
    }


    

}

export default WishlistController;
