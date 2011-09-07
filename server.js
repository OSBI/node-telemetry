// Import libraries
var express = require('express');
var Backbone = require('backbone');
var yaml = require('yaml');
var fs = require('fs');
var headers = {
    accept:'application/json', 
    'content-type':'application/json'
};

// Load listeners
var listeners = {};
var listener_files = fs.readdirSync(__dirname + "/listeners");
for (var i = 0; i < listener_files.length; i++) {
    var listener = listener_files[i].replace('.js', '');
    window[listener] = require(listener);
}

//Load configuration and inputs
var telemetry = new require(__dirname + '/telemetry')(config);

// Create the telemetry server and assign inputs
var app = express.createServer();
app.post('/input/:input', telemetry.new_event);

// Start the telemetry server