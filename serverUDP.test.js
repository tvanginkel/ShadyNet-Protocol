const server = require('./serverUDP')
var udp = require('dgram')
const { doesNotMatch } = require('assert')
const ServerUDP = require('./serverUDP')

beforeAll(async () => {

    const serv = await new ServerUDP();
})

test('Should return not authorized', async () => {

    // var client = udp.createSocket('udp4');

    // function sendToServer(str, client) {
    //     var data = Buffer.from(str);
    //     client.send(data, 7788, 'localhost', function (error) {
    //         if (error) {
    //             console.log(error);
    //             client.close();
    //         }
    //     });
    // }

    // sendToServer(JSON.stringify({
    //     type: 'AUTH',
    //     token: 'a',
    //     timeout: '1000'
    // }), client);

    // client.on('message', function (msg, info) {
    //     expect(msg.toString()).toMatch(JSON.stringify({
    //         success: 'true',
    //         payload: {
    //             message: 'User authenticated'
    //         }
    //     }));
    // });


})