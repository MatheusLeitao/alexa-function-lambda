'use strict';

const axios = require('axios');

/**
 * Helper class to generate an KokarResponse.
 * @class
 */
class KokarResponse {

    /**
     * Constructor for an Kokar Response.
     * @constructor
     * @param opts Contains initialization options for the response
     */
    constructor(opts) {
        this.event = opts;
    }

    /**
     * Method of get serial with Oka.
     * @getSerial
     */
    async getSerial() {

        let serial = '';

        let token = await this.decodeToken();

        let email = token.email;

        await this.sendToApiKokar({method: 'POST', url: `/getSerial`, data: {email: email}}).then((result) => {
            serial = result.serial;
        }).catch(err => console.log('ERROR GET SERIAL', err));

        if (process.env.LOGGER_KOKAR === "true") {
            console.log(`GET SERIAL `, JSON.stringify({
                token: token,
                email: email,
                response: serial
            }));
        }

        return serial;
    };

    /**
     * Method of decode token and return serial.
     * @decodeToken
     */
    async decodeToken() {

        let response = {
            token: this.getToken(),
            user_id: '',
            name: '',
            email: ''
        };

        await this.sendToApiKokar({
            method: 'GET',
            url: `/user/profile?access_token=${response.token}`
        }, '', 'https://api.amazon.com').then((result) => {
            response = Object.assign({}, response, result);
        }).catch(err => console.log('ERROR DECODE TOKEN', err));

        if (process.env.LOGGER_KOKAR === "true") {
            console.log(`DECODE TOKEN `, JSON.stringify({
                token: response.token,
                response: typeof response !== 'string' ? JSON.stringify(response) : response
            }));
        }

        return response;
    }

    /**
     * Method for get residence with Oka.
     * @getResidence
     */
    async getResidence() {

        let serial = await this.getSerial();
        let result = [];
        await this.sendToApiKokar({method: 'GET', url: `/structure/${serial}`}, serial).then((response) => {
            result = response;
        }).catch(err => console.log('ERROR GET RESIDENCE', err));

        if (process.env.LOGGER_KOKAR === "true") {
            console.log(`GET RESIDENCE WITH ${serial}:`, JSON.stringify({
                serial: serial,
                response: result.length > 0 ? 'Residência retornada' : 'Residência não retornada'
            }));
        }

        return result;
    }

    /**
     * Method for get token with Alexa.
     * @getToken
     */
    getToken() {
        if (this.event.hasOwnProperty('endpoint')) {
            return this.event.endpoint.scope.token;
        } else if (this.event.hasOwnProperty('payload')) {
            return this.event.payload.scope.token;
        }
    }

    /**
     * Method for call action with light or scene.
     * @execute
     * @param endpointId
     * @param controller
     * @param serial
     */
    async execute(endpointId, controller, serial) {
        let data = {serial: serial, endpointId: endpointId, controller: controller};

        if (controller.indexOf('SetBrightness') !== -1) {
            let controllerSplit = controller.split('|');
            data.controller = controllerSplit[0];
            data.brightness = controllerSplit[1];
        }

        let result = {};
        await this.sendToApiKokar({method: 'POST', url: `/execution`, data: data}, serial).then((response) => {
            result = response;
        }).catch(err => console.log('ERROR EXECUTE', err));

        if (process.env.LOGGER_KOKAR === "true") {
            console.log(`EXECUTE ACTION ${controller} ON ${serial}:`, JSON.stringify({
                serial: serial,
                endpointId: endpointId,
                controller: controller,
                response: result
            }));
        }

        return result;

    }

    /**
     * Method for get state of light with Oka.
     * @getState
     * @param endpointId
     * @param serial
     */
    async getState(endpointId, serial) {
        let result = {};
        await this.sendToApiKokar({method: 'GET', url: `/state/${serial}/${endpointId}`}, serial).then((response) => {
            result = response;
        }).catch(err => console.log('ERROR GET STATE', err));

        if (process.env.LOGGER_KOKAR === "true") {
            console.log(`GET SERIAL TO ${serial}:`, JSON.stringify({
                serial: serial,
                endpointId: endpointId,
                response: result,
            }));
        }

        return result;

    }

    /**
     * Method for check serial of Oka is tester or not.
     * @checkSerial
     * @param serial
     */
    async checkSerial(serial) {

        serial = serial.toLowerCase();
        let result = false;

        await axios.get(`${process.env.URL_AUTHORIZE_SERIAL}/serial/${serial}`).then((body) => {

            if (body.data.length > 0) {
                if (process.env.LOGGER_KOKAR === "true") {
                    console.log(`SUCCESS RESPONSE CHECK SERIAL:`, JSON.stringify({
                        serial: serial,
                        response: typeof body.data === "string" ? body.data : JSON.stringify(body.data),
                    }));
                }

                if (body.data[0].serial === serial && body.data[0].hasOwnProperty('tester')) {
                    result = body.data[0].tester;
                }
            }

        }).catch((error) => {
            console.error(`ERROR RESPONSE CHECK SERIAL:`, error);
        });

        return result;

    }

    /**
     * Generic Method for Send Messages to API Kokar.
     * @sendToApiKokar
     * @param data Contains definitions such as method, url and parameters to be sent
     * @param serial Can be set or not, depends on what will be requested
     * @param customLink Can be set or not, depends on what will be requested
     */
    async sendToApiKokar(data, serial = '', customLink = '') {

        let link = `${process.env.URL_PROD}`;
        // if (serial !== "") {
            // let tester = await this.checkSerial(serial);
            // let tester = false;
            // if (tester === true || tester === "true") {
            //     link = `${process.env.URL_DEV}`;
            // }
        // }

        if (customLink !== '') {
            link = customLink;
        }

        if (process.env.LOGGER_KOKAR === "true") {
            console.log(`SEND TO API KOKAR:`, JSON.stringify({serial: serial, url: link, data: JSON.stringify(data)}));
        }

        return new Promise(async (resolve, reject) => {

            if (data.method === 'GET') {

                await axios.get(`${link}${data.url}`).then((body) => {

                    if (process.env.LOGGER_KOKAR === "true") {
                        console.log(`SUCCESS RESPONSE API KOKAR:`, JSON.stringify({
                            serial: serial,
                            url: link,
                            request: JSON.stringify(data),
                            response: typeof body.data === "string" ? body.data : JSON.stringify(body.data),
                        }));
                    }

                    resolve(body.data);

                }).catch((error) => {

                    console.error(`ERROR RESPONSE API KOKAR:`, JSON.stringify({
                        serial: serial,
                        url: link,
                        request: JSON.stringify(data),
                        error: error
                    }));

                    reject(error);
                });

            } else if (data.method === 'POST') {

                await axios.post(`${link}${data.url}`, data.data).then((body) => {

                    if (process.env.LOGGER_KOKAR === "true") {
                        console.log(`SUCCESS RESPONSE API KOKAR:`, JSON.stringify({
                            serial: serial,
                            url: link,
                            request: JSON.stringify(data),
                            response: typeof body.data === "string" ? body.data : JSON.stringify(body.data),
                        }));
                    }

                    resolve(body.data);

                }).catch((error) => {

                    console.error(`ERROR RESPONSE API KOKAR:`, JSON.stringify({
                        serial: serial,
                        url: link,
                        request: JSON.stringify(data),
                        error: error
                    }));

                    reject(error);

                });

            }

        });

    }

}

module.exports = KokarResponse;
