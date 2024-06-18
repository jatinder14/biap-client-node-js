import got from 'got';
import logger from './logger.js';

/**
 * Used to communicate with server
 */
class HttpRequest {

    /**
     * @param {*} baseUrl Base URL(domain url)
     * @param {*} url Resource URL
     * @param {*} method HTTP method(GET | POST | PUT | PATCH | DELETE)
     * @param {*} headers HTTP request headers
     * @param {*} data HTTP request data (If applicable)
     * @param {*} options other params
     */
    constructor(baseUrl, url, method = 'get', data = {}, headers = {}, options = {}) {
        this.baseUrl = baseUrl;
        this.url = url;
        this.method = method.toLowerCase();
        this.data = data;
        this.headers = headers;
        this.options = options;
    };

    /**
     * Send http request to server to write data to / read data from server
     * got library provides promise implementation to send request to server
     * Here we are using got library for requesting a resource
     */
    async send() {
        try {
            logger.info(`ONDC API call inside try- ${this.url} --> ${JSON.stringify(this.data)}`);
            let headers = {
                ...this.headers, 
                ...(this.method.toLowerCase() != "get" && {'Content-Type': 'application/json'})
            };
            const options = {
                prefixUrl: this.baseUrl,
                url: this.url,
                method: this.method,
                headers: headers,
                timeout: { request: 180000 },
                responseType: 'json',
                ...(this.method === 'get' ? { searchParams: this.data } : { json: this.data }),
                ...this.options
            };

            // Make server request using got
            const result = await got(options);

            return { data: result.body };
        } catch (err) {
            if (err.response) {
                // The client was given an error response (5xx, 4xx)
                console.log("1 -----------------------", err.response.body);
                logger.info(`ONDC API call inside catch err.response - ${this.url} --> ${err.response.body}`);
                throw err.response?.body;
            } else if (err.request) {
                // The client never received a response, and the request was never left
                console.log("2 -----------------------", err.request);
                logger.info(`ONDC API call inside catch err.request - ${this.url} --> ${err.request}`);
                throw err
            } else {
                // Anything else
                console.log("2 -----------------------", err?.message);
                logger.info(`ONDC API call inside catch err - ${this.url} --> ${err?.message}`);
                throw err
            }
        }
    }
}

export default HttpRequest;
