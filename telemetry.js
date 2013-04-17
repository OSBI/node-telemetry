var util = require("util");
var os = require("os");

try {
    var geoip = require('geoip');
    var country = new geoip.Country(process.env.TELEMETRY_GEOIP_DATABASE || __dirname + '/GeoIP.dat');
} catch(e) { var geoup = null; }

var telemetry = exports = module.exports = function(config) {

    /**
     * The inputs that are listening on this server
     */
    this.inputs = {};
    
    /**
     * Show the current status of the node
     */
    this.get_status = function(req, res, next) {
        res.send({
            status: this.status,
            startup: process.env.startUp,
            errors: this.errors,
            last_error: this.last_error || undefined,
            inputs: Object.keys(this.inputs)
        });
        return true;
    };
    
    /**
     * Add metadata to an incoming transaction for debugging purposes
     */
    this.add_metadata = function(transaction, req, bulk_loaded) {
        if (this.log_metadata === true) {
            transaction.metadata = {};
            transaction.metadata['user-agent'] = req.headers['user-agent'] || "";
            transaction.metadata['x-forwarded-for'] = req.headers['x-forwarded-for'] || "";
            transaction.metadata.ip = req.connection.remoteAddress;
            transaction.metadata.bulk_loaded = bulk_loaded;
            
            // Geocode IP address and attach to request
            try {
                if (geoip !== null && country !== undefined) {
                    var ips = [ req.connection.remoteAddress ];
                    if (req.headers['x-forwarded-for'] !== undefined) {
                        ips = ips.concat(req.headers['x-forwarded-for'].split(","));
                    }
                    for (var i = 0; i < ips.length; i++) {
                        if (! transaction.metadata.country) {
                            var lookup = country.lookupSync(ips[i]);
                            if (lookup !== null) {
                                transaction.metadata.country = lookup.country_code;
                            }
                        }
                    }
                }
            } catch (e) { console.log(e.message); }
        }
        
        return transaction;
    };
    
    /**
     * Notify all listeners of a new message on an input
     * Called by post_message and bulk_load
     */
    this.process_message = function(input, data) {
        // Notify listeners of new data
        if (this.inputs[input] === undefined) return;
        for (var i = 0; i < this.inputs[input].length; i++) {
            this.inputs[input][i].post(data);
        }
    };
    
    /**
     * Post an individual message to an input
     */
    this.post_message = function(req, res, next) {
        var input = req.params.input;
        if (this.inputs[input] === undefined) {
            // Bad input, send 404
            res.send({ error: 'The input you specified could not be found.' }, 404);
            return;
        }
        
        if (req.body === undefined) {
            // Bad input, send 404
            res.send({ error: 'No body was received by telemetry. Please ensure you are sending a Content-Type header.' }, 400);
            return;
        }
        
        if (this.inputs[input].length === 0) {
            // No listeners, send 500
            res.send({ error: 'There are no listeners on this input.' }, 500);
            return;
        }
        
        // Optionally include request metadata
        var data = req.body;
        if (this.log_metadata === true) {
            data = this.add_metadata(data, req, false);
        }
        
        this.process_message(input, data);
        
        // Send success
        res.send('', 200);
    };
    
    /**
     * Bulk load data and collate by input
     */
    this.bulk_load = function(req, res, next) {
        if (req.body === undefined || req.body.data === undefined) {
            // Bad request, send "Unsupported Media Type"
            res.send({ error: 'Transactions must be in a JSON array called data in order to be processed.' }, 415);
            return;
        }
        
        // Process as much of the incoming data as possible
        var records = req.body.data.length;
        var data = req.body.data.slice(0);
        var processed = 0;
        for (var i = 0; i < data.length; i++) {
            var transaction = data[i];
            var error = false;
            
            // Input must be specified for each transaction
            if (transaction.input === undefined) {
                error = true;
            }
            
            // Ensure that input is valid
            if (this.inputs[transaction.input] === undefined) {
                error = true;
            }
            
            // Optionally include request metadata on each transaction
            if (this.log_metadata === true) {
                transaction = this.add_metadata(transaction, req, false);
            }
            
            // If there are no errors, process the transaction
            if (error === false) {
            	processed++;
            	this.process_message(transaction.input, transaction);
          	}
        }
        
        // Send results of bulk load
        res.send({
            processed: processed,
            errors: records - processed
        }, 200);
    };
    
    /**
     * Log error to telemetry_errors input if defined
     * @message {Object} The message to be logged
     * @options {Object} Logging options
     * 
     * Available options:
     * - error {Boolean} whether or not to include a stack trace
     */
    this.log = function(message, options) {
        // Create logging payload
        var data = {
            time: new Date(),
            message: message,
            host: options && options.host ? options.host : undefined,
            freemem: os.freemem(),
            loadavg: os.loadavg()
        };
        
        // Optionally include a stack trace
        if (options && options.error !== undefined) {
            data.trace = util.inspect(new Error().stack);
        }
        
        // Notify the system of the error
        this.process_message("telemetry_errors", data);
    };
    this.error = function(message, options) {
        if (! options) options = {};
        options.error = true;
        this.log(message, options);
    };
    
    /**
     * Read in configuration and set up inputs
     * @param config
     */
    // Load inputs
    for (var i in config) {
        if (config.hasOwnProperty(i)) {
            this.inputs[i] = [];
            
            // Initialize listeners for this input
            for (var j = 0; j < config[i].length; j++) {
                try {
                    var listener_config = config[i][j];
                    listener_config.input = i;
                    
                    // Initialize class defined in config
                    var listener = new (global[config[i][j].type])(listener_config);
                    
                    // Add listener to input
                    this.inputs[i].push(listener);
                } catch (e) {
                    // If listener failed to load, log error and continue initializing
                    this.error("Could not load " + config[i][j].type + "listener [" + e.message + "]");
                }
            }
        }
    }
};
