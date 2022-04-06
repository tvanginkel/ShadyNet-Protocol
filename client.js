const net = require('net');
const readline = require('readline');

// Create new socket
const client = new net.Socket();

//Connect to server in port 59898
client.connect(59898, process.argv[2], () => {
  console.log('Connected to server');
});

// When receiving data from server
client.on('data', (data) => {
  console.log(JSON.parse(data.toString('utf-8')));
});

// Read line from console
const rl = readline.createInterface({ input: process.stdin });

// When pressing enter send message to server
rl.on('line', (line) => {
  // Split the message in words
  let words = line.split(" ");
  let type = words[0].toUpperCase();

  // Send the type and the HTTP request
  if (type == 'SEND')
    client.write(JSON.stringify({
      type: type,
      httpRequest: 'THis is an HTTP request',
      timeout: '1000'
    }));

  // Send the type and the token for authentication
  else if (type == 'AUTH') {
    let token = words[1]
    // Check the amount of arguments is correct
    if (token != null) {
      client.write(JSON.stringify({
        type: type,
        token: token,
        timeout: '1000'
      }));
    }
    // Don't send message and output error
    else {
      console.log("Wrong arguments")
    }

  }
  // Just send the type and the timeout
  else
    client.write(JSON.stringify({
      type: type,
      timeout: '1000'
    }));
});

rl.on('close', () => {
  client.end();
});