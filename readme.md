# Node-telemetry

The goal of node-telemetry is to make it really easy to deploy a scalable telemetry
server in a clustered environment. This can be used to capture errors, performance data,
and more from your web and mobile applications, and store it in a document store 
or on the filesystem.

## Getting started

To install telemetry, run

    npm install -g telemetry

then edit your config.js, and run telemetry:

    telemetry [port]

An example config.js is provided below (note that all keys are case-sensitive):

	var couch = {
	    type: 'couchdb',
	    host: 'localhost',
	    port: 5984,
	    protocol: "http",
	    username: 'admin',
	    password: 'password'
	};
	
	exports.inputs = {
	    test: [ couch ]
	};

You may place this in the same directory as telemetry, or pass it via the 
TELEMETRY_CONFIG environment variables like so:

    export TELEMETRY_CONFIG=~/.telemetry; telemetry [port]

## Sending data

Events can be sent to node-telemetry by any HTTP client capable of a POST. For
javascript on the browser, you can use [janky.post](https://github.com/pyronicide/janky.post).
Here's an example of what that would look like:

    var data = {
        level: "log",
        message: "Invalid identifier: theCheat",
        lineNumber: 25,
        file: "strongbad.js"
    };
    
    janky({
        url: "http://example.com/inputs/errors",
        method: "post",
        data: data,
        error: function() {
            console.log("Could not reach telemetry server");
        }
    });

A cURL example:

	$ curl -X POST -d @document -v http://localhost:8000/input/test
	* About to connect() to localhost port 8000 (#0)
	*   Trying 127.0.0.1... connected
	* Connected to localhost (127.0.0.1) port 8000 (#0)
	> POST /input/test HTTP/1.1
	> User-Agent: curl/7.19.7 (universal-apple-darwin10.0) libcurl/7.19.7 OpenSSL/0.9.8r zlib/1.2.3
	> Host: localhost:8000
	> Accept: */*
	> Content-Length: 34
	> Content-Type: application/x-www-form-urlencoded
	> 
	< HTTP/1.1 200 OK
	< x-powered-by: Express
	< content-type: text/html; charset=utf-8
	< content-length: 0
	< connection: close
	< 
	* Closing connection #0

## Additional documentation

Additional documentation is available under /docs:

- [Deployment](node-telemetry/blob/master/docs/deployment.md)
- [Sending data](node-telemetry/blob/master/docs/sending_data.md)

If you find the documentation lacking, are interested in creating 
additional backends for telemetry, or need general assistance, contact us 
using the e-mail address displayed when you do 

    npm author ls telemetry

## Licensing

node-telemetry is released under the terms of the _MIT license_.

Copyright (c) 2011 Mark Cahill

Permission is hereby granted, free of charge, to any person obtaining a copy of 
this software and associated documentation files (the "Software"), to deal in 
the Software without restriction, including without limitation the rights to 
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies 
of the Software, and to permit persons to whom the Software is furnished to do 
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all 
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 
SOFTWARE.