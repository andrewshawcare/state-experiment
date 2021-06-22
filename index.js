const http = require("http");
const fs = require("fs");

http.createServer((request, response) => {
    fs.readFile(__dirname + request.url, function (error,data) {
        if (error) {
            response.writeHead(404);
            response.end(JSON.stringify(error));
        } else {
            response.writeHead(200);
            response.end(data);
        }
    });
}).listen(8080);
