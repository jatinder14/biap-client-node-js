import fetch from 'node-fetch';

import HttpRequest from "../HttpRequest.js";
import PROTOCOL_API_URLS from "./routes.js";
import logger from '../../utils/logger.js';

/**
 * order confirm
 * @param {Object} data 
 * @returns 
 */
const
    protocolConfirm = async (data) => {
        try {
            const apiCall = new HttpRequest(
                process.env.PROTOCOL_BASE_URL,
                PROTOCOL_API_URLS.CONFIRM,
                "POST",
                {
                    ...data
                }
            );

            const result = await apiCall.send();
            return result.data;
        } catch (err) {
            if (err?.response?.data) {
                throw err?.response?.data;
            } else {
                throw err
            }
        }
    }

const protocolGetDumps = async (data) => {
    try {
        const apiCall = new HttpRequest(
            process.env.PROTOCOL_BASE_URL,
            PROTOCOL_API_URLS.DUMP,
            "GET",
            {
                ...data
            }
        );

        const result = await apiCall.send();
        return result.data;
    } catch (err) {
        if (err?.response?.data) {
            throw err?.response?.data;
        } else {
            throw err
        }
    }
}

/**
 * on confirm order
 * @param {String} messageId 
 */
const onOrderConfirm = async (messageId) => {
    try {
        const apiCall = new HttpRequest(
            process.env.PROTOCOL_BASE_URL,
            PROTOCOL_API_URLS.RESPONSE,
            "get",
            { requestType: 'on_confirm', messageId: messageId }
        );

        const result = await apiCall.send();
        logger.info(`ONDC API call - on_confirm --> ${JSON.stringify(result.data)}`)
        return result.data;
    } catch (err) {
        if (err?.response?.data) {
            throw err?.response?.data;
        } else {
            throw err
        }
    }
};

/**
 * order cancel
 * @param {Object} data 
 * @returns 
 */
const protocolCancel = async (data) => {
    try {
        const apiCall = new HttpRequest(
            process.env.PROTOCOL_BASE_URL,
            PROTOCOL_API_URLS.CANCEL,
            "POST",
            {
                ...data
            }
        );

        const result = await apiCall.send();
        return result.data;
    } catch (err) {
        if (err?.response?.data) {
            throw err?.response?.data;
        } else {
            throw err
        }
    }
}

/**
 * on cancel order
 * @param {String} messageId 
 */
const onOrderCancel = async (messageId) => {
    try {
        const apiCall = new HttpRequest(
            process.env.PROTOCOL_BASE_URL,
            PROTOCOL_API_URLS.RESPONSE,
            "get",
            { requestType: 'on_cancel', messageId: messageId }
        );

        const result = await apiCall.send();
        logger.info(`ONDC API call - on_cancel --> ${JSON.stringify(result.data)}`)
        return result.data;
    } catch (err) {
        if (err?.response?.data) {
            throw err?.response?.data;
        } else {
            throw err
        }
    }
};

/**
 * init order
 * @param {Object} data 
 * @returns 
 */
const protocolInit = async (data) => {
    try {
        const apiCall = new HttpRequest(
            process.env.PROTOCOL_BASE_URL,
            PROTOCOL_API_URLS.INIT,
            "POST",
            {
                ...data
            }
        );

        const result = await apiCall.send();
        return result.data;
    } catch (err) {
        if (err?.response?.data) {
            throw err?.response?.data;
        } else {
            throw err
        }
    }
}

/**
 * on init order
 * @param {String} messageId 
 */
const onOrderInit = async (messageId) => {
    try {
        const apiCall = new HttpRequest(
            process.env.PROTOCOL_BASE_URL,
            PROTOCOL_API_URLS.RESPONSE,
            "get",
            { requestType: 'on_init', messageId: messageId }
        );

        const result = await apiCall.send();
        logger.info(`ONDC API call - on_init --> ${JSON.stringify(result.data)}`)
        return result.data;
    } catch (err) {
        if (err?.response?.data) {
            throw err?.response?.data;
        } else {
            throw err
        }
    }
};

/**
 * search
 * @param {Object} data 
 * @returns 
 */
const protocolSearch = async (data) => {
    try {
        const apiCall = new HttpRequest(
            process.env.PROTOCOL_BASE_URL,
            PROTOCOL_API_URLS.SEARCH,
            "POST",
            {
                ...data
            },

        );

        const result = await apiCall.send();

        return result.data;
    } catch (err) {
        if (err?.response?.data) {
            throw err?.response?.data;
        } else {
            throw err
        }
    }
}

/**
 * search items
 * @param {Object} data
 * @returns
 */
