var Backbone = require('backbone');
var _ = require('underscore');

exports = module.exports = Backbone.Model.extend({
    /**
     * The inputs that are listening on this server
     */
    inputs: {},
    
    /**
     * Read in configuration and set up inputs
     * @param config
     */
    initialize: function(args, config) {
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
        
        // Ensure that inputs are available in routes
        _.bindAll(this, "new_event");
    },
    
    /**
     * Post a new event to the server
     * @param req
     * @param res
     * @param next
     */
    new_event: function(req, res, next) {
        var input = req.params.input;
        if (this.inputs[input] === undefined) {
            // Bad input, send 404
            res.end('', 404);
            return;
        }
        
        // Send success
        var data = JSON.parse(req.body.source.replace('castor ', ''));
        this.inputs[input].trigger('event:new', data);
        res.end('', 200);
    }
});