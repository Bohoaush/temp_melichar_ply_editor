var http = require("http");
var fs = require("fs");

var fileinfo = require("./fileinform.js");
var filehandle = require("./filehandler.js");
var filecopier = require("./filecopier/filecopier.js");

var authenticatedTokens = [];

function createToken() {
    let newToken = "aaabbbb";
    let length = 32;
    let chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (var i = length; i > 0; --i){
        newToken += chars[Math.floor(Math.random() * chars.length)];
    }
    authenticatedTokens.push(newToken);
    return newToken;
}

function expireToken(token) {
    authenticatedTokens.splice(authenticatedTokens.indexOf(token), 1);
}

function authenticate(sentPass) {
    return new Promise((resolve, reject) => {
        if (sentPass == filehandle.settings.http_pass) {
            console.log("authenticated");
            resolve(createToken());
        } else {
            reject();
        }
    });
}

function parseCookies (request) {
    const list = {};
    const cookieHeader = request.headers?.cookie;
    if (!cookieHeader) return list;

    cookieHeader.split(`;`).forEach(function(cookie) {
        let [ name, ...rest] = cookie.split(`=`);
        name = name?.trim();
        if (!name) return;
        const value = rest.join(`=`).trim();
        if (!value) return;
        list[name] = decodeURIComponent(value);
    });

    return list;
}

setTimeout(function() {
http.createServer(async function (req, res) {
    let currentAccessToken = (parseCookies(req)).token;
    let authenticated = false;
    for (authtok of authenticatedTokens) {
        if (authtok == currentAccessToken) {
            authenticated = true;
            break;
        }
    }

    if (authenticated || false) {
        switch(req.url) {

            case "/save":
                var receivedData = "";
                let saveRet = {};
                req.on('data', function(data) {
                    receivedData += data;
                });
                req.on('end', function() {
                    receivedData = JSON.parse(receivedData);
                    let err = filehandle.writePlyToFile(receivedData.ply, (receivedData.name));
                    if (err) {
                        saveRet.status = "err";
                    } else {
                        saveRet.status = "ok";
                    }
                });
                res.write(JSON.stringify(saveRet));
                res.end();
                break;

            case "/clips":
                var retObj = {}
                fileinfo.getMediaCls().then(retCls => {
                    retObj.status = "ok";
                    retObj.data = retCls;
                    res.write(JSON.stringify(retObj));
                    res.end();
                    console.log("ret: " + retObj);
                }).catch(err => {
                    console.log(err);
                    retObj.status = "err";
                    retObj.data = JSON.stringify(err);
                    res.write(JSON.stringify(retObj));
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
                fs.readFile("modules/filecopier/copylog.txt", 'utf-8', function(err, data) {
                    if (err) {
                        res.writeHead(500);
                        res.end();
                    } else {
                        data = data.replaceAll("\n", "<br>");
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

            case "/copierCopy":
                filecopier.copyOrDelete("copy");
                res.writeHead(200);
                res.end();
                break;
            case "/copierDelete":
                filecopier.copyOrDelete("delete");
                res.writeHead(200);
                res.end();
                break;

            case "/copyfile":
                //TODO
                break;

            case "/logout":
                expireToken((parseCookies(req)).token);
                res.end();
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
    } else {
        console.log(req.url);
        if (req.url == "/login") {
            let loginInfo = "";
            console.log("login data sent");
            req.on('data', function(data) {
                    loginInfo += data;
                });
                req.on('end', function() {
                    authenticate(loginInfo).then(token => {
                            res.writeHead(200, {'Content-Type': 'text/html', 'Set-Cookie': ('token=' + token)});
                            res.write("success");
                            res.end();
                        }).catch(() => {
                            console.log("auth error");
                            res.writeHead(403);
                            res.end();
                        });
                });
        } else {
            fs.readFile("login.html", function(err, data) {
                if (err) {
                    res.writeHead(500);
                    res.end();
                } else {
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.write(data);
                    res.end();
                }
            });
        }
    }
}).listen(filehandle.settings.http_port);
}, 1000);
