
var udp = require('dgram')
const { doesNotMatch } = require('assert')
const ServerUDP = require('./serverUDP')

describe('serverTest', () => {

    var server;
    var client;
    function sendToServer(str, client) {
        var data = Buffer.from(str);
        client.send(data, 7788, 'localhost', function (error) {
            if (error) {
                console.log(error);
                client.close();
            }
        });
    }

    beforeEach(() => {
        server = new ServerUDP();
        client = udp.createSocket('udp4');

    })

    afterEach(() => {
        server.server.close();
        client.close();
    })


    test('Should return authentication successful', (done) => {
        sendToServer(JSON.stringify({
            type: 'AUTH',
            token: 'a',
            timeout: '1000'
        }), client);

        client.on('message', function (msg, info) {
            if (JSON.parse(msg.toString()).status != 201) {
                expect(msg.toString()).toBe(JSON.stringify({
                    success: 'true',
                    status: 200,
                    payload: {
                        message: 'Authentication successful'
                    }
                }));
                done();
            }
        });
    });

    test('client authenticates with invalid parameters', (done) => {
        sendToServer(JSON.stringify({
            type: 'AUTH',
            token: null,
            timeout: '1000'
        }), client);

        client.on('message', function (msg, info) {
            if (JSON.parse(msg.toString()).status != 201) {
                expect(msg.toString()).toBe(JSON.stringify({
                    success: 'false',
                    status: 400,
                    payload: {
                        error: 'BAD_REQUEST',
                        message: 'Incorrect properties in request'
                    }
                }));
                done();
            }
        });
    })

    test('client authenticates with valid parameters but invalid tokens', (done) => {
        sendToServer(JSON.stringify({
            type: 'AUTH',
            token: null,
            timeout: '1000'
        }), client);

        client.on('message', function (msg, info) {
            if (JSON.parse(msg.toString()).status != 201) {
                expect(msg.toString()).toBe(JSON.stringify({
                    success: 'false',
                    status: 400,
                    payload: {
                        error: 'BAD_REQUEST',
                        message: 'Incorrect properties in request'
                    }
                }));
                done();
            }
        });
    })

})