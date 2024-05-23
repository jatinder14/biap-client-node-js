import TopSellingService from './topSellingProduct.service.js';

import BadRequestParameterError from '../../../lib/errors/bad-request-parameter.error.js';
import WishlistItem from "../db/wishlistItem.js"

const topSellingService = new TopSellingService();

class TopSellingController {
    
    /**
    * get order list
    * @param {*} req    HTTP request object
    * @param {*} res    HTTP response object
    * @param {*} next   Callback argument to the middleware function
    * @return {callback}
    */
   
    topSellingProduct(req, res, next) {
        const { query = {}, user } = req;

        const { pageNumber = 1 } = query;

        if (pageNumber > 0) {
            topSellingService.getTopOrderList().then(async response => {
                if (!response.error) {
                    const userId = req.params.userId
                    const wishlistKey = req.query.wishlist_key || req.query.deviceId
                    let where = [], itemids = []
                    if (userId && !["null", "undefined", "guestUser"].includes(userId)) {
                        where = [...where, { "item.userId": userId }]
                    }
                    if (wishlistKey && !["null", "undefined", "guestUser"].includes(wishlistKey)) {
                        where = [...where, { "item.wishlist_key": wishlistKey }]
                    }
                    if (where.length) {
                        const findWishlistItem = await WishlistItem.find({
                            $or: where
                        });

                        itemids = findWishlistItem.map((item) => {
                        return item?.item?.id;
                        });
                        response.forEach((item) => {
                            if (itemids.includes(item?.item_details?.id)) {
                                item.wishlistAdded = true;
                            }
                        });
                    }
                    
                    res.send(response)
                }
                else {
                    console.log("topSellingProduct response.error ----------------- ", response.error);
                    res.send([]);
                } 
            }).catch((err) => {
                next(err);
            });
        }
        else
            throw new BadRequestParameterError();
    }
  
}

export default TopSellingController;
