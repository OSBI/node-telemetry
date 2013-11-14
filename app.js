// Import libraries
var express = require('express');
var fs = require('fs');
var config =  require(process.env.TELEMETRY_CONFIG || __dirname + "/config.js");


// Load listeners
var listener_files = fs.readdirSync(__dirname + "/listeners");
for (var i = 0; i < listener_files.length; i++) {
    var listener = listener_files[i];
    global[listener.replace('.js', '')] = 
        require(__dirname + "/listeners/" + listener);
}

//Load configuration and inputs
// Create telemetry object
global.telemetry = new (require(__dirname + '/telemetry.js'))(config.inputs);
telemetry.status = 'operational';
telemetry.errors = 0;

// Log metadata on every transaction
telemetry.log_metadata = config.log_metadata === undefined ? 
    true : config.log_metadata === true;

// Determine how long to keep workers alive before killing them off
if (! telemetry.shutdownTimeout) telemetry.shutdownTimeout = 3000;

// Create the telemetry server
var options;
try {
    options = {
        key: fs.readFileSync(process.env.TELEMETRY_KEY || __dirname + '/telemetry-key.pem'),
        cert: fs.readFileSync(process.env.TELEMETRY_CERT || __dirname + '/telemetry-cert.pem')
    };
} catch (e) {}
var app = options === undefined ? 
        express() : 
        express(options);
var bodyParser = express.bodyParser();

// Properly handle errors
/*
app.error(function(err, req, res, next) {
    if (err instanceof SyntaxError) {
        res.send({ error: 'Could not parse data' }, 415);
    } else {
        res.send({ error: 'Internal Server Error' }, 500);
    }
});
*/
// Status page
app.all('/', function(req, res, next) {
    telemetry.get_status(req, res, next);
});

// Assign inputs for data collection
app.post('/input/:input', bodyParser, function(req, res, next) {
    telemetry.post_message(req, res, next);
});

// Create bulk load endpoint
app.post('/input', bodyParser, function(req, res, next) {
    telemetry.bulk_load(req, res, next);
});

module.exports = app;
