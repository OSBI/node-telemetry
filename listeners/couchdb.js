exports = module.exports = Backbone.Model.extend({
    initialize: function(args, options) {
        console.log("CouchDB loaded for", options.input.name);
        _.bindAll(this, "post");
        options.input.bind('event:new', this.post);
    },
    
    post: function(data) {
        console.log("DATA:", data);
        this.set(data);
        this.save();
    },
    
    url: function() {
        return 'https://' + this.get('username') + ':' + this.get('password') +
            '@' + this.get('host') + ':' + this.get('port') + 
            '/' + this.get('database');
    }
});