var nano = require('nano');
exports = module.exports = function(config) {
    var self = this;
    self.cache = [];
    self.config = config;
    self.bufferTime = config.bufferTime || 30000;
    self.url = function(config) {
        var url = config.protocol || "http";
        url += "://";
        if (config.username && config.password) {
            url += encodeURIComponent(config.username) + ":" + 
            encodeURIComponent(config.password) + "@";
        }
        url += encodeURIComponent(config.host);
        if (config.port) {
            url += ":" + parseInt(config.port);
        }
        return url;
    };
    self.db = nano(self.url(config)).use(config.input);
    
    /**
     * Prepare for a graceful shutdown
     */
    self.shutdown = function() {
        self.flush_cache();
    };
    
    /**
     * Push a bulk update to CouchDB
     */
    self.flush_cache = function() {
        // Remove all docs from the cache, but leave cache available to incoming requests
        var batch = self.cache.splice(0, 1000);
        if (batch.length === 0) return;
        
        // Push 
        self.db.bulk({ docs: batch }, function(error, http_body, http_headers) {
            if (error) {
                self.cache = self.cache.concat(batch);
                telemetry.errors++;
                telemetry.last_error = {
                    time: new Date(),
                    message: "CouchDB bulk load failed for input `" + self.config.input + "` (" + error.message + ")"
                };
                telemetry.error({
                    type: "couchdb",
                    error: "Reverting due to error: " + error,
                    batch_size: batch.length
                });
            } else if (self.cache.length > 50) {
                self.flush_cache();
            }
        });
    };
    
    /**
     * Post a message to the telemetry server
     * Required method
     */
    self.post = function(data) {
        // Remove underscore properties
        for (var prop in data) {
            if (data.hasOwnProperty(prop)) {
                if (prop[0] === "_") {
                    delete data[prop];
                }
            }
        }
        
        // Generate a UUID to prevent duplicate docs
        data._id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
        
        // Push to cache
        this.cache.push(data);
    };
    
    setInterval(function() {
        self.flush_cache();
    }, self.bufferTime);
};