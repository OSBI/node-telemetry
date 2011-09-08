var nano = require('nano');
exports = module.exports = function(config) {
    this.url = function(config) {
        var url = "https://" + encodeURIComponent(config.username) + ":" + 
            encodeURIComponent(config.password) + 
            "@" + encodeURIComponent(config.host);
        if (config.port) {
            url += ":" + parseInt(config.port);
        }
        return url;
    };
    this.db = nano(this.url(config)).use(config.input);
    
    /**
     * Post a message to the telemetry server
     * Required method
     */
    this.post = function(data) {
        console.log("DATA:", data);
        this.db.insert(data, function(error, http_body, http_headers) {
            if (error)
                console.error(error);
        });
    };
};