exports.testcouchdb = true;
exports.testcsv = true;
exports.inputs = {
    test: [
        {
            type: 'couchdb', // Type can be 'couchdb' or 'csv'
            host: 'localhost',
            port: 5984,
            username: 'admin',
            password: 'password'
        },
        {
            type: 'csv',
            interval: 100,
            buffer: __dirname+"/test/csvtest",
            archive: __dirname+"/test",
            /*
            s3: {
                key: "mys3key",
                secret: "mys3secret",
                bucket: "my.bucket"
            },
            */
            fields: [ "file", "message", "lineNumber", "level" ]
        },
    ]};

