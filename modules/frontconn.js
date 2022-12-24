var http = require("http");
var fs = require("fs");

var fileinfo = require("fileinform.js");
var filehandle = require("filehandler.js");

http.createServer(async function (req, res) {
    switch(req.url) {
            
        case "/save":
            var receivedData = "";
            req.on('data', function(data) {
                receivedData += data;
            });
            req.on('end', function() {
                receivedData = JSON.parse(receivedData);
                filehandle.writePlyToFile(receivedData.ply, (config.settings.plydir + receivedData.name));
            });
            res.end();
            break;
            
        case "/clips":
            var retObj = {}
            fileinfo.cls().then(retCls => {
                retObj.status = "ok";
                retObj.data = retCls.response.data;
                res.write(JSON.stringify(retObj));
                res.end();
            }).catch(err => {
                retObj.status = "err";
                retObj.data = JSON.stringify(err);
                res.end();
            });
            break;
            
        case "/plys":
            filehandle.listAvailablePlys().then(filenames => {
                res.write(JSON.stringify(filenames));
            }).catch(err => {
                //TODO
            }
            break;
            
        case "/open":
            var opnPlyName = "";
            req.on('data', function(data) {
                opnPlyName += data;
            });
            req.on('end', function() {
                filehandle.loadPlyFromFile(opnPlyName).then(ply => {
                    res.write(ply);
                    res.end();
                }).catch(err => {
                    //TODO
                });
            }).catch(err => { 
                //TODO
            });
            break;
            
        case "/copyfile":
            //TODO
            break;
        
    }
}).listen(config.settings,front_port);