const protocolSearchItems = async (data) => {
    try {
        const apiCall = new HttpRequest(
            process.env.PROTOCOL_BASE_URL,
            PROTOCOL_API_URLS.SEARCH_ITEM,
            "GET",
            {
                ...data
            }
        );

        const result = await apiCall.send();
        // logger.info(`ONDC API call - search --> ${JSON.stringify(result.data)}`)
        return result.data;
    } catch (err) {
        if (err?.response?.data) {
            throw err?.response?.data;
        } else {
            throw err
        }
    }
}

const protocolProvideDetails = async (data) => {
    try {
        const apiCall = new HttpRequest(
            process.env.PROTOCOL_BASE_URL,
            PROTOCOL_API_URLS.PROVIDER_DETAILS,
            "GET",
            {
                ...data
            }
        );

        const result = await apiCall.send();

        return result.data;
    } catch (err) {
        if (err?.response?.data) {
            throw err?.response?.data;
        } else {
            throw err
        }
    }
}

/**
 * search items
 * @param {Object} data
 * @returns
 */
const protocolGetItems = async (searchRequest, itemId) => {
    try {
        const apiCall = new HttpRequest(
            process.env.PROTOCOL_BASE_URL,
            PROTOCOL_API_URLS.SEARCH_ITEM + "/" + itemId,
            "GET",
            {
                ...searchRequest
            }
        );

        const result = await apiCall.send();

        return result.data;
    } catch (err) {
        if (err?.response?.data) {
            throw err?.response?.data;
        } else {
            throw err
        }
    }
}

const protocolGetItemList = async (searchRequest) => {
    try {
        const apiCall = new HttpRequest(
            process.env.PROTOCOL_BASE_URL,
            PROTOCOL_API_URLS.SEARCH_ITEM,
            "GET",
            {
                ...searchRequest
            }
        );

        const result = await apiCall.send();

        return result.data;
    } catch (err) {
        if (err?.response?.data) {
            throw err?.response?.data;
        } else {
            throw err
        }
    }
}

const protocolGetAttributes = async (searchRequest) => {
    try {
        const apiCall = new HttpRequest(
            process.env.PROTOCOL_BASE_URL,
            PROTOCOL_API_URLS.SEARCH_ATTRIBUTE,
            "GET",
            {
                ...searchRequest
            }
        );

        const result = await apiCall.send();

        return result.data;
    } catch (err) {
        if (err?.response?.data) {
            throw err?.response?.data;
        } else {
            throw err
        }
    }
}

const protocolGetAttributesValues = async (searchRequest) => {
    try {
        const apiCall = new HttpRequest(
            process.env.PROTOCOL_BASE_URL,
            PROTOCOL_API_URLS.SEARCH_ATTRIBUTE_VALUE,
            "GET",
            {
                ...searchRequest
            }
        );

        const result = await apiCall.send();

        return result.data;
    } catch (err) {
        if (err?.response?.data) {
            throw err?.response?.data;
        } else {
            throw err
        }
    }
}

const protocolGetCustomMenus = async (searchRequest) => {
    try {
        const apiCall = new HttpRequest(
            process.env.PROTOCOL_BASE_URL,
            PROTOCOL_API_URLS.CUSTOM_MENU,
            "GET",
            {
                ...searchRequest
            }
        );

        const result = await apiCall.send();

        return result.data;
    } catch (err) {
        if (err?.response?.data) {
            throw err?.response?.data;
        } else {
            throw err
        }
    }
}

const protocolGetProviders = async (searchRequest) => {
    try {
        const apiCall = new HttpRequest(
            process.env.PROTOCOL_BASE_URL,
            PROTOCOL_API_URLS.PROVIDERS,
            "GET",
            {
                ...searchRequest
            }
        );

        const result = await apiCall.send();

        return result.data;
    } catch (err) {
        if (err?.response?.data) {
            throw err?.response?.data;
        } else {
            throw err
        }
    }
}

const protocolGetProvider = async (searchRequest, brandId) => {
    try {
        const apiCall = new HttpRequest(
            process.env.PROTOCOL_BASE_URL,
            PROTOCOL_API_URLS.PROVIDERS + "/" + brandId,
            "GET",
            {
                ...searchRequest
            }
        );

        const result = await apiCall.send();

        return result.data;
    } catch (err) {
        if (err?.response?.data) {
            throw err?.response?.data;
        } else {
            throw err
        }
    }
}

