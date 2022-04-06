// A server for the Shady Net Protocol
//
// The client sends an HTTP request to the proxy server which it will make the 
// request in it's stead
//
// The games uses the Shady Net Protocol
//
// Client -> Server
//     SEND <HTTP request> <Timeout>
//     AUTHENTICATE <token>
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
  // Manage the connection from a user
  console.log('Connection from', socket.remoteAddress, 'port', socket.remotePort);

  user = new User(socket);

}).listen(59898, () => {
  console.log('Proxy Server is running')
});


class User {

  constructor(socket) {
    this.socket = socket;
    this.isAuthenticated = false;

    // When gets data from the client
    socket.on('data', (buffer) => {

      // Get the message and divide in parts
      let message = JSON.parse(buffer);
      let type = message.type.toUpperCase();
      console.log('Message: ', message);

      // When the request is send 
      if (type == "SEND") {
        if (this.isAuthenticated) {
          try {
            socket.write(JSON.stringify({
              success: 'true',
              payload: {
                message: 'Congrats this worked',
              }
            }))
          }
          catch (e) {
            socket.write(JSON.stringify({
              success: 'false',
              payload: {
                message: e,
              }
            }))
          }
        }
        else {
          socket.write(JSON.stringify({
            success: 'false',
            payload: {
              message: 'User is not authenticated',
            }
          }))
        }

      }

      // Close the socket connection
      else if (type == "QUIT") {
        socket.end();
      }

      // Authenticate the user
      else if (type == "AUTH") {
        this.isAuthenticated = true;
        socket.write(JSON.stringify({
          success: 'true',
          payload: {
            message: 'User autenticated',
          }
        }))
      }

      // Send back 400 response 
      else {
        socket.write(JSON.stringify({
          success: 'false',
          payload: {
            message: 'Unkown command',
          }
        }))
      }
    });

    // Close the socket connection when the end command is issued
    socket.on('end', () => {
      console.log('Closed', socket.remoteAddress, 'port', socket.remotePort);
    });
  }
}