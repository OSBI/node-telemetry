// Import libraries
global.$ = global.jQuery = require('jquery');
global._ = require('underscore')._;
global.Backbone = require('backbone');
var express = require('express');
var yaml = require('yaml');
var fs = require('fs');

// Load listeners
var listener_files = fs.readdirSync(__dirname + "/listeners");
for (var i = 0; i < listener_files.length; i++) {
    var listener = listener_files[i];
    global[listener.replace('.js', '')] = 
        require(__dirname + "/listeners/" + listener);
}

// Load configuration and inputs
var config = yaml.eval(fs.readFileSync(__dirname + "/config.yaml", 'utf8'));  //FIXME - this is just for testing. the real file should be in home dir
var Telemetry_object = require(__dirname + '/telemetry');
var telemetry = new Telemetry_object({}, config);

// Create the telemetry server and assign inputs
var app = express.createServer();
app.use(express.bodyParser());
app.post('/input/:input', telemetry.new_event);

// Start the telemetry server
app.listen(process.argv[2] || 7000);