
var http = require('http');
var querystring = require('querystring');
var controller = require('./controller');
var helper = require('./helper');

var isFileReg = /^.+\.[^\d]+.+$/;

http.createServer(function (request, response) {
    if(isFileReg.test(request.url)){
        helper.loadFile(request.url, function (err, data) {
            if(err){
                response.writeHead(404);
                response.end();
            }
            response.writeHead(200, {
                'Content-Type': helper.getMIME(request.url),
            });
            response.end(data);
        });
    }else{
        controller(request, response);
    }
}).listen(3003);
