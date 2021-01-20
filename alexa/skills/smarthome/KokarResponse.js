'use strict';

const axios = require('axios');
const link = 'https://kokarserver.ddns.me';
/**
 * Helper class to generate an KokarResponse.
 * @class
 */
class KokarResponse {

    async verifyToken() {

        const amznProfileUrl = `https://api.amazon.com/user/profile?access_token=${this.getToken}`;
        let responseAxios = await axios.get(amznProfileUrl);

        try {
            return new Promise(async (resolve, reject) => {

                responseAxios.data.serial = {};

                if (responseAxios.data.email) {

                    await axios.post(`${link}/getSerial`, {email: responseAxios.data.email}).then((serial) => {
                        responseAxios.data.serial = serial.data.serial;
                        this.serial = serial.data.serial;
                    }).catch((err) => {
                        responseAxios.data.serial = {error: err};
                    });

                    resolve({status: 'success', data: responseAxios.data});
                } else {
                    reject({status: 'error', data: {message: 'Erro ao buscar o Serial da Oka.'}});
                }
            });
        } catch (error) {
            return {status: 'error', data: error};
        }
    }

    async getResidence(serial) {

        console.log('GET RESIDENCE serial', serial);
        console.log('GET RESIDENCE this.serial', this.serial);

        let result = [];
        await axios.get(`${link}/structure/${serial}`).then(async (residence) => {
            // responseAxios.data.serial = typeof serial === 'string' ? JSON.parse(serial) : serial;
            result = await residence;
            console.log('RESIDENCE GET RESIDENCE FUNCTION ', JSON.stringify(result));
        }).catch((err) => {
            // responseAxios.data.serial = {error: err};
            console.log('RESIDENCE ERROR GET RESIDENCE FUNCTION ', JSON.stringify(err));
        });

        return result;
    }

    /**
     * Check a value for validity or return a default.
     * @param value The value being checked
     * @param defaultValue A default value if the passed value is not valid
     * @returns {*} The passed value if valid otherwise the default value.
     */
    /*checkValue(value, defaultValue) {

        if (value === undefined || value === {} || value === "")
            return defaultValue;

        return value;
    }*/

    get getToken() {
        return this.event.directive.payload.scope.token;
    }

    async execute(payload) {

        console.log('EXECUTE RECEIVE', JSON.stringify(payload));

        /*payload = {
            "directive": {
                "header": {
                    "namespace": "Alexa.PowerController",
                    "name": "TurnOn",
                    "payloadVersion": "3",
                    "messageId": "e0cc6823-2c13-438b-a782-ee13359ebcec",
                    "correlationToken": "AAAAAAAAAAAmIE6UAgYSUL9T+Abf9NR1DAIAAAAAAAANS4/9ZC9ml+p9u8U4jdxyEJNXPFlXyy6bQAGqtTu0iRaP7HG+aBiUpjpyMzUuG5AjFhnF+z0sQXMy0sLvDsplVuZ1eWXUT6G9mi73Ci5zO87Q40ZG1u06/lwVZ7PJmXDQlbgxMT/lbxVPI9UgOsaOgyQXYl1w7bvs5lUTaMkla9yyRc1bcipGT9W3DprZc4jRuR68u+0gmVN4IQspbWiQaYgWjd3JDfxZXumErB6W3HLEyeeLew0YkHavSeO3UsIQ6h7mT2wltKBPd+ZOtjy/LbfzuM3MiyQLMuXafLSv/IBQrFee446GBjTSLg52LFoHKzSTljOjsHibpxAlWMZB1moz0Udy+qZBJDO6XADGcWQLl2UqPbPiw1yuEUVHNKvELX4RmUWvELDBTXhbUP9ouuSFHZYKs//KRs4YF2FZQeE5pIbUf/fP7WeBq3wwHRxWGGjh9MlgjHr/9+IrSP35LN3YxOo+tZ2E6MDngQP4O8rd53+EzmTE8bnLIoHAGwt9UaJoSg4EPUu6RsxglOo8UTi8/JElXFAHOW37v4GlDlOVb3jO3dsSMMbMYKu9jJsEqeNwedNtMY6bvT9kK8byYms7+7a2zbdznMd9Jt+Evmi3YDPaNDoyS6VufyLoO+ubhzk2P9gROvzUsPYRCGTNMXE9rYIntQ2LzyTvii9t5JwSImcL+0R3zjKfCg=="
                },
                "endpoint": {
                    "scope": {
                        "type": "BearerToken",
                        "token": "Atza|IwEBIGpCNuVQ6qwfplMlp4gATE0gaKNlf_bRrtLH4OTslpKPKtV-xCImHxQIXEbB1bVskmU13NkBChbkx9qLl2C9HSrd5wMgtvfZZPYn2tltjwO-tMcGApmp9h0p48hUhWEgTebMcV2LQXWu0FeBZziBTVOFE2oycffexj9UXdhkSXbHJNIu3pI0qPnkTz1Tr_H0lZ5agPxtvqWpZhDx8g8VqgN4tBBFwwuMRUjKwfMJrq9VlID1dWED5inkea4gco6BgeXzeAXaFElNT3LA0_nXzMkjJ2wmEyc8sFPLwDgkZD4W-vegmApHD0ZaDJlLm9oQ-YPw7z3HX7e6HZFtpGQsJYEjmBfJjh4CGmo7YQkv_pI5SBw7igm1VwDlOeVYnZUXeeTg2y9T6sFk20ACrkWB5d_oG7VYCihYIYLnsYUxwUji7X-aEAolYIwe_ZGEsrHGm_7u-LnKDR2h8tMwkO7bxY-0qT6vfkbyC2gFpGaKSvwNkTlP5J3emteVtitu2QTUtMLGGldtbewXgFTgc-uYGzGs"
                    },
                    "endpointId": "935249",
                    "cookie": {}
                },
                "payload": {}
            }
        };*/

        payload = {
            serial: this.verifyToken.serial,
            endpointId: payload.directive.endpoint.endpointId,
            name: payload.directive.header.name,
            namespace: payload.directive.header.namespace,
            payload: payload.directive.payload,
            token: payload.directive.endpoint.scope.token
        };
        let result = '';

        await axios.post(`${link}/execution`, {data: payload}).then((responseExecute) => {
            console.log('EXECUTE RESPONSE', responseExecute.data.status);
            result = responseExecute.data.status;
        }).catch((err) => {
            console.log('EXECUTE RESPONSE ERROR', err);

            return err;
        });

        return result;

        /*axios.post(`${link}/execution`, {
            headers: {
                'Content-Type': 'application/json'
            }, form: {
                data: JSON.stringify(payload)
            }
        }).then((response) => {
            console.log('EXECUTE RESPONSE', JSON.stringify(response));
            return response.data;
        }).catch((err) => {
            console.log('EXECUTE RESPONSE ERROR', JSON.stringify(err));
            return err;
        });*/

    }

