import TopSellingService from './topSellingProduct.service.js';

import BadRequestParameterError from '../../../lib/errors/bad-request-parameter.error.js';
import WishlistItem from "../db/wishlistItem.js"
import WishList from '../db/wishlist.js';

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
        const userId = req.params.userId
        const { pageNumber = 1, pincode } = query;

        if (pageNumber > 0) {
            topSellingService.getTopOrderList(userId, pincode).then(async response => {
                if (!response.error) {
                    const userId = req.params.userId
                    const wishlistKey = req.query.deviceId 
                    let itemids = [], wishlist, wishlist2, wishlistIds = [];
                    if (wishlistKey && !["null", "undefined", "guestUser"].includes(wishlistKey)) {
                        wishlist = await WishList.findOne({ device_id: wishlistKey });
                    }
                    if (userId && !["null", "undefined", "guestUser"].includes(userId)) {
                        wishlist2 = await WishList.findOne({ userId: userId });
                    }
                    if (wishlist?._id) wishlistIds.push(wishlist?._id)
                    if (wishlist2?._id) wishlistIds.push(wishlist2?._id)
                    let wishlistData = await WishlistItem.find({ wishlist: { $in: wishlistIds } });
                    if (wishlistData.length) {
                        response.forEach((item) => {
                            const isWishlisted = wishlistData.find(el => item?.item_details?.id == el?.item_id && item?.provider_details?.id == el?.provider_id);
                            if (isWishlisted) {
                                item.wishlistAdded = true;
                            }
                        });
                    }

                    res.send(response.slice(0, 10))
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
