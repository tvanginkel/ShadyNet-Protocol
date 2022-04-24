const ServerUDP = require('./serverUDP');
const ClientUDP = require('./clientUDP');

describe('serverTest', () => {
    var server;
    var client;

    beforeEach(() => {
        server = new ServerUDP();
        client = new ClientUDP();

    })

    afterEach(() => {
        server.server.close();
        client.client.close();
    })

    afterAll(() => {
        server = null;
        client = null;
    })

    async function sendServer(msg) {
        try {
            await client.sendToServer(msg, client);
        } catch (error) {
            console.log('\x1b[31m', error);
        }
    }

    test('Should return authentication successful', (done) => {

        sendServer(JSON.stringify({
            id: 1,
            type: 'AUTH',
            token: 'a',
            timeout: '1000'
        }))

        client.client.on('message', function (msg, info) {
            if (JSON.parse(msg.toString()).status != 201) {
                expect(msg.toString()).toBe(JSON.stringify({
                    id: 1,
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
        sendServer(JSON.stringify({
            id: 1,
            type: 'AUTH',
            token: null,
            timeout: '1000'
        }));

        client.client.on('message', function (msg, info) {
            if (JSON.parse(msg.toString()).status != 201) {
                expect(msg.toString()).toBe(JSON.stringify({
                    id: 1,
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

    test('client uses SEND requet with invalid parameters', (done) => {
        sendServer(JSON.stringify({
            id: 1,
            type: 'SEND',
            body: {
                method: 'get',
                path: null,
            },
            timeout: '1000'
        }));

        client.client.on('message', function (msg, info) {
            if (JSON.parse(msg.toString()).status != 201) {
                expect(msg.toString()).toBe(JSON.stringify({
                    id: 1,
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

    test('client uses SEND without being authenticated', (done) => {
        sendServer(JSON.stringify({
            id: 1,
            type: 'SEND',
            body: {
                method: 'get',
                path: 'https://google.com',
            },
            timeout: '1000'
        }));

        client.client.on('message', function (msg, info) {
            let message = JSON.parse(msg.toString());
            if (message.status != 201) {
                expect(message.payload.requests).toBe(server.maxRequests - 1);
                done();
            }
        });
    })

    test('client uses SEND being authenticated', (done) => {

        // Authenticate the suer
        sendServer(JSON.stringify({
            id: 1,
            type: 'AUTH',
            token: 'a',
            timeout: '1000'
        }));

        // Make SEND request
        sendServer(JSON.stringify({
            id: 2,
            type: 'SEND',
            body: {
                method: 'get',
                path: 'https://google.com',
            },
            timeout: '1000'
        }));

        client.client.on('message', function (msg, info) {
            let message = JSON.parse(msg.toString());
            if (message.status != 201) {
                if (message.id == 2) {
                    expect(message.payload.requests).toBe(-1);
                    done();
                }
            }
        });
    })


    test('client uses SEND without being authenticated and having no requests left', (done) => {

        server.maxRequests = 1;

        sendServer(JSON.stringify({
            id: 1,
            type: 'SEND',
            body: {
                method: 'get',
                path: 'https://google.com',
            },
            timeout: '1000'
        }));

        sendServer(JSON.stringify({
            id: 2,
            type: 'SEND',
            body: {
                method: 'get',
                path: 'https://google.com',
            },
            timeout: '1000'
        }));

        client.client.on('message', function (msg, info) {
            let message = JSON.parse(msg.toString());
            if (message.id == 2) {
                if (message.status != 201) {
                    expect(message.status).toBe(403)
                    done();
                }
            }
        });
    })

})