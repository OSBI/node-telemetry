/*
 * Sample config:
 *      {
 *          type: 'postgresql',
 *          host: '127.0.0.1',
 *          schema: 'warehouse',
 *          username: 'postgres',
 *          bufferTime: 1000,
 *          batchLength: 10000,
 *          fields: ["timestamp", "message", "ip"]
 *      }
 */

exports = module.exports = function(config) {
    var pg = require('pg').native;
    var self = this;
    self.cache = [];
    self.config = config;
    self.batchLength = config.batchLength || 1000;
    self.minBatchLength = config.batchLength || 1000;
    self.bufferTime = config.bufferTime || 30000;
    self.queries = 0;
    self.queriesCompleted = 0;
    
    self.url = function(config) {
        var url = "tcp://";
        
        if (config.username) {
            url += encodeURIComponent(config.username);
        }
        
        if (config.password) {
            url += ":" + encodeURIComponent(config.password);
        }
        
        if (config.username || config.password) {
            url += "@";
        }
        
        url += encodeURIComponent(config.host);
        
        if (config.port) {
            url += ":" + parseInt(config.port);
        }
        
        url += "/";
        url += config.schema ? config.schema : "postgres";
        
        return url;
    };
    
    /**
     * Connect to the database
     */
    self.connect = function(cb) {
        pg.connect(self.url(self.config), function(err, client) {
            if (err) {
                console.log("Could not connect to PostgreSQL database.", err);
            } else {
                console.log("Connected to PostgreSQL database for input", self.config.input);
                self.db = client;
                if (cb) cb();
            }
        });
    };
    self.connect();
    
    /**
     * Bulk insert into postgres
     */
    self.flush_cache = function() {
        // Remove all docs from the cache, but leave cache available to incoming requests
        var batch = self.cache.splice(0, self.batchLength);
        var vars = [];
        if (batch.length === 0) return;
        
        // Build up statement
        var statement = "INSERT INTO " + self.config.input + " (";
        statement += self.config.fields.join(",") + ") VALUES ";
        var count = 1;
        var batchLength = batch.length;
        for (var i = 0; i < batchLength; i++) {
            var row = batch.splice(0, 1)[0];
            var rowLength = row.length;
            statement += "(";
            for (var j = 0; j < rowLength; j++) {
                statement += "$" + count;
                count++;
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
        
        // Insert rows into postgres
        console.log(batchLength, self.cache.length , self.batchLength, self.queriesCompleted , self.queries);
        self.queries++;
        
        if (self.cache.length > self.batchLength && self.batchLength < 20000) {
            self.batchLength += Math.ceil(self.minBatchLength / 2);
        } else if (self.batchLength > self.minBatchLength){
            self.batchLength -= Math.ceil(self.minBatchLength / 10);
        }
        
        try {
            self.db.query(statement, vars, function(err, result) {
                self.queriesCompleted++;
                
                if (err) {
                    self.error(err, batch);
                }
            });
        } catch (e) {
            self.error(e, batch);
        }
    };
    
    /**
     * Report an error and retry
     * @param data
     */
    self.error = function(err, batch) {
        self.cache = self.cache.concat(batch);
        telemetry.errors++;
        telemetry.last_error = {
            time: new Date(),
            message: "PostgreSQL bulk insert failed for input `" + self.config.input + "` (" + err.message + ")"
        };
        telemetry.error({
            type: "postgresql",
            error: err,
            batch_size: batch.length
        });
        //self.db.close();
        self.connect();
    };
    
    /**
     * Post a message to the telemetry server
     * Required method
     */
    self.post = function(data) {
        // Pull selected fields out of data and write to cache
        var row = [];
        for (field in self.config.fields) {
            if (data[self.config.fields[field]] !== undefined) {
                row.push(data[self.config.fields[field]]);
            } else if (data.metadata[self.config.fields[field]] !== undefined) {
                row.push(data.metadata[self.config.fields[field]]);
            } else {
                row.push(null);
            }
        }
        
        // Push to cache
        self.cache.push(row);
    };
    
    /**
     * Flush cache periodically
     */
    setInterval(function() {
        self.flush_cache();
    }, self.bufferTime);
};