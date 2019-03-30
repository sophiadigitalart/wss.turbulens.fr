var http = require('http');
var server = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    var message = 'NodeJS ' + process.versions.node + '\n',
        version = ' port ' + process.env.port + '\n',
        response = [message, version].join('\n');
    res.end(response);
});
server.listen();