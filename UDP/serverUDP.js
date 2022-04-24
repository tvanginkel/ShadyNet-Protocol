const dgram = require('dgram');
const axios = require('axios');
const Request = require('./requests');
const SnpPacket = require('./packet')

function sendMessage(msg, port, address, server) {

    let message = JSON.parse(msg)

    //sending msg to the client
    var response = Buffer.from(msg);
    console.log(response.byteLength);

    var chunks = [];
    i = 0;
    n = response.byteLength;
    while (i < n) {
        chunks.push(response.slice(i, i += 1024))
    }

    console.log("Sending: ", chunks.length, " packets")

    for (let i = 0; i < chunks.length; i++) {
        let snpPacket = new SnpPacket(message.id, i + 1, chunks.length, chunks[i].toJSON().data)
        server.send(snpPacket.toBytes(), port, address, function (error) {
            if (error) {
                console.log('\x1b[31m\x1b[0m', error);
            }
        });
    }
}

class ServerUDP {
    constructor() {
        // A map with the packets yet to be completed
        this.pendingPackets = new Map();

        // The maximum number of request an unauthenticated client is allowed to make
        this.maxRequests = 10;
        // List with all the requests pending. Uses FIFO
        this.queue = [];

        // Store all the unauthenticated IPs and the amount of request left
        this.unAuthenticatedIPs = new Map();

        // Store all the authenticated IPs
        this.authenticatedIPS = [];

        this.server = dgram.createSocket('udp4');

        // Bind socket to port 7788
        this.server.bind(7788);

        this.server.on('listening', async () => {
            const address = this.server.address();
            console.log('listening at: ', address.address, address.port)

        });

        // When the servers get a message from  a client
        this.server.on('message', (msg, info) => {

            let request = this.managePacket(msg)

            // If all the packets of the request have been received then handle the request
            if (request != null) {
                request = new Request(request, info);

                console.log(request);

                // Push this request to the end of the queue
                this.queue.push(request);

                sendMessage(JSON.stringify({
                    id: request.id,
                    success: 'true',
                    status: 201,
                    payload: {
                        queue: this.queue.indexOf(request)
                    }
                }), info.port, info.address, this.server)

                // If the queue was empty before then run the doRequests funcion
                if (this.queue.length == 1) {
                    this.doRequests();
                }
            }
        });

        this.server.on('error', (err) => {
            console.log('\x1b[31m\x1b[0m', err);
            this.server.close();
        });
    }

