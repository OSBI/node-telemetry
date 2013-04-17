# Sending data

Events can be sent to node-telemetry by any HTTP client capable of sending a POST
of valid JSON or urlencoded data.

## Input-specific upload

url: /input/[input]

You can POST a document to a specific input by using the input-specific upload. 
The body of the request will be queued up for persistence as the document itself. 
There is no required structure except that it must be valid JSON. You may also send 
key=>value pairs in urlencoded format for simpler data, as long as you use the correct 
mimetype.

## Bulk upload

url: /input 

You can also push up more than one event using the bulk input.  Specify an 'input' property
in each event and wrap them into an array assigned to the 'data' property in your JSON  POST.
The example below shows JSON for three different events being pushed to three different endpoints
all in one bulk input call.

    { "data":
        [
            {   "input":"errors",
                "level":"log",
                "message":"Invalid identifier: theCheat",
                "lineNumber": 25,
                "file": "strongbad.js"
            },
            {   "input":"tracker",
                "referrer":"http://example.com/",
                "timestamp": 1326736316365,
                "user": "HomeStar Runner"
            },
            {   "input":"changes",
                "setting":"emailpref",
                "newsetting":"SpamMe",
                "email": "junk@mail.com"
            }
        ]
    }

## Possible responses

Successful POST to input-specific upload
    HTTP/1.1 200

Successful POST to bulk upload
    HTTP/1.1 200
    {"processed":1,"errors":0}
    
Successful POST to bulk upload, with errors (see "Error handling" for more information)
    HTTP/1.1 200
    {"processed":0,"errors":1}

Input-specific with unknown input
    HTTP/1.1 404
    {"error":"The input you specified could not be found."}

Bulk upload with missing 'data' element in the JSON
    HTTP/1.1 415
    { error: 'Transactions must be in a JSON array called data in order to be processed.' }