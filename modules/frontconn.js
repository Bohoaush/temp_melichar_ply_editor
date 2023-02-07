var http = require("http");
var fs = require("fs");

var fileinfo = require("./fileinform.js");
var filehandle = require("./filehandler.js");

http.createServer(async function (req, res) {
    switch(req.url) {
            
        case "/save":
            var receivedData = "";
            req.on('data', function(data) {
                receivedData += data;
            });
            req.on('end', function() {
                receivedData = JSON.parse(receivedData);
                filehandle.writePlyToFile(receivedData.ply, (receivedData.name));
            });
            res.end();
            break;
            
        case "/clips":
            var retObj = {}
            fileinfo.ccgtunnel.cls().then(retCls => {
                retObj.status = "ok";
                console.log(retCls);
                retObj.data = retCls.response.data;
                res.write(JSON.stringify(retObj));
                res.end();
                console.log(retObj);
            }).catch(err => {
                console.log(err);
                retObj.status = "err";
                retObj.data = JSON.stringify(err);
                res.end();
            });
            break;
            
        case "/plys":
            filehandle.listAvailablePlys().then(filenames => {
                res.write(JSON.stringify(filenames));
                res.end();
            }).catch(err => {
                console.log(err);
                res.end();
            });
            break;
            
        case "/open":
            var opnPlyName = "";
            req.on('data', function(data) {
                opnPlyName += data;
            });
            req.on('end', function() {
                filehandle.loadPlyFromFile(opnPlyName).then(ply => {
                    res.write(JSON.stringify(ply));
                    res.end();
                }).catch(err => {
                    console.log(err);
                    res.end();
                });
            });
            break;
            
        case "/copy":
            fs.readFile("fileCopier.html", function(err, data) {
                if (err) {
                    res.writeHead(500);
                    res.end();
                } else {
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.write(data);
                    res.end();
                }
            });
            break;
            
        case "/copylog":
            fs.readFile("modules/filecopier/copylog.txt", function(err, data) {
                if (err) {
                    res.writeHead(500);
                    res.end();
                } else {
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.write(data);
                    res.end();
                }
            });
            break;
            
        case "/getWantfiles":
            fs.readFile("modules/filecopier/wantfiles.list", function(err, data) {
                if (err) {
                    res.writeHead(500);
                    res.end();
                } else {
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.write(data);
                    res.end();
                }
            });
            break;
            
        case "/pushWantfiles":
            var newWantfiles = "";
            req.on('data', function(data) {
                newWantfiles += data;
            });
            req.on('end', function() {
                fs.writeFile("modules/filecopier/wantfiles.list", newWantfiles, (err) => {
                    if (err) {
                        res.writeHead(500);
                        res.end();
                    } else {
                        res.writeHead(200, {'Content-Type': 'text/html'});
                        res.write(newWantfiles);
                        res.end();
                    }
                });
            });
            break;
            
        case "/copyfile":
            //TODO
            break;
            
        default:
            fs.readFile("editor.html", function(err, data) {
                if (err) {
                    res.writeHead(500);
                    res.end();
                } else {
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.write(data);
                    res.end();
                }
            });
            break;
        
    }
}).listen(8087);
