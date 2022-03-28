// A server for the Shady Net Protocol
//
// The client sends an HTTP request to the proxy server which it will make the 
// request in it's stead
//
// The games uses the Shady Net Protocol
//
// Client -> Server
//     SEND <HTTP request> <Token> <Timeout>
//     QUIT
//
// Server -> Client
//     SUCCESS:
//          REQUEST MADE
//          REQUEST RECEIVED
//     ERROR
//          CONNECTION REFUSED
//          TIMEOUT
//          UNAUTHORIZED
//     
const net = require('net');

const server = net.createServer((socket) => {
  console.log('Connection from', socket.remoteAddress, 'port', socket.remotePort);

  socket.on('data', (buffer) => {
    message = buffer.toString().trim().toUpperCase()
    console.log('Request from', socket.remoteAddress, 'port', socket.remotePort);
    if (message == "SEND"){
      console.log('\nSending request....');
      console.log('Done');
      socket.json.send({your: 'data'});
    }
    if (message == "QUIT"){
      socket.end();
    }
  });

  socket.on('end', () => {
    console.log('Closed', socket.remoteAddress, 'port', socket.remotePort);
  });
});

server.maxConnections = 20;
server.listen(59898, () => {
  console.log('Proxy Server is running')
});