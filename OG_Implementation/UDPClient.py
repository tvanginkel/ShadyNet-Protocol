import socket
import json
import string
import random
import sys
import textwrap
from time import sleep


letters_digits = string.ascii_lowercase + string.digits
id = ''.join(random.choice(letters_digits) for i in range(8)) + "-"  +  ''.join(random.choice(letters_digits) for i in range(4)) + "-"  +  ''.join(random.choice(letters_digits) for i in range(4)) + "-"  +  ''.join(random.choice(letters_digits) for i in range(12))

IP = socket.gethostbyname(socket.gethostname())
HOST = 5151
BUFFER_SIZE = 5000
ADDRESS = ('localhost', HOST)
FORMAT = 'utf-8'

UDPClientSocket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
UDPClientSocket.settimeout(5)

def Send():
    
    type = input('Please enter your type: ')

    if(type == 'quit'):
            print('Closing...')
            sys.exit()

    if(type == 'AUTH'):
            authtoken = input('Please enter a token: ')
            if(authtoken == 'quit'):
                print('Closing...')
                sys.exit()
            auth_request = {'id': id, 'type': type, 'body': {'token': authtoken}}
            Request(auth_request, UDPClientSocket)
            receiveRespond()
            receiveRespond()

    elif(type == 'SEND'):
        method = input('Please enter your method: ')

        if(method == 'quit'):
                print('Closing...')
                sys.exit() 
        
        if(method == 'GET'):
            path = input('Please enter your path: ')
            if(path == 'quit'):
                print('Closing...')
                sys.exit()
            parameters = input('Please enter your parameters: ')
            if(parameters == 'quit'):
                print('Closing...')
                sys.exit()

            send_getrequest = {'id': id, 'type': type, 'body': {'method': method, 'path': path, 'quryParameters': parameters, 'body': None}, 'timeout': 10000}
            Request(send_getrequest, UDPClientSocket)
            receiveRespond()
            receiveRespond()
            
        if(method == 'POST'):
            path = input('Please enter your path: ')
            if(path == 'quit'):
                print('Closing...')
                sys.exit()
            username = input('Please enter your username: ')
            if(username == 'quit'):
                print('Closing...')
                sys.exit()
            send_postrequest = {'id': id, 'type': type, 'body': {'method': method, 'path': path, 'queryParameters': None, 'body': {'username': username}}, 'timeout': 10000}
            Request(send_postrequest, UDPClientSocket)
            receiveRespond()
            receiveRespond()
            
        if(method != 'GET' and method != 'POST'): 
            print('Method should be either "GET" or "POST".')
            return 

    else:
        print('Type should be either "SEND" or "AUTH".')
        send_getrequest = {'id': id, 'type': type}
        Request(send_getrequest, UDPClientSocket)
        receiveRespond()
        receiveRespond()
        return
            
def receiveRespond():
    respond_packets = {}

    while(True):
        ServerResponse = UDPClientSocket.recvfrom(BUFFER_SIZE)
        
        respond = ServerResponse[0].decode(FORMAT)
        respond_json = json.loads(respond)
        if id not in respond_packets:
                    respond_packets[id] = {respond_json['packetNumber']: ''.join([chr(x) for x in respond_json['payloadData']])}
        else:
                respond_packets[id][respond_json['packetNumber']] = ''.join([chr(x) for x in respond_json['payloadData']])

        if len(respond_packets[id]) == respond_json['totalPackets']:
                reassembled = ''
                for i in range(len(respond_packets[id])):
                        reassembled += respond_packets[id][i+1]
                print(reassembled)
                return
              
            
def Request(request, UDPClientSocket):
        
        json_message = json.dumps(request)
        packet_list = textwrap.wrap(json_message, 1024)
    
        for i in range(len(packet_list)):
            packet = {"id": id, "packetNumber": i+1, "totalPackets": len(packet_list), "payloadData": [x for x in packet_list[i].encode()]}
            encodedpacket = json.dumps(packet).encode()
            UDPClientSocket.sendto(encodedpacket, ADDRESS)
try:            
    while(True):        
        Send()
except socket.timeout:
    print('Client Timeout.')
