// Import libraries
var express = require('express');
var yaml = require('yaml');
var fs = require('fs');
global._ = require('underscore')._;

// Load listeners
var listener_files = fs.readdirSync(__dirname + "/listeners");
for (var i = 0; i < listener_files.length; i++) {
    var listener = listener_files[i];
    global[listener.replace('.js', '')] = 
        require(__dirname + "/listeners/" + listener);
}

// Load configuration and inputs
var config = yaml.eval(fs.readFileSync(__dirname + "/config.yaml", 'utf8'));  //FIXME - this is just for testing. the real file should be in home dir
global.telemetry = new (require(__dirname + '/telemetry'))(config);

// Create the telemetry server and assign inputs
var app = express.createServer();
app.use(express.bodyParser());
app.post('/input/:input', function(req, res, next) {
    var input = req.params.input;
    if (telemetry.inputs[input] === undefined) {
        // Bad input, send 404
        res.end('', 404);
        return;
    }
    
    // Send success
    var data = JSON.parse(req.body.source.replace('castor ', ''));
    for (var i = 0; i < telemetry.inputs[input].length; i++) {
        telemetry.inputs[input][i].post(data);
    }
    res.end('', 200);
});

// Start the telemetry server
app.listen(process.argv[2] || 7000);