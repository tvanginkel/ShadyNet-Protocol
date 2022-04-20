var udp = require('dgram')
const readline = require('readline');
const { v4: uuidv4 } = require('uuid');

var client = udp.createSocket('udp4');

client.on('message', function (msg, info) {
    console.log(JSON.parse(msg.toString()))
    console.log('Received %d bytes from %s:%d\n', msg.length, info.address, info.port);
});

// Read line from console
const rl = readline.createInterface({ input: process.stdin })
console.log("Start typing")

// When pressing enter send message to server
rl.on('line', (line) => {

    // Split the message in words
    let words = line.split(" ");
    let type = words[0].toUpperCase();

    // Send the type and the HTTP request
    if (type == 'SEND') {

        // Get arguments from command
        let method = words[1]
        let path = words[2]
        let queryParameters = null;
        if (!isEmpty(words[3]))
            queryParameters = JSON.parse(words[3]);

        //console.log(queryParameters)

        // Check the amount of arguments is correct
        if (!isEmpty(path) || !isEmpty(method)) {
            sendToServer(JSON.stringify({
                type,
                body: {
                    id: uuidv4(),
                    method,
                    path,
                    queryParameters,
                },
                timeout: '1000'
            }), client);
        } else {
            console.log("Wrong arguments")
        }
    }

    // Send the type and the token for authentication
    else if (type == 'AUTH') {

        // Get arguments
        let token = words[1]

        // Check the amount of arguments is correct
        if (token != null) {
            sendToServer(JSON.stringify({
                type: type,
                token: token,
                timeout: '1000'
            }), client);
        }
        // Don't send message and output error
        else {
            console.log("Wrong arguments")
        }

    }
    // Just send the type and the timeout
    else
        sendToServer(JSON.stringify({
            type: type,
            timeout: '1000'
        }), client);
});

rl.on('close', () => {
    client.close();
});

function isEmpty(str) {
    return (!str || str.length === 0);
}

function sendToServer(str, client) {
    var data = Buffer.from(str);
    client.send(data, 7788, 'localhost', function (error) {
        if (error) {
            console.log(error);
            client.close();
        }
    });
}