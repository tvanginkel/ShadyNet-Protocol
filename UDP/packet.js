var CryptoJS = require("crypto-js");
var clc = require('cli-color');

const encript = false;
class SnpPacket {
    constructor(id, packetNumber, totalPackets, payloadData) {
        this.id = id;
        this.packetNumber = packetNumber
        this.totalPackets = totalPackets;
        this.payloadData = payloadData
    }

    toJson() {
        return {
            id: this.id,
            packetNumber: this.packetNumber,
            totalPackets: this.totalPackets,
            payloadData: this.payloadData
        }
    }

    fromJSON(json) {
        this.id = json.id;
        this.packetNumber = json.packetNumber;
        this.totalPackets = json.totalPackets;
        this.payloadData = json.payloadData
    }

    static fromBytes(buffer) {
        if (encript) {
            // console.log(clc.yellow("Decrypting data..."))
            // console.log(buffer.toString());
            // Decrypt
            var bytes = CryptoJS.AES.decrypt(buffer.toString(), 'snp',);
            var originalText = bytes.toString(CryptoJS.enc.Utf8);

            try {
                let json = JSON.parse(originalText);
                return {
                    id: json.id,
                    packetNumber: json.packetNumber,
                    totalPackets: json.totalPackets,
                    payloadData: json.payloadData
                };
            } catch (error) {
                console.log(error);
            }
        }
        else {
            try {
                let json = JSON.parse(buffer.toString());
                return {
                    id: json.id,
                    packetNumber: json.packetNumber,
                    totalPackets: json.totalPackets,
                    payloadData: json.payloadData
                };
            } catch (error) {
                console.log(clc.red("Error trying to json the packet"));
                console.log(error);
            }
        }
    }

    toBytes() {
        if (encript) {
            // Encrypt
            console.log(clc.blue("Encrypting data..."))
            let strJSON = JSON.stringify(this.toJson())
            var ciphertext = CryptoJS.AES.encrypt(strJSON, 'snp').toString();
            // console.log(ciphertext)
            return Buffer.from(ciphertext);
            // console.log(clc.blue(ciphertext), '\n')

        }
        else {
            let strJSON = JSON.stringify(this.toJson())
            return Buffer.from(strJSON);
        }

    }
}

module.exports = SnpPacket;