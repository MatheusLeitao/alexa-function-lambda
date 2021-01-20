'use strict';
const AlexaResponse = require('./alexa/skills/smarthome/AlexaResponse');
const KokarResponse = require('./kokar/smarthome/KokarResponse');
const axios = require('axios');

exports.handler = async function (event, context) {

    if (process.env.LOGGER_KOKAR === "true") {
        console.log('HANDLER REQUEST', JSON.stringify({event: event, context: context}));
    }

    if (!('directive' in event)) {

        let ar = new AlexaResponse({
            name: "ErrorResponse",
            payload: {
                type: "INVALID_DIRECTIVE",
                message: "Chave ausente: diretiva, solicita uma diretiva Alexa válida?"
            }
        }).get();

        console.log('HANDLER RESPONSE ERROR', JSON.stringify(ar));

        return ar;

    }

    if (((event.directive || {}).header || {}).namespace === 'Alexa.Authorization') {

        let token = event.directive.payload.grantee.token;
        let result = {};

        if (token) {
            await axios.get(`https://api.amazon.com/user/profile?access_token=${token}`).then((response) => {
                if (response.data.hasOwnProperty('email')) {
                    if (process.env.LOGGER_KOKAR === "true") {
                        console.log('AUTHORIZATION ACCEPT', JSON.stringify(response.data));
                    }
                    result = new AlexaResponse({namespace: 'Alexa.Authorization', name: 'AcceptGrant.Response'}).get();
                }

            }).catch((err) => {
                console.log('ERROR AXIOS GET', typeof err, err);
            });
        } else {

            console.log('AUTHORIZATION INVALID', 'Usuário não sincronizou a Oka no Login da Kokar');
            result = new AlexaResponse({
                namespace: 'Alexa.Authorization',
                name: "ErrorResponse",
                payload: {
                    type: "INVALID_AUTHORIZATION_CREDENTIAL",
                    message: "Usuário não sincronizou a Oka no Login da Kokar"
                }
            }).get();
        }

        return result;

    } else {
        return await handleDirective(event, context);
    }

};

