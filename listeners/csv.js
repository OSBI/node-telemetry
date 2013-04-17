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
    self.cache = [];
    
	/**
	 * Rotate the log
	 */
	self.rotateLog = function() {
	    if (self.cache.length === 0) return;
		var timestamp = (Math.floor((new Date()).getTime() / 1000) + "").substring(5);
		self.logfile = self.config.input + "_" + timestamp + "_" + process.pid + ".csv";
		
		// Push log file to S3
		if (self.s3client) {
            var buf = self.cache.splice(0).join("");
		    var req = self.s3client.put(self.logfile, {
		        'Content-Length': buf.length
		    ,   'Content-Type': 'text/plain'
		    });
		    req.on('response', function(res){
		        if (res.statusCode == 200) {
		            fs.unlink(self.oldLogfile);
		        } else {
		            telemetry.log("CSV: Could not save to S3: " + res.body);
		        }
		    });
		    req.end(buf);
		    
		// Else write buffer to log
		} else {
		    self.log = fs.createWriteStream(self.buffer + self.logfile);
		    var buf = self.cache.splice(0, 100000);
	        self.log.write(buf.join(""), "utf8");
	        self.log.on('close', function() {
	            fs.rename(self.buffer + self.logfile, self.archive + self.logfile, function(err) {
	                if (! err) fs.unlink(self.buffer + self.logfile);
	            });
	        });
	        self.log.destroySoon();
		}
	};
	
	if (! config.fields) { throw { message: "You must specify the fields to extract from the incoming data" }; }
	self.config = config;
	if (config.s3 !== undefined) {
	    self.s3client = knox.createClient(config.s3);
	} else if (config.archive !== undefined) {
	    self.buffer = self.config.buffer || '/tmp/';
	    self.archive = self.config.archive || __dirname + "/archive/";
	} else if (config.archive === undefined) {
	    throw { message: "You need to provide either an archive folder or an s3 bucket." };
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
    	var row = [];
    	for (field in self.config.fields) {
    	    if (data[self.config.fields[field]] !== undefined && data[self.config.fields[field]] !== "") {
                row.push(String(data[self.config.fields[field]]).replace(/\"/g,'&quot;'));
            } else if (data.metadata !== undefined && data.metadata[self.config.fields[field]] !== undefined) {
                row.push(String(data.metadata[self.config.fields[field]]).replace(/\"/g,'&quot;'));
            } else {
                row.push("");
            }
    	}
    	var raw_data = '"' + row.join('","') + '"\n';
    	self.cache.push(raw_data);
    };
};