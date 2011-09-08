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

If you are interested in creating additional backends for telemetry, or need 
general assistance, contact me using the e-mail address displayed when you do 

    npm author ls telemetry

