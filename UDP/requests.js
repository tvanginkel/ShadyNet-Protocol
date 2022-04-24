class Request {
    constructor(msg, info) {
        this.id = msg.id;
        this.message = msg
        this.address = info.address;
        this.port = info.port;
    }

    toString(json) {
        try {
            return JSON.stringify(json)
        } catch (error) {
            console.log(error);
        }
    }

    tojson(str) {
        try {
            return JSON.parse(str)
        } catch (error) {
            console.log(error);
        }
    }

}

module.exports = Request