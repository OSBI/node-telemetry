var fs = require('fs');
exports = module.exports = function(config) {
	/**
	 * Rotate the log
	 */
	this.rotateLog = function() {
		var timestamp = Math.floor((new Date()).getTime() / 1000);
		self.oldLogfile = this.logfile;
		self.oldLog = self.log;
		self.logfile = self.config.buffer + self.config.input + timestamp + ".csv.part";
		self.log = fs.createWriteStream(self.logfile);
		
		// Push log file to archive
		if (self.oldLog) {
			self.oldLog.on('close', function() {
				fs.rename(self.oldLogfile, self.config.archive + self.config.input + timestamp + ".csv", function(err) {
					if (! err) fs.unlink(self.oldLogfile);
				});
			});
			
			self.oldLog.end();
		}
	};
	
	if (! config.fields) throw { message: "You must specify the fields to extract from the incoming data" };
	var self = this;
	self.config = config;
	self.rotateLog();
	this.interval = config.interval || 3600000;
	setInterval(function() {
		self.rotateLog();
	}, self.interval);
    
    /**
     * Post a message to the telemetry server
     * Required method
     */
    this.post = function(data) {
    	// FIXME - pull selected fields out of data and write as CSV row
    	var row = [];
    	for (field in self.config.fields) {
    		row.push(data[self.config.fields[field]]);
    	}
    	var raw_data = '"' + row.join('","') + '"\n';
    	self.log.write(raw_data, "utf8");
    };
};