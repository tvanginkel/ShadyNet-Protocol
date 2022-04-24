var CryptoJS = require("crypto-js");
var clc = require('cli-color');

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

        console.log(clc.yellow("Decrypting data..."))

        // Decrypt
        var bytes = CryptoJS.AES.decrypt(buffer.toString(), 'snp');
        var originalText = bytes.toString(CryptoJS.enc.Utf8);
        // console.log(clc.yellow(originalText))
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

    toBytes() {


        // Encrypt
        let strJSON = JSON.stringify(this.toJson())
        console.log(clc.blue("Encrypting data..."))
        var ciphertext = CryptoJS.AES.encrypt(strJSON, 'snp').toString();
        // console.log(clc.blue(ciphertext), '\n')
        return Buffer.from(ciphertext);
    }
}

module.exports = SnpPacket;