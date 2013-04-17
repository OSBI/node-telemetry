// Put all your configuration for tests in the ../testconfig.js file
var config = require("../testconfig.js");
var testinputs = config.inputs;
var assert = require('assert');
var couchlistener = false;
var csvlistener = false;
global.helpers = require(__dirname + '/../helpers.js');

// Load up the listeners files that are enabled.
for(var endpoint in testinputs){
    for(var i in testinputs[endpoint]){
        if(config["test"+testinputs[endpoint][i].type]){
            try{
                // Telemetry requires these to be in global.
                global[testinputs[endpoint][i].type] =  require("../listeners/" + testinputs[endpoint][i].type+".js");
            }catch (loaderror){
                console.error("Unable to load listener: "+testinputs[endpoint][i].type+" : Error : "+loaderror.message);
            }
        }else{
            delete testinputs[endpoint][i];
        }
    }
}
var telemetry = new (require('../telemetry.js'))(testinputs);
telemetry.status = 'operational';
telemetry.startup = new Date();
telemetry.errors = 0;
telemetry.shutdownTimeout = 3000;
// the listeners required 'telemetry' to be in the global scope but since we're calling this with mocha, we need to put it there.
global["telemetry"] = telemetry;
// Find our couch and csv listener objects so we can test them.
for(var endpoint in telemetry.inputs){
    for(var i in telemetry.inputs[endpoint]){
        if(telemetry.inputs[endpoint][i].config.type == 'couchdb'){
            couchlistener = telemetry.inputs[endpoint][i];
        }else if(telemetry.inputs[endpoint][i].config.type == 'csv'){
            csvlistener = telemetry.inputs[endpoint][i];
        }
    }
}

// Now the actual tests.
suite('Telemetry Lib', function(){
    setup(function(){
    });
    suite('Verify Setup', function(){
        test('status is operational', function(){
            assert.equal(telemetry.status, 'operational', "Telemetry lib setup is not operational");
        });
        test('startup is a date object', function(){
            assert.ok(telemetry.startup instanceof Date, "Telemetry lib setup startup is not a date object");
        });
        test('errors is 0', function(){
            assert.equal(telemetry.errors, 0, "Telemetry lib errors is not 0");
        });
        test('shutdownTimeout is 3000', function(){
            assert.equal(telemetry.shutdownTimeout, 3000, "Telemetry lib shutdownTimeout is not 3000");
        });
    });
    suite('Method Tests', function(){
        var req = {params:{input:'test'},
                   body:{level: "log",
                         message: "Invalid identifier: theCheat",
                         lineNumber: 25,
                         file:"strongbad.js"
                        }
                  };
        var bulkreq = {body:
                         {data:
                             [
                                {input:"test",
                                 level: "debug",
                                 message: "1+1=3",
                                 lineNumber: 31,
                                 file:"falsetto.js"
                                },
                                {input:"test",
                                 level: "error",
                                 message: "No email found",
                                 lineNumber: 65,
                                 file:"homestarrunner.js"
                                }
                             ]
                         }
                      };

        test('status check', function(done){
            var res = {send:function(info){
                assert.equal(info.status, telemetry.status, "status check failed");
                assert.equal(info.startup, process.env.startup, "startup check failed");
                assert.equal(info.errors, telemetry.errors, "errors check failed");
                assert.equal(info.last_error, undefined, "last error check failed");
                assert.deepEqual(info.inputs, Object.keys(testinputs), "inputs check failed");
                done();
            }};
            telemetry.get_status(null, res, null);
        });
        test('isodate check', function(){
            var d = new Date('2012-01-01T01:02:03+04:00');
            assert.equal(helpers.ISODateString(d), '2011-12-31T21:02:03+00:00', "ISO date string failed");
        });
        test('post check', function(done){
            if(!config.testcouchdb && !config.testcsv){
                assert.ok(false, "No listeners configured in testconfig.js");
            }else{
                var res = {send:function(info, status){
                    assert.equal(info, '', "post return failed");
                    assert.equal(status, 200, "post status failed");
                    done();
                }};
                telemetry.post_message(req, res, null);
            }
        });
        test('post bulk check', function(done){
            if(!config.testcouchdb && !config.testcsv){
                assert.ok(false, "No listeners configured in testconfig.js");
            }else{

                var res = {send:function(info, status){
                    assert.equal(info.processed, 2, "post return failed");
                    assert.equal(info.errors, 0, "post return failed");
                    assert.equal(status, 200, "post status failed");
                    done();
                }};
                telemetry.bulk_load(bulkreq, res, null);
            }
        });
        if(config.testcouchdb && couchlistener){
            test('post couch verify', function(){
                if(couchlistener.cache && couchlistener.cache.length > 0){
                    console.log(bulkreq);
                    assert.equal(couchlistener.cache[0].level, req.body.level, "Couchdb listener cache single post field failed");
                    assert.equal(couchlistener.cache[1].lineNumber, bulkreq.body.data[0].lineNumber, "Couchdb listener cache bulk post field failed (" + couchlistener.cache[1].lineNumber + " != " + bulkreq.body.data[0].lineNumber + ")");
                }else{
                    assert.ok(false, "Couchdb listener cache is empty");
                }
            });
            test('couchdb flush check', function(done){
                //nock.recorder.rec();
                couchlistener.flush_cache();
                setTimeout(function(){
                    var message = '';
                    if(telemetry.errors > 0) message  = telemetry.last_error.message;
                    assert.equal(telemetry.errors, 0, "Couchdb flush caused errors: "+ message);
                    assert.equal(couchlistener.cache, 0, "Couchdb flush failed: "+ message);
                    done();
                }, 200);
            });
        }else{
            test('couch listener', function(){
                console.log('CouchDB listener not tested.');
            });
        }
        if(config.testcsv && csvlistener){
            var csvfile = false;
            test('post csv verify', function(){
                setTimeout(function() {
                    var fs = require('fs');
                    var csv_files = fs.readdirSync(__dirname);
                    console.log(csv_files);
                    for (var i = 0; i < csv_files.length; i++) {
                        var csv = csv_files[i];
                        if(csv.charAt(0) == 'c' && csv.charAt(csv.length-1) == 'v'){
                            csvfile = csv;
                        }
                    }
                    if(csvfile){
                        var data = fs.readFileSync(__dirname+"/"+csvfile, 'utf8');
                        var lines = data.split('\n');
                        assert.ok(lines[0].indexOf(req.body.message) > -1, "CSV data doesn't contain single post expected string");
                        assert.ok(lines[1].indexOf(bulkreq.body.data[0].lineNumber) > -1, "CSV data doesn't contain bulk post expected string");
                        // Clean up our csv file.
                        fs.unlink(__dirname+"/"+csvfile, function(error){
                            if(error){
                                console.error('Unable to remove test csv file: '+error.message);
                            }
                        });
                    }else{
                        assert.ok(false, "CSV file not found");
                    }
                }, 200);
            });
        }else{
            test('csv listener', function(){
                console.log('CSV listener not tested.');
            });
        }
    });
});
