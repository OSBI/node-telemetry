/*
 * Sample config:
 *      {
 *          type: 'mysql',
 *          host: '127.0.0.1',
 *          database: 'telemetry',
 *          user: 'root',
 *          password: '',
 *          bufferTime: 1000,
 *          batchLength: 10000,
 *          fields: ["timestamp", "message", "ip"]
 *      }
 */
exports = module.exports = function(config) {
    var mysql = require('mysql');
    var self = this;
    self.cache = [];
    self.config = config;
    self.batchLength = config.batchLength || 1000;
    self.bufferTime = config.bufferTime || 30000;
    self.flushing = false;
    
    /**
     * Connect to the database
     */
    self.db = mysql.createClient(self.config);
    self.db.useDatabase(self.config.database, function(err) {
        if (err) console.error(err);
    });
    
    /**
     * Bulk insert into postgres
     */
    self.flush_cache = function() {
        // Remove all docs from the cache, but leave cache available to incoming requests
        self.flushing = true;
        var batch = self.cache.splice(0, self.batchLength);
        var vars = [];
        if (batch.length === 0) return;
        
        // Build up statement
        var statement = "INSERT INTO " + self.config.input + " (`";
        statement += self.config.fields.join("`,`") + "`) VALUES ";
        var batchLength = batch.length;
        for (var i = 0; i < batchLength; i++) {
            var row = batch.splice(0, 1)[0];
            var rowLength = row.length;
            statement += "(";
            for (var j = 0; j < rowLength; j++) {
                statement += "?";
                if (j < rowLength - 1) statement += ",";
                vars.push(row[j]);
            }
            statement += ")";
            if (i < batchLength - 1) {
                statement += ",";
            } else {
                statement += ";";
            }
        }
        
        // Insert rows into database
        var query = self.db.query(statement, vars);
        query.on('end', function(result) {
            if (result !== null && result.warningCount > 0) {
                self.error(result, batch);
            } else if (self.cache.length > self.batchLength) {
                self.flush_cache();
            } else {
                self.flushing = false;
            }
        });
        
        query.on('error', function(err) {
            self.error(err, batch);
        });
    };
    
    /**
     * Report an error and retry
     * @param data
     */
    self.error = function(err, batch) {
        self.cache = self.cache.concat(batch);
        self.db.query("SHOW WARNINGS;", function(e, result) {
            telemetry.last_error = {
                time: new Date(),
                message: "MySQL bulk insert failed for input `" + self.config.input + "`",
                warnings: result,
                error: err
            };
            
            telemetry.error({
                type: "mysql",
                error: JSON.stringify(result),
                batch_length: batch.length
            });
            
            self.flushing = false;
        });
        telemetry.errors++;
    };
    
    /**
     * Post a message to the telemetry server
     * Required method
     */
    self.post = function(data) {
        // Pull selected fields out of data and write to cache
        var row = [];
        for (field in self.config.fields) {
            if (data[self.config.fields[field]] !== undefined && data[self.config.fields[field]] !== "") {
                row.push(data[self.config.fields[field]]);
            } else if (data.metadata !== undefined && data.metadata[self.config.fields[field]] !== undefined) {
                row.push(data.metadata[self.config.fields[field]]);
            } else {
                row.push(null);
            }
        }
        
        // Push to cache
        self.cache.push(row);
    };
    
    setInterval(function() {
        if (self.flushing === false && self.cache.length > 0) {
            self.flush_cache();
        }
    }, self.bufferTime);
};