    /*async executeAction() {
        execute(request).then(async function (result) {
            log('DEBUG: ', 'handleControl execute success: ', JSON.stringify(result));
            let response = {
                event: {
                    header: {
                        namespace: "Alexa",
                        name: "Response",
                        messageId: request.directive.header.messageId,
                        correlationToken: request.directive.header.correlationToken,
                        payloadVersion: "3"
                    },
                    endpoint: {
                        scope: {
                            type: "BearerToken",
                            token: request.directive.endpoint.scope.token
                        },
                        endpointId: request.directive.endpoint.endpointId
                    },
                    payload: {}
                },
                context: {
                    properties: [
                        {
                            namespace: request.directive.header.namespace,
                            // name: request.directive.header.name,
                            name: (request.directive.header.name === 'SetBrightness' ? "brightness" : "powerState"),
                            value: await result,
                            timeOfSample: new Date(),
                            uncertaintyInMilliseconds: 60000
                        }
                    ]
                }
            };

            log('DEBUG: ', 'handleControl ', JSON.stringify({
                request: request,
                context: context,
                response: response
            }));
            // log("DEBUG", "Alexa.PowerController ", JSON.stringify(response));
            context.succeed(response);
        }).catch((error) => {
            log('DEBUG: ', 'handleControl execute error: ', JSON.stringify(error));

            let powerResult = 'ERROR';

            let response = {
                event: {
                    payload: {
                        type: "ENDPOINT_UNREACHABLE",
                        message: "Não foi possível alcançar o ponto de extremidade 12345 porque parece estar offline"
                    }
                }
            };
            context.succeed(response);
        });
    }*/

    /**
     * Constructor for an Kokar Response.
     * @constructor
     * @param opts Contains initialization options for the response
     */
    constructor(opts) {

        this.event = opts;
        /*if (opts === undefined)
            opts = {};

        if (opts.context !== undefined)
            this.context = this.checkValue(opts.context, undefined);

        if (opts.event !== undefined)
            this.event = this.checkValue(opts.event, undefined);
        else
            this.event = {
                "header": {
                    "namespace": this.checkValue(opts.namespace, "Alexa"),
                    "name": this.checkValue(opts.name, "Response"),
                    "messageId": this.checkValue(opts.messageId, uuid()),
                    "correlationToken": this.checkValue(opts.correlationToken, undefined),
                    "payloadVersion": this.checkValue(opts.payloadVersion, "3")
                },
                "endpoint": {
                    "scope": {
                        "type": "BearerToken",
                        "token": this.checkValue(opts.token, "INVALID"),
                    },
                    "endpointId": this.checkValue(opts.endpointId, "INVALID")
                },
                "payload": this.checkValue(opts.payload, {})
            };

        // No endpoint in an AcceptGrant or Discover request
        if (this.event.header.name === "AcceptGrant.Response" || this.event.header.name === "Discover.Response")
            delete this.event.endpoint;*/

    }

