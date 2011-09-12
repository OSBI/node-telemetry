The goal of node-telemetry is to make it really easy to deploy a scalable telemetry
server for small projects. This can be used to capture errors, performance data,
and more, and store it in a document store or on the filesystem.

To install telemetry, run

    npm install -g telemetry

then edit your config.yaml, and run telemetry:

    telemetry

An example config.yaml is provided below:

    errors:
      -
        type: couchdb
        host: user.cloudant.com
        username: user
        password: password

You may place this in the same directory as telemetry, or pass it via the 
TELEMETRY_CONFIG environment variables like so:

    export TELEMETRY_CONFIG=~/.telemetry; telemetry

Events can be sent to node-telemetry by any HTTP client capable of a POST. For
javascript on the browser, you can use [janky.post](https://github.com/pyronicide/janky.post).

If you are interested in creating additional backends for telemetry, or need 
general assistance, contact me using the e-mail address displayed when you do 

    npm author ls telemetry

node-telemetry is released under the terms of the MIT license.

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