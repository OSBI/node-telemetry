var Backbone = require('backbone');

exports = module.exports = Backbone.Model.extend({
    /**
     * The inputs that are listening on this server
     */
    inputs: {},
    
    /**
     * Read in configuration and set up inputs
     * @param config
     */
    initialize: function(config) {
        // Load inputs
    },
    
    /**
     * Post a new event to the server
     * @param req
     * @param res
     * @param next
     */
    new_event: function(req, res, next) {
        var input = req.params.input;
        if (! input in this.inputs) {
            // Bad input, send 404
            res.end('', 404);
        }
        
        // Send success
        res.end('', 200);
        this.inputs[input].trigger('event:new', req.body);
    }
});