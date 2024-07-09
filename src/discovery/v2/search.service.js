import _ from "lodash";

import { onSearch } from "../../utils/protocolApis/index.js";

import ContextFactory from "../../factories/ContextFactory.js";
import BppSearchService from "./bppSearch.service.js";
import { CITY_CODE } from "../../utils/cityCode.js"
import createPeriod from "date-period";
import translateObject from "../../utils/bhashini/translate.js";
import { OBJECT_TYPE } from "../../utils/constants.js";

import axios from "axios";
import pointInPolygon from 'point-in-polygon';

// import logger from "../lib/logger";
const bppSearchService = new BppSearchService();

class SearchService {

    /**
     *
     * @param {Object} context
     */
    isBppFilterSpecified(context = {}) {
        return typeof context.bpp_id !== "undefined";
    }

    /**
     * search
     * @param {Object} searchRequest
     */
    async search(searchRequest = {}, targetLanguage) {
        try {

            let searchResponses = await bppSearchService.search(
                searchRequest, 'ITEM', targetLanguage
            );
            if (targetLanguage) { //translate data
                return await translateObject(searchResponses, OBJECT_TYPE.ITEM, targetLanguage)
            } else {
                return searchResponses
            }
        } catch (err) {
            throw err;
        }
    }

    async getProvideDetails(searchRequest = {}, targetLanguage) {
        try {

            let searchResponses = await bppSearchService.getProvideDetails(
                searchRequest
            );
            if (targetLanguage) { //translate data
                return await translateObject(searchResponses, OBJECT_TYPE.PROVIDER_DETAILS, targetLanguage)
            } else {
                return searchResponses
            }
        } catch (err) {
            throw err;
        }
    }

    async getLocationDetails(searchRequest = {}, targetLanguage) {
        try {

            let searchResponses = await bppSearchService.getLocationDetails(
                searchRequest
            );
            if (targetLanguage) { //translate data
                return await translateObject(searchResponses, OBJECT_TYPE.LOCATION_DETAILS, targetLanguage)
            } else {
                return searchResponses
            }
        } catch (err) {
            throw err;
        }
    }

    async getItemDetails(searchRequest = {}, targetLanguage) {
        try {

            let searchResponses = await bppSearchService.getItemDetails(
                searchRequest
            );
            if (targetLanguage) { //translate data
                return await translateObject(searchResponses, OBJECT_TYPE.ITEM_DETAILS, targetLanguage)
            } else {
                return searchResponses
            }
        } catch (err) {
            throw err;
        }
    }

    /**
     * getItem
     * @param {Object} searchRequest
     */
    async getItem(searchRequest, itemId) {
        try {

            return await bppSearchService.getItem(
                searchRequest,
                itemId
            );

        } catch (err) {
            throw err;
        }
    }
    async getProvider(searchRequest, brandId) {
        try {

            return await bppSearchService.getProvider(
                searchRequest,
                brandId
            );

        } catch (err) {
            throw err;
        }
    }

    async getLocation(searchRequest, id) {
        try {

            return await bppSearchService.getLocation(
                searchRequest,
                id
            );

        } catch (err) {
            throw err;
        }
    }

    /**
     * getItem
     * @param {Object} searchRequest
     */
    async getAttributes(searchRequest) {
        try {

            return await bppSearchService.getAttributes(
                searchRequest
            );

        } catch (err) {
            throw err;
        }
    }

    async getItems(searchRequest, targetLanguage) {
        try {

            let searchResponses = await bppSearchService.getItems(
                searchRequest
            );

            if (targetLanguage) { //translate data
                return await translateObject(searchResponses, OBJECT_TYPE.CUSTOMMENU_ITEMS, targetLanguage)
            } else {
                return searchResponses
            }

        } catch (err) {
            throw err;
        }
    }

    async getLocations(searchRequest, targetLanguage) {
        try {

            let searchResponses = await bppSearchService.getLocations(
                searchRequest
            );
            if (targetLanguage) { //translate data
                return await translateObject(searchResponses, OBJECT_TYPE.LOCATIONS, targetLanguage)
            } else {
                return searchResponses
            }

        } catch (err) {
            throw err;
        }
    }

