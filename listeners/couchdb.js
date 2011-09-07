var Backbone = require('backbone');

var Event = exports.event = Backbone.Model.extend({
    url: function() {
        return 'http://' + this.get('username') + ':' + this.get('password') +
            '@' + this.get('host') + ':' + this.get('port') + 
            '/' + this.get('database');
    }
});

exports.events = Backbone.Collection.extend({
    model: Event,
    url: function() {
        return 'http://' + this.get('username') + ':' + this.get('password') +
            '@' + this.get('host') + ':' + this.get('port') + 
            '/' + this.get('database') + '/_all_docs';
    }
});