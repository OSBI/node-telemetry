var telemetry = exports = module.exports = function(config) {
    /**
     * The inputs that are listening on this server
     */
    this.inputs = {};
    
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
                    var listener = new (global[config[i][j].type])(listener_config);
                    this.inputs[i].push(listener);
                    console.log(config[i][j].type, "listening for events on " +
                    		"input called", i);
                } catch (e) {
                    console.error("Could not load", config[i][j].type, "listener [", e.message, "]");
                }
            }
        }
    }
};