var CryptoJS = require("crypto-js");

var ciphertext = CryptoJS.AES.encrypt(JSON.stringify({ toni: 'hello' }), 'snp').toString();

var buffer = Buffer.from(ciphertext)


// Decrypt
var bytes = CryptoJS.AES.decrypt(buffer.toString(), 'snp');
var originalText = bytes.toString(CryptoJS.enc.Utf8);
console.log(originalText);

