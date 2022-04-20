const dgram = require('dgram');
const axios = require('axios');

function sendMessage(msg, port, address, server) {
    //sending msg to the client
    var response = Buffer.from(msg);
    server.send(response, port, address, function (error) {
        if (error) {
            client.close();
        } else {
            console.log('Data sent !');
        }
    });
}

class ServerUDP {
    constructor() {
        // Store all the unauthenticated IPs and the amount of request left
        this.unauthorizedIPs = new Map();

        // Store all the authenticated IPs
        this.isAuthenticatedIPs = [];

        this.server = dgram.createSocket('udp4');

        // Bind socket to port 7788
        this.server.bind(7788);

        this.server.on('listening', async () => {
            const address = this.server.address();
            console.log(`server listening ${address.address}:${address.port}`);
        });

        // When the servers get a message from  a client
        this.server.on('message', (msg, info) => {

            // Get the message and divide in parts
            let message = JSON.parse(msg);
            let type = message.type.toUpperCase();
            console.log('Message: ', message);

            // Make proxy request
            if (type == "SEND") {
                // Check if the user is authenticated
                let isAuthenticated = this.isAuthenticatedIPs.includes(info.address)

                //If not authenticated then check how many request he has left
                if (!isAuthenticated) {
                    // If the user has made previous requests then substract one form the amount left
                    if (this.unauthorizedIPs.has(info.address)) {
                        let nums = this.unauthorizedIPs.get(info.address);
                        if (nums > 0) {
                            nums -= 1;
                            this.unauthorizedIPs.set(info.address, nums)
                            isAuthenticated = true;
                        }
                    }
                    // If it's the first time making a request 
                    else {
                        // Set the intitial amount of requests to 10
                        this.unauthorizedIPs.set(info.address, 10);
                        isAuthenticated = true;
                    }
                }

                // Send back success payload if user is authenticated
                if (isAuthenticated) {
                    var url = message.body.path;
                    var method = message.body.method.toLowerCase();
                    var data = message.body.queryParameters;

                    axios({ method, url, data }).then((response) => {
                        sendMessage(JSON.stringify({
                            id: message.body.id,
                            success: 'true',
                            status: 200,
                            payload: {
                                content: {
                                    headers: response.headers,
                                    config: response.config,
                                    request: response.requet,
                                    data: response.data
                                },
                                requests: -1
                            }
                        }), info.port, info.address, this.server)
                    }).catch((error) => {
                        sendMessage(JSON.stringify({
                            success: 'false',
                            status: 400,
                            payload: {
                                error: 'BAD_REQUEST',
                                message: 'Incorrect properties in request',
                                error_msg: error
                            },
                        }), info.port, info.address, this.server)
                    })

                }

                // Send back error saying user is not authenticated
                else {
                    sendMessage(JSON.stringify({
                        success: 'false',
                        status: '401',
                        payload: {
                            error: 'UNAUTHORIZED',
                            message: 'Used an anauthorized token in the request',
                        }
                    }), info.port, info.address, this.server)
                }
            }

            // Close the socket connection
            else if (type == "QUIT") {
                this.server.close();
            }

            // Authenticate the user
            else if (type == "AUTH") {

                // If the arguments are not right send back an error
                if (message.token == null) {
                    sendMessage(JSON.stringify({
                        success: 'false',
                        status: 400,
                        payload: {
                            error: 'BAD_REQUEST',
                            message: 'Incorrect properties in request',
                        }
                    }), info.port, info.address, this.server)
                }
                // Authenticate the user
                else {
                    this.isAuthenticated = true;
                    sendMessage(JSON.stringify({
                        success: 'true',
                        status: '200',
                        payload: {
                            message: 'Authentication successful',
                        }
                    }), info.port, info.address, this.server)
                }
            }

            // Send back UNKNOWN COMMAND error
            else {
                sendMessage(JSON.stringify({
                    success: 'false',
                    status: 400,
                    payload: {
                        error: 'BAD_REQUEST',
                        message: 'Incorrect properties in request',
                    }
                }), info.port, info.address, this.server)
            }
        });

        this.server.on('error', (err) => {
            sendMessage(JSON.stringify({
                success: 'false',
                status: 405,
                payload: {
                    error: 'INTERNAL_SERVER_ERROR',
                    message: 'There was an unknown error when processing the request',
                }
            }), info.port, info.address, this.server)
            this.server.close();
        });
    }

}

var serv = new ServerUDP()

module.exports = ServerUDP