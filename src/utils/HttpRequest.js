import axios from 'axios';
import logger from './logger';

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
    constructor(baseUrl, url, method = 'get', data = {}, headers = {}, options) {
        this.baseUrl = baseUrl;
        this.url = url;
        this.method = method;
        this.data = data;
        this.headers = headers;
        this.options = options;
    };

    /**
     * Send http request to server to write data to / read data from server
     * axios library provides promise implementation to send request to server
     * Here we are using axios library for requesting a resource
     */
    async send() 
    {
    
        try 
        {
            logger.info(`ONDC API call - ${url} --> ${JSON.stringify(this.data)}`)
            let headers = {
                ...this.headers, 
                ...(this.method.toLowerCase() != "get" && {'Content-Type': 'application/json'})
            };
            
            let result;

            if (this.method.toLowerCase() == 'get') 
            {
                result = await axios({
                    baseURL: this.baseUrl,
                    url: this.url,
                    method: this.method,
                    headers: headers,
                    timeout: 180000, // If the request takes longer than `timeout`, the request will be aborted.
                    params:this.data
                });
            } 
            else 
            {
                // Make server request using axios
                result = await axios({
                    baseURL: this.baseUrl,
                    url: this.url,
                    method: this.method,
                    headers: headers,
                    timeout: 180000, // If the request takes longer than `timeout`, the request will be aborted.
                    data: JSON.stringify(this.data)
                });
            }
            return result;
        } 
        catch (err) 
        {

            if (err.response) {
                // The client was given an error response (5xx, 4xx)
                logger.info(`ONDC API call - ${url} --> ${JSON.stringify(err.response)}`)
                console.log('Error response',err,'\n', err.response);
            } else if (err.request) {
                // The client never received a response, and the request was never left
                console.log('Error request',err,'\n', err.request);
            } else {
                // Anything else
                console.log('Error message',err,'\n', err.message);
            }

            throw err;
        }
    };
}

export default HttpRequest;