const protocolGetLocation = async (searchRequest, id) => {
    try {
        const apiCall = new HttpRequest(
            process.env.PROTOCOL_BASE_URL,
            PROTOCOL_API_URLS.LOCATIONS + "/" + id,
            "GET",
            {
                ...searchRequest
            }
        );

        const result = await apiCall.send();

        return result.data;
    } catch (err) {
        if (err?.response?.data) {
            throw err?.response?.data;
        } else {
            throw err
        }
    }
}

const protocolGetLocations = async (searchRequest) => {
    try {
        const apiCall = new HttpRequest(
            process.env.PROTOCOL_BASE_URL,
            PROTOCOL_API_URLS.LOCATIONS,
            "GET",
            {
                ...searchRequest
            }
        );

        const result = await apiCall.send();

        return result.data;
    } catch (err) {
        if (err?.response?.data) {
            throw err?.response?.data;
        } else {
            throw err
        }
    }
}

const protocolGetLocationDetails = async (searchRequest) => {
    try {
        const apiCall = new HttpRequest(
            process.env.PROTOCOL_BASE_URL,
            PROTOCOL_API_URLS.LOCATIONS_DETAILS,
            "GET",
            {
                ...searchRequest
            }
        );

        const result = await apiCall.send();

        return result.data;
    } catch (err) {
        if (err?.response?.data) {
            throw err?.response?.data;
        } else {
            throw err
        }
    }
}

const protocolGetItemDetails = async (searchRequest) => {
    try {
        const apiCall = new HttpRequest(
            process.env.PROTOCOL_BASE_URL,
            PROTOCOL_API_URLS.SEARCH_ITEM_DETAILS,
            "GET",
            {
                ...searchRequest
            }
        );

        const result = await apiCall.send();

        return result.data;
    } catch (err) {
        if (err?.response?.data) {
            throw err?.response?.data;
        } else {
            throw err
        }
    }
}

/**
 * on search products
 * @param {Object} query 
 */
const onSearch = async (query) => {
    try {
        const queryString = Object.keys(query).map(key => {
            if (typeof key !== "undefined" && typeof query[key] !== "undefined")
                return encodeURIComponent(key) + '=' + encodeURIComponent(query[key]);
        }).join('&');

        const apiCall = await fetch(
            process.env.PROTOCOL_BASE_URL
            + "/" +
            PROTOCOL_API_URLS.ON_SEARCH + "?" + queryString
        );

        const result = await apiCall.json();
        // logger.info(`ONDC API call - on_search --> ${JSON.stringify(result)}`)
        return result;
    } catch (err) {
        if (err?.response?.data) {
            throw err?.response?.data;
        } else {
            throw err
        }
    }
};

/**
 * track order
 * @param {Object} data 
 * @returns 
 */
const protocolTrack = async (data) => {
    try {
        const apiCall = new HttpRequest(
            process.env.PROTOCOL_BASE_URL,
            PROTOCOL_API_URLS.TRACK,
            "POST",
            {
                ...data
            }
        );

        const result = await apiCall.send();
        return result.data;
    } catch (err) {
        if (err?.response?.data) {
            throw err?.response?.data;
        } else {
            throw err
        }
    }
}

/**
 * on track order
 * @param {String} messageId 
 */
const onOrderTrack = async (messageId) => {
    try {
        const apiCall = new HttpRequest(
            process.env.PROTOCOL_BASE_URL,
            PROTOCOL_API_URLS.RESPONSE,
            "get",
            { requestType: 'on_track', messageId: messageId }
        );

        const result = await apiCall.send();
        return result.data;
    } catch (err) {
        if (err?.response?.data) {
            throw err?.response?.data;
        } else {
            throw err
        }
    }
};

/**
 * order support
 * @param {Object} data 
 * @returns 
 */
const protocolSupport = async (data) => {
    try {
        const apiCall = new HttpRequest(
            process.env.PROTOCOL_BASE_URL,
            PROTOCOL_API_URLS.SUPPORT,
            "POST",
            {
                ...data
            }
        );

        const result = await apiCall.send();
        return result.data;
    } catch (err) {
        if (err?.response?.data) {
            throw err?.response?.data;
        } else {
            throw err
        }
    }
}

/**
 * on support
 * @param {String} messageId 
 */
const onOrderSupport = async (messageId) => {
    try {
        const apiCall = new HttpRequest(
            process.env.PROTOCOL_BASE_URL,
            PROTOCOL_API_URLS.ON_SUPPORT + "?messageId=" + messageId,
            "get",
        );

        const result = await apiCall.send();
        return result.data;
    } catch (err) {
        if (err?.response?.data) {
            throw err?.response?.data;
        } else {
            throw err
        }
    }
};

/**
 * order status
 * @param {Object} data 
 * @returns 
 */