async function handleDirective(event, context) {

    const activation = ((event.directive || {}).header || {}).namespace;
    const endpoint = event.directive.hasOwnProperty('endpoint') ? event.directive.endpoint : null;

    let ar = new AlexaResponse(event.directive);
    let kr = new KokarResponse(event.directive);

    if (process.env.LOGGER_KOKAR === "true") {
        console.log('HANDLE DIRECTIVE LOGGER', JSON.stringify({event: event, alexaResponse: ar, kokarResponse: kr}))
    }

    let serial = await kr.getSerial();

    switch (activation.toLowerCase().split('.')[1]) {

        case 'discovery':

            if (serial) {

                ar.addContextProperty({name: "Discover.Response"});

                ar.addPayloadEndpoint(await kr.getResidence());

                let arTemp = ar.get();

                ar = new AlexaResponse({
                    event: {
                        header: {
                            namespace: "Alexa.Discovery",
                            name: "Discover.Response",
                            payloadVersion: "3",
                            messageId: arTemp.event.header.messageId
                        },
                        payload: {
                            endpoints: arTemp.event.payload.endpoints
                        }
                    }
                });

            } else {

                ar.addContextProperty({
                    name: "ErrorResponse",
                    payload: {
                        type: "INVALID_AUTHORIZATION_CREDENTIAL",
                        message: "Usuário não sincronizou a Oka no Login da Kokar"
                    }
                });

            }

            if (process.env.LOGGER_KOKAR === "true") {
                console.log('DISCOVERY', JSON.stringify({serial: serial, alexaResponse: ar, kokarResponse: kr}));
            }

            break;

        case 'powercontroller':

            let valuePower = await kr.execute(event.directive.endpoint.endpointId, event.directive.header.name, serial);
            ar.addContextProperty({
                namespace: "Alexa.PowerController",
                name: "powerState",
                value: valuePower,
                timeOfSample: new Date(),
                uncertaintyInMilliseconds: 60000
            });

            if (process.env.LOGGER_KOKAR === "true") {
                console.log('POWER CONTROLLER ', JSON.stringify({
                    event: event,
                    alexaResponse: ar,
                    kokarResponse: kr
                }))
            }

            break;
        case 'brightnesscontroller':
            let valueBrightness = await kr.execute(event.directive.endpoint.endpointId, `${event.directive.header.name}|${event.directive.payload.brightness}`, serial);

            ar.addPayloadEndpoint({});

            ar.event.endpoint = endpoint;

            ar.addContextProperty({
                namespace: "Alexa.BrightnessController",
                name: "brightness",
                value: 100 - valueBrightness,
                timeOfSample: new Date(),
                uncertaintyInMilliseconds: 60000
            });

            if (process.env.LOGGER_KOKAR === "true") {
                console.log('BRIGHTNESS CONTROLLER ', JSON.stringify({
                    event: event,
                    alexaResponse: ar,
                    kokarResponse: kr
                }))
            }

            break;
        case 'scenecontroller':

            /*ar.addPayloadCause({
                cause: {
                    type: "VOICE_INTERACTION"
                },
                timestamp: new Date()
            });*/

            // ar.addContextProperty({name: "ActivationStarted"});
            ar = new AlexaResponse({
                header: {
                    namespace: "Alexa.SceneController",
                    name: "Activate",
                    messageId: event.directive.header.messageId,
                    correlationToken: event.directive.header.messageId,
                    payloadVersion: "3"
                },
                endpoint: {
                    scope: {
                        type: "BearerToken",
                        token: event.directive.endpoint.scope.token
                    },
                    endpointId: event.directive.endpoint.endpointId
                },
                payload: {}
            });

            let executeScene = await kr.execute(event.directive.endpoint.endpointId, event.directive.header.name, serial);

            if (executeScene !== 'OK') {
                ar = new AlexaResponse({
                    event: {
                        header: {
                            namespace: 'Alexa',
                            name: 'ErrorResponse',
                            messageId: event.directive.header.messageId,
                            payloadVersion: '3'
                        },
                        ...executeScene
                    }
                });
            }

            if (process.env.LOGGER_KOKAR === "true") {
                console.log('SCENE CONTROLLER ', JSON.stringify({
                    event: event,
                    alexaResponse: ar,
                    kokarResponse: kr
                }))
            }

            break;

        default:
            if (event.directive.header.name === 'ReportState') {

                let serial = await kr.getSerial();
                ar = new AlexaResponse({
                    event: {
                        header: {
                            namespace: "Alexa",
                            name: "StateReport",
                            messageId: event.directive.header.messageId,
                            correlationToken: event.directive.header.messageId,
                            payloadVersion: "3"
                        },
                        endpoint: {
                            scope: {
                                type: "BearerToken",
                                token: event.directive.endpoint.scope.token
                            },
                            endpointId: event.directive.endpoint.endpointId
                        },
                        payload: {}
                    },
                    context: {
                        properties: []
                    }
                });

                await kr.getState(event.directive.endpoint.endpointId, serial).then(result => ar.addContextProperty(result)).catch(error => console.log('STATE REPORT ERROR', error));

            } else {

                ar.addContextProperty({
                    name: "ErrorResponse",
                    payload: {
                        type: "ENDPOINT_UNREACHABLE",
                        message: "Unable to reach endpoint database."
                    }
                });

            }

            if (process.env.LOGGER_KOKAR === "true") {
                console.log('REPORT STATE ', JSON.stringify({event: event, alexaResponse: ar, kokarResponse: kr}))
            }
    }

    const response = ar.get();

    if (process.env.LOGGER_KOKAR === "true") {
        console.log("HANDLER RESPONSE", JSON.stringify(response));
    }

    return response;

}
