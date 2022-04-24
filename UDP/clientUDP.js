var udp = require('dgram');
const readline = require('readline');
const { v4: uuidv4 } = require('uuid');
var clc = require('cli-color');
const SnpPacket = require('./packet')

// var port = 1502;
// var address = '192.168.0.176';
var port = 7788;
// var address = '192.168.0.192';
var address = 'localhost';
class ClientUDP {
    constructor() {
        this.pendingPackets = new Map();
        this.client = udp.createSocket('udp4');

        this.client.on('message', (msg, info) => {
            try {
                var packet = SnpPacket.fromBytes(msg.toString());
                let message = new TextDecoder().decode(new Uint8Array(packet.payloadData))
                packet.payloadData = message;
                // If it is a single packet and we are not expecting any more then just print the result
                if (packet.totalPackets == 1) {
                    console.log(JSON.parse(packet.payloadData));
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
                        console.log(JSON.parse(finalMessage));
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

            } catch (error) {
                console.log(clc.red("Error trying to merge packets"))
                console.log(clc.red(error))
            }

        });

        // Read line from console
        const rl = readline.createInterface({ input: process.stdin })
        console.log("Start typing")

        // When pressing enter send message to server
        rl.on('line', async (line) => {

            this.isWaitingAcknowledgment = true;

            // Split the message in words
            let words = line.split(" ");
            let type = words[0].toUpperCase();

            // Send the type and the HTTP request
            if (type == 'SEND') {

                // Get arguments from command
                let method = words[1]
                let path = words[2]
                let queryParameters = null;
                if (!this.isEmpty(words[3]))
                    queryParameters = JSON.parse(words[3]);


                // Check the amount of arguments is correct
                if (!this.isEmpty(path) || !this.isEmpty(method)) {
                    try {
                        await this.sendToServer(JSON.stringify({
                            type,
                            id: uuidv4(),
                            body: {
                                method,
                                path,
                                queryParameters,
                            },
                            timeout: 1000
                        }), this.client);
                    } catch (error) {
                        console.log(clc.red(error));
                    }

                } else {
                    console.log(clc.red("Wrong arguments"))
                }
            }

            // Send the type and the token for authentication
            else if (type == 'AUTH') {

                // Get arguments
                let token = words[1]

                // Check the amount of arguments is correct
                if (token != null) {
                    try {
                        await this.sendToServer(JSON.stringify({
                            id: uuidv4(),
                            type: type,
                            body: {
                                token
                            },
                            timeout: 1000
                        }), this.client);
                    } catch (error) {
                        console.log(clc.red(error));
                    }

                }
                // Don't send message and output error
                else {
                    console.log(clc.red("Wrong arguments"))
                }

            }
            else if (type == 'CLOSE') {
                try {
                    await this.sendToServer(JSON.stringify({
                        id: uuidv4(),
                        type: type,
                        timeout: 1000
                    }), this.client);
                    this.client.close();
                    rl.close();
                } catch (error) {
                    console.log('\x1b[31m', error);
                }

            }
            // Just send the type and the timeout
            else
                try {
                    await this.sendToServer(JSON.stringify({
                        id: uuidv4(),
                        type: type,
                        timeout: 1000
                    }), this.client);
                } catch (error) {
                    console.log('\x1b[31m', error);
                }

        });


    }

    isEmpty(str) {
        return (!str || str.length === 0);
    }

    // Send a request to the server and wait for an acknowledgment
    sendToServer(str) {
        return new Promise((resolve, reject) => {
            let id = JSON.parse(str).id;

            //sending msg to the client
            var response = Buffer.from(str);
            console.log(response.byteLength);

            var chunks = [];
            let i = 0;
            let n = response.byteLength;
            while (i < n) {
                chunks.push(response.slice(i, i += 1024))
            }

            console.log("Sending: ", chunks.length, " packets")

            for (let i = 0; i < chunks.length; i++) {
                let snpPacket = new SnpPacket(id, i + 1, chunks.length, chunks[i].toJSON().data)

                this.client.send(snpPacket.toBytes(), port, address, function (error) {
                    if (error) {
                        console.log(clc.red(error));
                    }
                });
            }

            // When the server answers back check if it is our message
            this.client.on('message', (msg, info) => {
                try {
                    //Get the packet and parse it to JSON
                    var packet = SnpPacket.fromBytes(msg.toString());

                    // Decode the payload to string
                    let message = new TextDecoder().decode(new Uint8Array(packet.payloadData));
                    message = JSON.parse(message);

                    if (message.id == id) {
                        // Check if it is acknowledgement
                        if (message.status == 201) {
                            console.log(clc.green("Acknowledgment received"))
                            resolve("OK");
                        }
                        // Reject the promise if it is not
                        else {
                            reject(clc.red("Did not receive acknowledgement"));
                        }
                    }

                } catch (error) {
                    reject(clc.red("Did not receive acknowledgement"));
                }
            });

            // If did not reveive acknowlegment after 2 sec reject promise
            setTimeout(() => {
                reject("Timed Out waiting for acknowledgment")
            }, 2000);
        })
    };
}

new ClientUDP();

module.exports = ClientUDP;