    async doRequests() {
        if (this.queue.length == 0) {
            return null;
        }

        let request = this.queue.at(0);

        let message = request.message;
        let type = message.type;

        // Make proxy request
        if (type == "SEND") {
            // Check if the user is authenticated
            let isAuthenticated = this.authenticatedIPS.includes(request.address)

            var requestsLeft = null;
            //If not authenticated then check how many request he has left
            if (!isAuthenticated) {
                // If the user has made previous requests then substract one form the amount left
                if (this.unAuthenticatedIPs.has(request.address)) {
                    requestsLeft = this.unAuthenticatedIPs.get(request.address);
                    if (requestsLeft > 0) {
                        requestsLeft -= 1;
                        this.unAuthenticatedIPs.set(request.address, requestsLeft)
                        isAuthenticated = true;
                    }
                }

                // If it's the first time making a request 
                else {
                    // Set the intitial amount of requests to 10
                    this.unAuthenticatedIPs.set(request.address, this.maxRequests - 1);
                    requestsLeft = this.maxRequests - 1;
                    isAuthenticated = true;
                }
            }

            // Send back success payload if user is authenticated
            if (isAuthenticated) {
                var url = message.body.path;
                var method = message.body.method.toLowerCase();
                var data = message.body.queryParameters;

                try {
                    let response = await axios({ method, url, data })
                    sendMessage(JSON.stringify({
                        id: message.id,
                        success: 'true',
                        status: 200,
                        payload: {
                            content: {
                                headers: response.headers,
                                config: response.config,
                                request: response.requet,
                                data: response.data
                            },
                            requests: requestsLeft
                        }
                    }), request.port, request.address, this.server)

                } catch (error) {
                    sendMessage(JSON.stringify({
                        id: message.id,
                        success: 'false',
                        status: 400,
                        payload: {
                            error: 'BAD_REQUEST',
                            message: 'Incorrect properties in request',
                        },
                    }), request.port, request.address, this.server)
                }



            }

            // Send back error saying user is not authenticated
            else {
                sendMessage(JSON.stringify({
                    id: message.id,
                    success: 'false',
                    status: 403,
                    payload: {
                        error: 'UNAUTHORIZED',
                        message: 'No requests left to make',
                    }
                }), request.port, request.address, this.server)
            }
        }

        // Close the socket connection
        else if (type == "CLOSE") {
            setTimeout(() => {
                this.server.close();
            }, 1000);
        }

        // Authenticate the user
        else if (type == "AUTH") {

            // If the arguments are not right send back an error
            if (message.body.token == null) {
                sendMessage(JSON.stringify({
                    id: message.id,
                    success: 'false',
                    status: 400,
                    payload: {
                        error: 'BAD_REQUEST',
                        message: 'Incorrect properties in request',
                    }
                }), request.port, request.address, this.server)
            }
            // Authenticate the user
            else {
                this.isAuthenticated = true;
                if (!this.authenticatedIPS.includes(request.address))
                    this.authenticatedIPS.push(request.address);
                if (this.unAuthenticatedIPs.has(request.address))
                    this.unAuthenticatedIPs.delete(request.address);

                sendMessage(JSON.stringify({
                    id: message.id,
                    success: 'true',
                    status: 200,
                    payload: {
                        message: 'Authentication successful',
                    }
                }), request.port, request.address, this.server)
            }
        }

        // Send back UNKNOWN COMMAND error
        else {
            sendMessage(JSON.stringify({
                id: message.id,
                success: 'false',
                status: 400,
                payload: {
                    error: 'BAD_REQUEST',
                    message: 'Incorrect properties in request',
                }
            }), request.port, request.address, this.server)
        }

        // Delete from queue
        this.queue.shift()

        // Keep looping through the queue if it is not empty
        if (this.queue.length != 0) {
            this.doRequests();
        }
    }

    // This function will receive a packet. It will return a response if it has all the packets for it.
    // Otherwise it will return null
    managePacket(packetBuffer) {
        try {
            var packet = JSON.parse(packetBuffer.toString())
            let message = new TextDecoder().decode(new Uint8Array(packet.payloadData))

            packet.payloadData = message;

            // If it is a single packet and we are not expecting any more then just print the result
            if (packet.totalPackets == 1) {
                return JSON.parse(packet.payloadData);
            }

            // Otherwise check if we have received other packets from the same response, and if we have
            // then add it to the list and check if we have all the packets.
            else if (this.pendingPackets.has(packet.id)) {
                let packets = this.pendingPackets.get(packet.id);
                packets[packet.packetNumber - 1] = packet;

                // If this was the last packet missing then put them togheter
                if (packets.length == packet.totalPackets) {
                    let finalMessage = "";
                    for (let i = 0; i < packets.length; i++) {
                        finalMessage += packets[i].payloadData;
                    }
                    // console.log(finalMessage)
                    return JSON.parse(finalMessage);
                }
                // Otherwise just add it to the list
                else {
                    this.pendingPackets.set(packet.id, packets);
                }
            }

            // If this is the first time we get a package and we are expecting more, create and entry in the map 
            // with the id of the response and add it to the list.
            else if (!this.pendingPackets.has(packet.id)) {
                this.pendingPackets.set(packet.id, new Array())
                let arr = this.pendingPackets.get(packet.id)
                arr[packet.packetNumber - 1] = packet
            }

            return null;

        } catch (error) {
            console.log(clc.red("Error trying to merge packets"))
            console.log(clc.red(error))
            return null;
        }
    }
}

var serv = new ServerUDP()

module.exports = ServerUDP