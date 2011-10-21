var fs = require('fs');
var knox = require('knox');
exports = module.exports = function(config) {
	/**
	 * Rotate the log
	 */
	this.rotateLog = function() {
		var timestamp = (Math.floor((new Date()).getTime() / 1000) + "").substring(5);
		var seed = Math.floor(Math.random() * 99999);
		self.oldLogfile = this.logfile;
		self.oldLog = self.log;
		self.logfile = self.config.buffer + self.config.input + timestamp + seed + ".csv";
		self.log = fs.createWriteStream(self.logfile);
		
		// Push log file to archive
		if (self.oldLog) {
			self.oldLog.on('close', function() {
				if (self.s3client) {
					fs.readFile(self.oldLogfile, function(err, buf){
					    if (err) console.log("Could not open old log file");
					    if (buf.length > 0) {
    					    var req = self.s3client.put(self.config.input + timestamp + seed + ".csv", {
    					        'Content-Length': buf.length
    					    ,   'Content-Type': 'text/plain'
    					    });
    					    req.on('response', function(res){
    					        if (res.statusCode == 200) {
    					            fs.unlink(self.oldLogfile);
    					        } else {
    					            console.log("Could not save to S3:", res.body);
    					        }
    					    });
    					    req.end(buf);
					    }
					});
				} else if (self.config.archive) {
					fs.rename(self.oldLogfile, self.config.archive + self.config.input + timestamp + seed + ".csv", function(err) {
						if (! err) fs.unlink(self.oldLogfile);
					});
				}
			});
			
			self.oldLog.destroySoon();
		}
	};
	
	if (! config.fields) throw { message: "You must specify the fields to extract from the incoming data" };
	var self = this;
	self.config = config;
	if (config.s3) {
	    self.s3client = knox.createClient(config.s3);
	} else if (! config.archive) {
	    throw { message: "You need to provide either an archive folder or an S3 bucket" };
	}
	
	// Set up log rotation
	self.rotateLog();
	self.interval = config.interval || 10000; //3600000;
	setInterval(function() {
		self.rotateLog();
	}, self.interval);
    
    /**
     * Post a message to the telemetry server
     * Required method
     */
    this.post = function(data) {
    	// Pull selected fields out of data and write as CSV row
    	var row = [];
    	for (field in self.config.fields) {
    		row.push(data[self.config.fields[field]]);
    	}
    	var raw_data = '"' + row.join('","') + '","' + self.count + '"\n';
    	self.log.write(raw_data, "utf8");
    };
};