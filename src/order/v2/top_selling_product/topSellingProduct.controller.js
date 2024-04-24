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

        if(pageNumber > 0) {
            console.log("21>>>>>>>>>>>")
            topSellingService.getTopOrderList().then(async response => {
                if(!response.error) {
                    const userId=req.params.userId
                    console.log("userId:",userId)
                    const findWishlistItem = await WishlistItem.find({
                      "item.userId": userId
                  });  
                  console.log("findWishlistItem>>>",findWishlistItem)     
                  const itemids = findWishlistItem.map((item) => {
                    return item.item.id; // Assuming the id is nested inside the item object
                });
                console.log("itemids>>>",itemids)     

                
                const itemDetaildata = response
                console.log("itemDetaildata",itemDetaildata)     

                response.forEach((item) => {
      if (itemids.includes(item.id)) {
          console.log("Matched item id:", item.id);
          item.wishlistAdded = true;
      }
  });       
  res.send(response)
}
                else

                    res.status(404).json(
                        {
                            totalCount: 0,
                            orders: [],
                            error: response.error,
                        }
                    );
            }).catch((err) => {
                next(err);
            });
        }
        else
            throw new BadRequestParameterError();
     }
  
}

export default TopSellingController;
