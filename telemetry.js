var Backbone = require('backbone');
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
            this.inputs[i] = _.extend({
                name: i
            }, Backbone.Events);
            this.inputs[i].listeners = [];
            
            // Initialize listeners for this input
            for (var j = 0; j < config[i].length; j++) {
                try {
                    var listener = new (global[config[i][j].type])(config[i][j],
                    {
                        input: this.inputs[i]
                    });
                    this.inputs[i].listeners.push(listener);
                } catch (e) {
                    console.error("Could not load", config[i][j].type, e.message);
                }
            }
        }
    }
};