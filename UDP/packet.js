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

    fromBytes(buffer) {
        let packet = buffer.toString();
        try {
            let json = JSON.parse(packet);
            this.fromJSON(json);
        } catch (error) {
            console.log(error);
        }
    }

    toBytes() {
        // this.payloadData = this.payloadData.toString()
        let strJSON = JSON.stringify(this.toJson())
        return Buffer.from(strJSON);
    }
}

module.exports = SnpPacket;