    async getState(payload) {

        console.log('GET STATE PAYLOAD', payload);

        // return new Promise(async function (resolve, reject) {

        let response = {};

        await axios.get(`${link}/state/${payload}`).then((body) => {
            // console.log('GET STATE KOKAR RESPONSE', typeof body, typeof body !== 'string' ? JSON.stringify(body) : body);
            console.log('GET STATE KOKAR RESPONSE', typeof body, body.data);

            response = body.data;

        }).catch((error) => {
            console.log('GET STATE KOKAR RESPONSE ERROR ', error);
        });

        return await response;

        /*, async (error, res, body) => {

                if (error) {

                    console.log('GET STATE KOKAR RESPONSE ERROR ', error);

                    reject(error);

                }

                console.log('GET STATE KOKAR RESPONSE', typeof body, typeof body !== 'string' ? JSON.stringify(body) : body);

                resolve(typeof body === 'string' ? JSON.parse(body) : body);

            });*/

        // });
    }

    /**
     * Add a property to the context.
     * @param opts Contains options for the property.
     */
    /*addContextProperty(opts) {

        if (this.context === undefined)
            this.context = {properties: []};

        this.context.properties.push(this.createContextProperty(opts));
    }*/

    /**
     * Add an endpoint to the payload.
     * @param opts Contains options for the endpoint.
     */
    /*addPayloadEndpoint(opts) {

        if (this.event.payload.endpoints === undefined)
            this.event.payload.endpoints = [];

        this.event.payload.endpoints.push(this.createPayloadEndpoint(opts));
    }*/

    /**
     * Creates a property for the context.
     * @param opts Contains options for the property.
     */
    /*createContextProperty(opts) {
        return {
            'namespace': this.checkValue(opts.namespace, "Alexa.EndpointHealth"),
            'name': this.checkValue(opts.name, "connectivity"),
            'value': this.checkValue(opts.value, {"value": "OK"}),
            'timeOfSample': new Date().toISOString(),
            'uncertaintyInMilliseconds': this.checkValue(opts.uncertaintyInMilliseconds, 0)
        };
    }*/

    /**
     * Creates an endpoint for the payload.
     * @param opts Contains options for the endpoint.
     */
    /*createPayloadEndpoint(opts) {

        if (opts === undefined) opts = {};

        // Return the proper structure expected for the endpoint
        let endpoint =
            {
                "capabilities": this.checkValue(opts.capabilities, []),
                "description": this.checkValue(opts.description, "Sample Endpoint Description"),
                "displayCategories": this.checkValue(opts.displayCategories, ["OTHER"]),
                "endpointId": this.checkValue(opts.endpointId, 'endpoint-001'),
                // "endpointId": this.checkValue(opts.endpointId, 'endpoint_' + (Math.floor(Math.random() * 90000) + 10000)),
                "friendlyName": this.checkValue(opts.friendlyName, "Sample Endpoint"),
                "manufacturerName": this.checkValue(opts.manufacturerName, "Sample Manufacturer")
            };

        if (opts.hasOwnProperty("cookie"))
            endpoint["cookie"] = this.checkValue('cookie', {});

        return endpoint
    }*/

    /**
     * Creates a capability for an endpoint within the payload.
     * @param opts Contains options for the endpoint capability.
     */
    /*createPayloadEndpointCapability(opts) {

        if (opts === undefined) opts = {};

        let capability = {};
        capability['type'] = this.checkValue(opts.type, "AlexaInterface");
        capability['interface'] = this.checkValue(opts.interface, "Alexa");
        capability['version'] = this.checkValue(opts.version, "3");
        let supported = this.checkValue(opts.supported, false);
        if (supported) {
            capability['properties'] = {};
            capability['properties']['supported'] = supported;
            capability['properties']['proactivelyReported'] = this.checkValue(opts.proactivelyReported, false);
            capability['properties']['retrievable'] = this.checkValue(opts.retrievable, false);
        }
        return capability
    }*/

    /**
     * Get the composed Kokar Response.
     * @returns {KokarResponse}
     */
    get() {
        return this;
    }
}

module.exports = KokarResponse;