    /**
     * getItem
     * @param {Object} searchRequest
     */
    async getAttributesValues(searchRequest) {
        try {

            return await bppSearchService.getAttributesValues(
                searchRequest
            );

        } catch (err) {
            throw err;
        }
    }

    /**
     * get providers
     * @param {Object} searchRequest
     */
    async getProviders(searchRequest, targetLanguage) {
        try {
            let searchResponses = await bppSearchService.getProviders(searchRequest);

            if (targetLanguage) {
                // Translate data if necessary
                searchResponses = await translateObject(searchResponses, OBJECT_TYPE.PROVIDER, targetLanguage);
            }

            // Filter by pincode if provided
            if (searchRequest.pincode) {
                searchResponses = this.filterByPincodeOrPanIndia(searchResponses, searchRequest.userId, searchRequest.pincode);
            }

            return searchResponses;
        } catch (err) {
            throw err;
        }
    }

    calculateDistance(coords1, coords2) {
        const [lon1, lat1] = coords1;
        const [lon2, lat2] = coords2;
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance;
    }

    async getCoordinatesForPincode(pincode) {
        const url = `${process.env.ONDC_BASE_API_URL}/clientApis/v2/map/getCordinates?postcode=${pincode}`;
        try {
            const response = await axios.get(url, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.data.success) {
                return {
                    latitude: response.data.data.latitude,
                    longitude: response.data.data.longitude,
                };
            } else {
                throw new Error('Failed to fetch coordinates');
            }
        } catch (error) {
            throw error;
        }
    }

