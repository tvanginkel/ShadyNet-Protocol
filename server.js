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
const axios = require('axios');

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

      // Make proxy request
      if (type == "SEND") {
        // Send back success payload if user is authenticated
        if (this.isAuthenticated) {
          var url = message.body.url;
          var method = message.body.method.toLowerCase();
          var data = message.body.queryParameters;
          axios({ method, url, data }).then(function (response) {

            socket.write(JSON.stringify({
              success: 'true',
              payload: {
                //data: response.data,
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                config: response.config,
                request: response.requet
              }
            }))
          })
            .catch(function (error) {
              socket.write(JSON.stringify({
                success: 'false',
                error: error
              }))
            })

        }

        // Send back error saying user is not authenticated
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

        // If the arguments are not right send back an error
        if (message.token == null) {
          socket.write(JSON.stringify({
            success: 'false',
            payload: {
              message: 'Invalid token',
            }
          }))
        }
        // Authenticate the user
        else {
          this.isAuthenticated = true;
          socket.write(JSON.stringify({
            success: 'true',
            payload: {
              message: 'User autenticated',
            }
          }))
        }
      }

      // Send back UNKNOWN COMMAND error
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