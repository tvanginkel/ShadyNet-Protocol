var CryptoJS = require("crypto-js");
var clc = require('cli-color');

const encript = false;

var JsonFormatter = {
    stringify: function (cipherParams) {
        // create json object with ciphertext
        var jsonObj = { ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64) };

        // optionally add iv or salt
        if (cipherParams.iv) {
            jsonObj.iv = cipherParams.iv.toString();
        }

        if (cipherParams.salt) {
            jsonObj.s = cipherParams.salt.toString();
        }

        // stringify json object
        return JSON.stringify(jsonObj);
    },
    parse: function (jsonStr) {
        // parse json string
        var jsonObj = JSON.parse(jsonStr);

        // extract ciphertext from json object, and create cipher params object
        var cipherParams = CryptoJS.lib.CipherParams.create({
            ciphertext: CryptoJS.enc.Base64.parse(jsonObj.ct)
        });

        // optionally extract iv or salt

        if (jsonObj.iv) {
            cipherParams.iv = CryptoJS.enc.Hex.parse(jsonObj.iv);
        }

        if (jsonObj.s) {
            cipherParams.salt = CryptoJS.enc.Hex.parse(jsonObj.s);
        }

        return cipherParams;
    }
};


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
            console.log(clc.yellow("Decrypting data..."))

            // Decrypt
            var bytes = CryptoJS.AES.decrypt(buffer.toString(), 'snp', { format: JsonFormatter });
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
            var ciphertext = CryptoJS.AES.encrypt(strJSON, 'snp', { format: JsonFormatter });
            console.log(ciphertext)
            return Buffer.from(ciphertext.toString());
            // console.log(clc.blue(ciphertext), '\n')

        }
        else {
            let strJSON = JSON.stringify(this.toJson())
            return Buffer.from(strJSON);
        }

    }
}

module.exports = SnpPacket;