    async getProviderGPS(userId, providerId) {
        const url = `${process.env.ONDC_BASE_API_URL}/clientApis/v2/search/${userId}?page=1&limit=18&providerIds=${providerId}`;
        try {
            const response = await axios.get(url, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            if (response.data.response.count > 0) {
                const providerData = response.data.response.data[0];
                const gps = providerData.location_details.gps.split(',');
                return {
                    latitude: parseFloat(gps[0]),
                    longitude: parseFloat(gps[1])
                };
            } else {
                throw new Error('Failed to fetch provider GPS coordinates');
            }
        } catch (error) {
            throw error;
        }
    }

    async filterByPincodeOrPanIndia(providers, userId, pincode) {
        const coordinates = await this.getCoordinatesForPincode(pincode);
        if (!coordinates) {
            return [];
        }

        const currentCoords = [coordinates.longitude, coordinates.latitude];

        const filteredProviders = [];

        for (const provider of providers.response.data) {
            let hasPincode = false;
            let isPanIndia = false;
            let isWithinPolygon = false;
            let isWithinRadius = false;

            for (let tag of provider.tags) {
                if (tag.code !== "serviceability") continue;

                for (let item of tag.list) {
                    if (item.code === "unit" && item.value === "pincode") {
                        const valItem = tag.list.find(i => i.code === "val");
                        if (valItem) {
                            const pincodeRanges = valItem.value.split(',').map(range => range.trim());

                            hasPincode = pincodeRanges.some(range => {
                                if (range.includes('-')) {
                                    const [start, end] = range.split('-').map(pc => parseInt(pc.trim()));
                                    return pincode >= start && pincode <= end;
                                }
                                return parseInt(range) === pincode;
                            });
                        }
                    }

                    if (item.code === "type" && item.value === "12") {
                        isPanIndia = true;
                    }

                    if (item.code === "unit" && item.value === "GeoJSON") {
                        const valItem = tag.list.find(i => i.code === "val");
                        if (valItem) {
                            const geoJSONString = valItem.value;
                            const geoJSON = JSON.parse(geoJSONString);

                            if (geoJSON.features && geoJSON.features.length) {
                                isWithinPolygon = geoJSON.features.some(geo => pointInPolygon(currentCoords, geo.geometry.coordinates[0]));
                            }
                        }
                    }

                    if (item.code === "type" && item.value === "10") {
                        const providerGPS = await this.getProviderGPS(userId, providerId);
                        const radiusKm = parseFloat(tag.list.find(i => i.code === "val").value);
                        const distance = this.calculateDistance(currentCoords, [providerGPS.longitude, providerGPS.latitude]);
                        isWithinRadius = distance <= radiusKm;
                    }

                }

                if (hasPincode || isPanIndia || isWithinPolygon || isWithinRadius) {
                    filteredProviders.push(provider);
                    break;
                }
            }
        };

        return filteredProviders;
    }

    /**
     * get custom menus
     * @param {Object} searchRequest
     */
    async getCustomMenus(searchRequest) {
        try {

            return await bppSearchService.getCustomMenus(
                searchRequest
            );

        } catch (err) {
            throw err;
        }
    }

    convertHourMinuteToDate(storeOpenTillDate) {

        let hours = storeOpenTillDate.substring(0, 2)
        let minutes = storeOpenTillDate.substring(2)

        //get hours and minutes from end
        let newDate = new Date().setHours(parseInt(hours), parseInt(minutes), 0)

        return newDate
    }

    validateSchedule(searchObj) {
        console.log("location_id------>", searchObj.id);


        //  console.log(searchObj.location_details);
        //  console.log(searchObj.location_details.time);

        let nowDate = new Date();
        let todayTimeStamp = nowDate.getTime();
        let day = nowDate.getDay();

        if (day === 0) {
            day = 7 //new date.getDate() gives 0 for sunday
        }
        let date = nowDate.getFullYear() + '-' + (nowDate.getMonth() + 1) + '-' + nowDate.getDate();

        if (searchObj.location_details.time) {

            //check for days
            if (searchObj.location_details.time.days) {

                let opendays = searchObj.location_details.time.days.split(",").map(Number);

                console.log("day---->", day)
                if (opendays.indexOf(day) !== -1) {
                    //allowed response
                    console.log("result is valid for the period", opendays)
                } else {
                    console.log("invalid days---->", opendays)
                    return { status: false }
                }
            } else {
                //store is all day open
                console.log("store is all day open")
            }

            //TODO: remove false and add searchObj.location_details.time.range
            if (searchObj.location_details.time.range) {  //check for range

                let storeOpenTillDate = searchObj.location_details.time.range.end

                //get hours and minutes from end

                let newDate = this.convertHourMinuteToDate(storeOpenTillDate);

                storeOpenTillDate = new Date(newDate);

                searchObj.storeOpenTillDate = storeOpenTillDate

                if (todayTimeStamp < storeOpenTillDate.getTime()) {
                    console.log("[Range] store is open")
                    return { status: true, data: searchObj }
                } else {
                    console.log("[Range] store is closed")
                    return { status: false }//TODO: return false
                }

            } else if (searchObj.location_details.time.schedule) {
                if (searchObj.location_details.time.schedule.holidays) {
                    if (date in searchObj.location_details.time.schedule.holidays) {
                        console.log("[Holiday]store is closed today")
                        return { status: false }
                    } else {
                        //allow response
                        console.log("[Holiday]store is open today")
                    }
                } else {
                    //allow response
                    console.log("[Holiday]store is open today")
                }


                if (searchObj.location_details.time.schedule.frequency) {

                    const timeOpen = searchObj.location_details.time.schedule.times
                    let storeOpenTime = null;
                    const firstTime = this.convertHourMinuteToDate(timeOpen[0]);
                    const secondTime = this.convertHourMinuteToDate(timeOpen[1]);

                    if (todayTimeStamp > firstTime || todayTimeStamp < secondTime) {
                        //take first timeStamp
                        storeOpenTime = new Date(firstTime)
                    } else {
                        //take second timestamp
                        storeOpenTime = new Date(secondTime)
                    }

                    let period = createPeriod({ start: storeOpenTime, duration: searchObj.location_details.time.schedule.frequency, recurrence: 1 })

                    let storeOpenTillDate = new Date(period[1]);

                    searchObj.storeOpenTillDate = storeOpenTillDate

                    if (todayTimeStamp < storeOpenTillDate.getTime()) {
                        console.log("[Range] store is open")
                        return { status: true, data: searchObj }
                    } else {
                        console.log("[Range] store is closed")
                        return { status: false }//TODO: return false
                    }
                }

            }

        }



        return { status: true, data: searchObj }

    }

    validateQty(searchObj) {
        console.log("location_id------>", searchObj);

        if (!searchObj.quantity) {
            searchObj.quantity = { available: { count: 0 }, maximum: { count: 0 } }
        }

        return { data: searchObj }

    }

    /**
     * transform search results
     * @param {Array} searchResults
     */
    transform(searchResults = []) {
        let data = [];

        console.log("searchResults---", searchResults)

        searchResults && searchResults.length && searchResults.forEach(result => {
            let searchObj = { ...result };
            // delete searchObj?.["context"];

            let validatedSearchObject = this.validateSchedule(searchObj);


            console.log("validated search object---->", validatedSearchObject)
            if (validatedSearchObject.status === true) {
                let validatedQty = this.validateQty(validatedSearchObject.data)
                data.push({
                    ...validatedSearchObject.data
                });
            }

        });

        return data;
    }

    /**
     * return filtering items
     * @param {Array} searchResults
     */
    getFilter(searchResults = []) {
        let providerList = new Map();
        let categoryList = new Map();
        let fulfillmentList = new Map();
        let minPrice = Infinity;
        let maxPrice = -Infinity;

        searchResults && searchResults.length && searchResults.forEach(result => {

            if (!_.isEmpty(result?.["provider_details"]))
                providerList.set(
                    result?.["provider_details"]?.id,
                    result?.["provider_details"]?.descriptor?.name
                );

            if (!_.isEmpty(result?.["category_details"]))
                categoryList.set(
                    result?.["category_details"]?.id,
                    result?.["category_details"]?.descriptor?.name
                );

            if (!_.isEmpty(result?.["fulfillment_details"]))
                fulfillmentList.set(
                    result?.["fulfillment_details"]?.id,
                    result?.["fulfillment_details"]
                );

            const value = parseFloat(result?.price?.value);
            if (maxPrice < value)
                maxPrice = value;

            if (minPrice > value)
                minPrice = value;
        });

        return { categoryList, fulfillmentList, minPrice, maxPrice, providerList };
    }

    /**
     * on search
     * @param {Object} queryParams
     */
    async onSearch(queryParams) {
        try {
            const { messageId } = queryParams;

            const protocolSearchResponse = await onSearch(queryParams);
            const searchResult = this.transform(protocolSearchResponse?.data);

            //console.log("protocolSearchResponse--------------------->",protocolSearchResponse.data[0].context)
            const contextFactory = new ContextFactory();
            const context = contextFactory.create({
                messageId: messageId
            });

            return {
                context,
                message: {
                    catalogs: [...searchResult],
                    count: protocolSearchResponse?.count
                },
            };
        } catch (err) {
            throw err;
        }
    }

    /**
     * get filter params
     * @param {String} query
     */
    async getFilterParams(query) {
        try {
            const protocolSearchResponse = await onSearch(query);

            const {
                categoryList = {},
                fulfillmentList = {},
                minPrice,
                maxPrice,
                providerList = {}
            } = this.getFilter(protocolSearchResponse?.data);

            return {
                categories: Array.from(categoryList, ([id, name]) => ({ id, name })),
                fulfillment: Array.from(fulfillmentList, ([id, value]) => ({ id, value })),
                minPrice: minPrice,
                maxPrice: maxPrice,
                providers: Array.from(providerList, ([id, name]) => ({ id, name })),
            };
        } catch (err) {
            throw err;
        }
    }


    /**
     * sync providers
     * @param {Object} payload
     */
    async syncProviders(payload, environment) {
        try {
            const contextFactory = new ContextFactory();
            const context = contextFactory.create({
                city: payload.city,
                domain: payload.domain
            });
            const searchPayload = {
                context,
                message: {
                    intent: {
                        fulfillment: {
                            type: "Delivery"
                        },
                        payment: {
                            "@ondc/org/buyer_app_finder_fee_type": "percent",
                            "@ondc/org/buyer_app_finder_fee_amount": process.env.BAP_FINDER_FEE_AMOUNT
                        }
                    }
                }
            }
            let searchResponses = await bppSearchService.syncProviders(searchPayload, environment);
            return searchResponses

        } catch (err) {
            throw err;
        }
    }
}

export default SearchService;
