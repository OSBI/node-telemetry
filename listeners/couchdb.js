var nano = require('nano');
exports = module.exports = function(config, options) {
    this.url = function(config) {
        return "https://" + config.username + ":" + config.password + 
            "@" + config.host + ":" + config.port;
    };
    this.db = nano(this.url(config)).db;
    this.db.use(config.database);
    options.input.bind('event:new', this.post);
    
    this.post = function(data) {
        console.log("DATA:", data);
        this.db.insert(data, function(error, http_body, http_headers) {
            if (error)
                console.error(error);
        });
    };
};