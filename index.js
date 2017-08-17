'use strict';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
let fs = require('fs'),
	http = require('http'),

	LISTEN_HOSTNAME = '0.0.0.0',
	LISTEN_PORT = 8080,

	DUMP_FILE_PATH = 'dumpdata.txt',

	ACK_HTTP_CODE = 200,
	ACK_CONTENT_TYPE = 'text/plain',
	ACK_MESSAGE = 'HELLO';


{
	let server = http.createServer((request,response) => {

		// start of new HTTP request
		let requestDataSlabList = [],
			httpMethod = request.method.toUpperCase(),
			requestURI = request.url;

		// summary request details
		console.log(`Incoming request\nMethod: ${httpMethod}\nURI: ${requestURI}`);

		// wire up request events
		request.on('data',(data) => {

			// add received data to buffer
			requestDataSlabList.push(data);
		});

		request.on('end',(data) => {

			// send response to client
			response.writeHead(
				ACK_HTTP_CODE,
				{'Content-Type': ACK_CONTENT_TYPE}
			);

			response.end(`${ACK_MESSAGE}\n`);

			// write/append received request to file
			let headerItemList = [],
				dataSlab = requestDataSlabList.join('');

			for (let headerItem of Object.keys(request.headers).sort()) {
				headerItemList.push(`\t${headerItem}: ${request.headers[headerItem]}`);
			}

			fs.appendFile(
				DUMP_FILE_PATH,
				`Method: ${httpMethod}\nURI: ${requestURI}\n` +
				`Headers:\n${headerItemList.join('\n')}\n\n${dataSlab}\n\n\n`,
				(err) => {

					// end of HTTP request
					console.log(`End of request, ${dataSlab.length} bytes received.\n`);
				}
			);


			console.log(`Sending to ${process.env.PROXY_URL}`);

			var requestClient = require('request');
			var clientServerOptions = {
                uri: process.env.PROXY_URL,
                body: dataSlab,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
            requestClient(clientServerOptions, function (error, response) {
                console.log(error,response.body);
                return;
            });


		});
	});

	// start listening server
	console.log(`Listening on ${LISTEN_HOSTNAME}:${LISTEN_PORT}\n`);
	server.listen(LISTEN_PORT,LISTEN_HOSTNAME);
}
