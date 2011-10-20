var fs = require('fs');
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
		self.log.write(null);
		
		// Push log file to archive
		if (self.oldLog) {
			self.oldLog.on('close', function() {
				fs.rename(self.oldLogfile, self.config.archive + self.config.input + timestamp + seed + ".csv", function(err) {
					if (! err) fs.unlink(self.oldLogfile);
				});
			});
			
			self.oldLog.destroySoon();
		}
	};
	
	if (! config.fields) throw { message: "You must specify the fields to extract from the incoming data" };
	var self = this;
	self.config = config;
	self.rotateLog();
	self.interval = config.interval || 3600000;
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