import SearchService from "./search.service.js";
import BadRequestParameterError from "../../lib/errors/bad-request-parameter.error.js";
import NoRecordFoundError from "../../lib/errors/no-record-found.error.js";
import WishlistItem from "../../order/v2/db/wishlistItem.js"
import WishList from '../../order/v2/db/wishlist.js';
import { SSE_CONNECTIONS } from "../../utils/sse.js";

const searchService = new SearchService();

class SearchController {
  /**
   * search
   * @param {*} req    HTTP request object
   * @param {*} res    HTTP response object
   * @param {*} next   Callback argument to the middleware function
   * @return {callback}
   */
  search(req, res, next) {
    const searchRequest = req.query;
    console.log({ searchRequest });
    const headers = req.headers;
    let targetLanguage = headers['targetlanguage'];

    if (targetLanguage === 'en' || !targetLanguage) { //default catalog is in english hence not considering this for translation
      targetLanguage = undefined
    }
    searchService.search(searchRequest, targetLanguage).then(async response => {
      if (!response) {
        return {
          response: {
            count: 0,
            data: [],
            pages: 0

          }
        };
      } else {

        try {
          const userId = req.params.userId
          const wishlistKey = req.query.deviceId
          console.log("userId ------------------------", userId);
          console.log("wishlistKey ------------------------", wishlistKey);
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
            response?.response?.data?.forEach((item) => {
              const isWishlisted = wishlistData.find(el => item?.item_details?.id == el?.item_id && item?.provider_details?.id == el?.provider_id);
              if (isWishlisted) {
                item.wishlistAdded = true;
              }
            });
          }
          req.body.responseData = response;
          next()
        }
        catch (e) {
          next(e);
        }
      }
    }).catch((err) => {
      next(err);
    });
  }

  getProvideDetails(req, res, next) {
    const searchRequest = req.query;

    console.log({ searchRequest })
    const headers = req.headers;

    let targetLanguage = headers['targetlanguage'];

    if (targetLanguage === 'en' || !targetLanguage) //default catalog is in english hence not considering this for translation
    {
      targetLanguage = undefined
    }
    searchService.getProvideDetails(searchRequest, targetLanguage).then(response => {
      if (!response || response === null)
        throw new NoRecordFoundError("No result found");
      else
        res.json(response);
    }).catch((err) => {
      next(err);
    });
  }

  getLocationDetails(req, res, next) {
    const searchRequest = req.query;
    const headers = req.headers;

    let targetLanguage = headers['targetlanguage'];

    if (targetLanguage === 'en' || !targetLanguage) //default catalog is in english hence not considering this for translation
    {
      targetLanguage = undefined
    }
    searchService.getLocationDetails(searchRequest, targetLanguage).then(response => {
      if (!response || response === null)
        throw new NoRecordFoundError("No result found");
      else
        res.json(response);
    }).catch((err) => {
      next(err);
    });
  }

  getItemDetails(req, res, next) {
    const searchRequest = req.query;

    const headers = req.headers;

    let targetLanguage = headers['targetlanguage'];

    if (targetLanguage === 'en' || !targetLanguage) //default catalog is in english hence not considering this for translation
    {
      targetLanguage = undefined
    }
    const userId = searchRequest.userId
    const wishlistKey = searchRequest.deviceId 
    if (searchRequest.userId) delete searchRequest.userId
    if (searchRequest.deviceId) delete searchRequest.deviceId
    searchService.getItemDetails(searchRequest, targetLanguage).then(async (response) => {
      if (!response || response === null)
        throw new NoRecordFoundError("No result found");
      else {
        let wishlist, wishlist2, wishlistIds = [];
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
          const isWishlisted = wishlistData.find((el) => response?.item_details?.id == el?.item_id && response?.provider_details?.id == el?.provider_id);
          if (isWishlisted) {
            response.wishlistAdded = true;
          }
        }
        res.json(response);
      }
    }).catch((err) => {
      next(err);
    });
  }

  /**
  * get item
  * @param {*} req    HTTP request object
  * @param {*} res    HTTP response object
  * @param {*} next   Callback argument to the middleware function
  * @return {callback}
  */
  getItem(req, res, next) {
    const searchRequest = req.query;
    const { id: itemId } = req.params;


    searchService.getItem(searchRequest, itemId).then(response => {
      if (!response || response === null)
        throw new NoRecordFoundError("No result found");
      else
        res.json(response);
    }).catch((err) => {
      next(err);
    });
  }

  getProvider(req, res, next) {
    const searchRequest = req.query;
    const { itemId } = req.params;

    console.log("get providers*****1*********", { searchRequest, itemId })

    searchService.getProvider(searchRequest, itemId).then(response => {
      if (!response || response === null)
        throw new NoRecordFoundError("No result found");
      else
        res.json(response.response);
    }).catch((err) => {
      next(err);
    });
  }

  getLocation(req, res, next) {
    const searchRequest = req.query;
    const { id: locationId } = req.params;

    console.log({ searchRequest })

    searchService.getLocation(searchRequest, locationId).then(response => {
      if (!response || response === null)
        throw new NoRecordFoundError("No result found");
      else
        res.json(response.response);
    }).catch((err) => {
      next(err);
    });
  }

  getItems(req, res, next) {
    const searchRequest = req.query;

    console.log({ searchRequest })

    console.log({ searchRequest })
    const headers = req.headers;

    let targetLanguage = headers['targetlanguage'];
    console.log({ targetLanguage })
    console.log({ headers })
    if (targetLanguage === 'en' || !targetLanguage) //default catalog is in english hence not considering this for translation
    {
      targetLanguage = undefined
    }
    console.log({ targetLanguage })

    searchService.getItems(searchRequest, targetLanguage).then(response => {
      if (!response || response === null)
        throw new NoRecordFoundError("No result found");
      else
        res.json(response.response);
    }).catch((err) => {
      next(err);
    });
  }

  getLocations(req, res, next) {
    const searchRequest = req.query;

    console.log({ searchRequest })
    const headers = req.headers;

    let targetLanguage = headers['targetlanguage'];
    console.log({ targetLanguage })
    console.log({ headers })
    if (targetLanguage === 'en' || !targetLanguage) //default catalog is in english hence not considering this for translation
    {
      targetLanguage = undefined
    }
    console.log({ targetLanguage })
    searchService.getLocations(searchRequest, targetLanguage).then(response => {
      if (!response || response === null)
        throw new NoRecordFoundError("No result found");
      else
        res.json(response.response);
    }).catch((err) => {
      next(err);
    });
  }

  /**
  * get attribute values
  * @param {*} req    HTTP request object
  * @param {*} res    HTTP response object
  * @param {*} next   Callback argument to the middleware function
  * @return {callback}
  */
  getAttributesValues(req, res, next) {
    const searchRequest = req.query;

    console.log({ searchRequest })

    searchService.getAttributesValues(searchRequest).then(response => {
      if (!response || response === null)
        throw new NoRecordFoundError("No result found");
      else
        res.json(response);
    }).catch((err) => {
      next(err);
    });
  }

  /**
  * get providers
  * @param {*} req    HTTP request object
  * @param {*} res    HTTP response object
  * @param {*} next   Callback argument to the middleware function
  * @return {callback}
  */
  getProviders(req, res, next) {
    const searchRequest = req.query;
    const headers = req.headers;

    let targetLanguage = headers['targetlanguage'];

    if (targetLanguage === 'en' || !targetLanguage) //default catalog is in english hence not considering this for translation
    {
      targetLanguage = undefined
    }
    searchService.getProviders(searchRequest, targetLanguage).then(response => {
      if (!response || response === null)
        throw new NoRecordFoundError("No result found");
      else
        res.json(response);
    }).catch((err) => {
      next(err);
    });
  }

  /**
  * get custom menu
  * @param {*} req    HTTP request object
  * @param {*} res    HTTP response object
  * @param {*} next   Callback argument to the middleware function
  * @return {callback}
  */
  getCustomMenus(req, res, next) {
    const searchRequest = req.query;

    console.log({ searchRequest })

    searchService.getCustomMenus(searchRequest).then(response => {
      if (!response || response === null)
        throw new NoRecordFoundError("No result found");
      else
        res.json(response.response);
    }).catch((err) => {
      next(err);
    });
  }

  /**
  * on search 
  * @param {*} req    HTTP request object
  * @param {*} res    HTTP response object
  * @param {*} next   Callback argument to the middleware function
  * @return {callback}
  */
  onSearch(req, res, next) {
    const { query } = req;
    const { messageId } = query;

    if (messageId) {
      searchService.onSearch(query).then(result => {
        res.json(result);
      }).catch((err) => {
        next(err);
      });
    } else {
      next();
    }
  }

  /**
   * get attributes
   * @param {*} req    HTTP request object
   * @param {*} res    HTTP response object
   * @param {*} next   Callback argument to the middleware function
   * @return {callback}
   */
  getAttributes(req, res, next) {
    const searchRequest = req.query;

    console.log({ searchRequest });

    searchService
      .getAttributes(searchRequest)
      .then((response) => {
        if (!response || response === null) {
          throw new NoRecordFoundError("No result found");
        } else {
          return res.send(response);
        }
      })
      .catch((err) => {
        next(err);
      });
  }

  /**
   * filter
   * @param {*} req    HTTP request object
   * @param {*} res    HTTP response object
   * @param {*} next   Callback argument to the middleware function
   * @return {callback}
   */
  getFilterParams(req, res, next) {
    const { query } = req;
    const { messageId } = query;

    if (messageId) {
      searchService
        .getFilterParams(query)
        .then((result) => {
          res.json(result);
        })
        .catch((err) => {
          next(err);
        });
    } else throw new BadRequestParameterError();
  }


  /**
  * sync Providers
  * @param {*} req    HTTP request object
  * @param {*} res    HTTP response object
  * @param {*} next   Callback argument to the middleware function
  * @return {callback}
  */
  syncProviders(req, res, next) {
    try {
      const apiKey = req.headers['wil-api-key'];

      if (apiKey !== process.env.WIL_API_KEY) {
        return res.status(401).send({ success: false, message: 'Missing or wrong wil-api-key header' });
      }
      const { body } = req;
      const { domain, city } = body;
      const { environment } = req.query;
      const possibleEnvironements = ["staging", "preprod"]

      if (!domain) {
        return res.status(400).send({ success: false, message: 'Missing required field domain' });
      }
      if (!environment) {
        return res.status(400).send({ success: false, message: 'Missing required query params environment' });
      }
      if (!possibleEnvironements.includes(environment)) {
        return res.status(400).send({ success: false, message: 'Environment in query params should be one of possible environments' });
      }

      if (!city || !city?.includes("std:")) {
        return res.status(400).send({ success: false, message: 'Missing or wrong required field city' });
      }

      searchService.syncProviders(body, environment).then(result => {
        res.json(result);
      }).catch((err) => {
        next(err);
      });
    } catch (err) {
      next(err);
    }

  }

}

export default SearchController;
