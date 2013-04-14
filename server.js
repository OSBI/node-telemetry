// Import libs
var cluster = require("cluster"),
    http = require("http");
global.helpers = require(__dirname + '/helpers.js');

// Get the telemetry server
process.env.startUp = helpers.ISODateString(new Date());
var port = process.argv[2] ? parseInt(process.argv[2]) : 80;
var workerTimeout = process.env.TELEMETRY_WORKER_TIMEOUT || 5000;

// Cluster the server
var numWorkers = parseInt(process.env.TELEMETRY_WORKERS) || require('os').cpus().length;
if (process.env.TELEMETRY_USER) {
    process.setuid(process.env.TELEMETRY_USER);
}
if (cluster.isMaster) {
    
    // Fork workers
    process.title = "telemetry-master";
    process.workers = [];
    process.workersListening = 0;
    for (var i = 0; i < numWorkers; i++) {
        process.workers[i] = cluster.fork();
    }

    // Restart workers when they die
    cluster.on('death', function(worker) {
        process.workers.splice(process.workers.indexOf(worker), 1);
        if (worker.suicide !== true) { 
            cluster.fork();
            console.log("Telemetry worker with PID", worker.pid, "died. Respawning.");
        }
    });
    
    // Do a graceful restart of workers
    process.on('SIGUSR2', function (){
        var workerLength = process.workers.length;
        for (var i = 0; i < workerLength; i++) {
            process.workers[i].suicide = true;
            process.workers[i].send({ cmd: "shutdown" });
            process.workers[i]._channel.close();
        }
        
        for (var j = 0; j < workerLength; j++) {
            process.workers.push(cluster.fork());
        }
    });
    
    // Pull a shakespeare
    process.on('SIGTERM', function() {
        process.workers.forEach(function(worker) {
            worker.kill();
        });
        process.exit(0);
    });
    
    console.log("Telemetry master with PID", process.pid, "listening on port", port);
} else {
    // Start server on worker
    var app = require(__dirname + '/app').listen(port);
    process.title = "telemetry-worker";
    console.log("Telemetry worker with PID", process.pid, "operational");
    
    // Listen for shutdown signal
    process.on('message', function(msg) {
        if (msg.cmd && msg.cmd == "shutdown") {
            app.on('close', function() {
                console.log("Shutting down telemetry worker with PID", process.pid);
                setTimeout(function() {
                    process.exit(0);
                }, workerTimeout);
            });
            app.close();
            
            process.title = "telemetry-worker-defunct";
        }
    });
}