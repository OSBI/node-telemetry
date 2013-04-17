var fs = require('fs');
var knox = require('knox');
exports = module.exports = function(config) {
    var self = this;
    
    /**
     * Prepare for a graceful shutdown
     */
    self.shutdown = function() {
        this.rotateLog(); 
    };
    
    /**
     * Do in-memory caching to improve throughput
     */
    self.bufferLength = config.bufferLength || (1024 * 1024 * 24);
    self.cache = new Buffer(self.bufferLength);
    self.cacheLength = 0;
    
	/**
	 * Rotate the log
	 */
	self.rotateLog = function() {
	    if (self.cacheLength === 0) return;
        var buf = self.cache.slice(0, self.cacheLength);
        bufferLength = self.cacheLength;
        self.cache = new Buffer(self.bufferLength);
        self.cacheLength = 0;
	    var now = new Date();
	    var datestamp = now.getUTCFullYear() + 
	        (now.getUTCMonth() <= 8 ? '0' : '') + (now.getUTCMonth() + 1) + 
	        (now.getUTCDate() <= 9 ? '0' : '') + now.getUTCDate();
		var timestamp = (Math.floor((new Date()).getTime() / 1000) + "").substring(5);
		var logfile = process.pid + "_" + timestamp + ".json";
		
		// Push log file to S3
		if (self.s3client) {
		    var req = self.s3client.put(
		            datestamp + "/" + self.config.input + "/" + logfile, 
		    {
		        'Content-Length': bufferLength,
		        'Content-Type': 'text/plain'
		    });
		    req.on('error', function(err) {
		        console.error(err);
		        buf.copy(self.cache, self.cacheLength, 0, bufferLength);
		    });
		    req.on('response', function(res){
		        if (res.statusCode !== 200) {
		            telemetry.log("JSON: Could not save to S3: " + res.body);
		        }
		    });
		    req.end(buf);
		    
		// Else write buffer to log
		} else {
		    var log = fs.createWriteStream(self.buffer + self.config.input + "_" + logfile, { encoding: "utf8" });
	        log.write(buf);
	        log.on('close', function() {
	            fs.rename(self.buffer + self.config.input + "_" + logfile, 
	                self.archive + self.config.input + "_" + logfile, 
	                function(err) {
	                   if (err) {
	                       console.error("JSON: ", err);
	                   }
	                }
	            );
	        });
	        log.destroySoon();
		}
	};
	
	self.config = config;
	if (config.s3 !== undefined) {
	    self.s3client = knox.createClient(config.s3);
	} else {
	    self.buffer = self.config.buffer || __dirname + "/buffer/";
	    self.archive = self.config.archive || __dirname + "/archive/";
	}
	
	// Set up log rotation
	self.interval = config.interval || 30000;
	setInterval(function() {
		self.rotateLog();
	}, self.interval);
    
    /**
     * Post a message to the telemetry server
     * Required method
     */
    self.post = function(data) {
    	// Pull selected fields out of data and write as CSV row
    	var transaction = JSON.stringify(data) + '\n';
    	if (self.cache.length < self.cacheLength + Buffer.byteLength(transaction)) {
            var cache = self.cache;
            self.cache = new Buffer(cache.length * 2);
            cache.copy(self.cache, 0, 0, cache.length - 1);
            console.log("Expanding cache for ", self.input, "to", cache.length * 2);
    	}

        self.cache.write(transaction, self.cacheLength, Buffer.byteLength(transaction), "utf8");
        self.cacheLength += Buffer.byteLength(transaction);
    };
};