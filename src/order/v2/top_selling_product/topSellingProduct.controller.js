import TopSellingService from './topSellingProduct.service.js';

import BadRequestParameterError from '../../../lib/errors/bad-request-parameter.error.js';

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
            topSellingService.getTopOrderList(user, query).then(response => {
                if(!response.error) {
                    res.send("hello")
                }
                else
                res.send("fail")

                    // res.status(404).json(
                    //     {
                    //         totalCount: 0,
                    //         orders: [],
                    //         error: response.error,
                    //     }
                    // );
            }).catch((err) => {
                next(err);
            });
        }
        else
            throw new BadRequestParameterError();
     }
  
}

export default TopSellingController;