const protocolOrderStatus = async (data) => {
    try {
        const apiCall = new HttpRequest(
            process.env.PROTOCOL_BASE_URL,
            PROTOCOL_API_URLS.STATUS,
            "POST",
            {
                ...data
            }
        );

        const result = await apiCall.send();
        return result.data;
    } catch (err) {
        if (err?.response?.data) {
            throw err?.response?.data;
        } else {
            throw err
        }
    }
}

/**
 * on order status
 * @param {String} messageId 
 */
const onOrderStatus = async (messageId) => {
    try {
        const apiCall = new HttpRequest(
            process.env.PROTOCOL_BASE_URL,
            PROTOCOL_API_URLS.RESPONSE,
            "get",
            { requestType: 'on_status', messageId: messageId }
        );

        const result = await apiCall.send();
        logger.info(`ONDC API call - on_status --> ${JSON.stringify(result.data)}`)
        return result.data;
    } catch (err) {
        if (err?.response?.data) {
            throw err?.response?.data;
        } else {
            throw err
        }
    }
};

/**
 * on order status
 * @param {String} messageId
 */
const protocolUpdate = async (data) => {
    try {
        const apiCall = new HttpRequest(
            process.env.PROTOCOL_BASE_URL,
            PROTOCOL_API_URLS.UPDATE,
            "POST",
            {
                ...data
            }
        );

        const result = await apiCall.send();
        return result.data;
    } catch (err) {
        if (err?.response?.data) {
            throw err?.response?.data;
        } else {
            throw err
        }
    }
};

/**
 * on order update status
 * @param {String} messageId
 */
const onUpdateStatus = async (messageId) => {
    try {
        const apiCall = new HttpRequest(
            process.env.PROTOCOL_BASE_URL,
            PROTOCOL_API_URLS.RESPONSE,
            "get",
            { requestType: 'on_update', messageId: messageId }
        );

        const result = await apiCall.send();
        logger.info(`ONDC API call verification purpose - on_update --> ${JSON.stringify(result.data)}`)
        return result.data;
    } catch (err) {
        if (err?.response?.data) {
            throw err?.response?.data;
        } else {
            throw err
        }
    }
};

/**
 * quote order
 * @param {Object} data 
 * @returns 
 */
const protocolSelect = async (data) => {
    try {
        const apiCall = new HttpRequest(
            process.env.PROTOCOL_BASE_URL,
            PROTOCOL_API_URLS.SELECT,
            "POST",
            {
                ...data
            }
        );

        const result = await apiCall.send();
        return result.data;
    } catch (err) {
        if (err?.response?.data) {
            throw err?.response?.data;
        } else {
            throw err
        }
    }
}

/**
 * on quote order
 * @param {String} messageId 
 */
const onOrderSelect = async (messageId) => {
    try {
        const apiCall = new HttpRequest(
            process.env.PROTOCOL_BASE_URL,
            PROTOCOL_API_URLS.RESPONSE,
            "get",
            { requestType: 'on_select', messageId: messageId }
        );

        const result = await apiCall.send();
        logger.info(`ONDC API call - on_select --> ${JSON.stringify(result.data)}`)
        return result.data;
    } catch (err) {
        if (err?.response?.data) {
            throw err?.response?.data;
        } else {
            throw err
        }
    }
};


/**
 * search
 * @param {Object} data 
 * @returns 
 */
const syncProvider = async (data, environment) => {
    try {
        const apiCall = new HttpRequest(
            `https://witslab-bpp-${environment}.thewitslab.com`,
            "api/v2/search",
            "POST",
            { ...data }
        );

        const result = await apiCall.send();
        return result.data;
    } catch (err) {
        if (err?.response?.data) {
            throw err.response.data;
        } else {
            throw err;
        }
    }
};

export {
    onOrderCancel,
    onOrderConfirm,
    onOrderInit,
    onSearch,
    onOrderStatus,
    onOrderSupport,
    onOrderTrack,
    onOrderSelect,
    protocolCancel,
    protocolConfirm,
    protocolInit,
    protocolSearch,
    protocolOrderStatus,
    protocolSupport,
    protocolTrack,
    protocolSelect,
    protocolUpdate,
    onUpdateStatus,
    protocolSearchItems,
    protocolGetItems,
    protocolGetAttributes,
    protocolGetAttributesValues,
    protocolGetProviders,
    protocolGetCustomMenus,
    protocolGetProvider,
    protocolGetLocation,
    protocolGetItemList,
    protocolGetLocations,
    protocolGetLocationDetails,
    protocolGetDumps,
    protocolProvideDetails,
    protocolGetItemDetails,
    syncProvider
};
