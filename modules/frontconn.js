var http = require("http");
var fs = require("fs");

var fileinfo = require("./fileinform.js");
var filehandle = require("./filehandler.js");
var filecopier = require("./filecopier.js");

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
                if (filehandle.settings.allow_editor) {
                    var receivedData = "";
                    let saveRet = {};
                    req.on('data', function(data) {
                        receivedData += data;
                    });
                    req.on('end', function() {
                        receivedData = JSON.parse(receivedData);
                        filehandle.writePlyToFile(receivedData.ply, (receivedData.name)).then(() => {
                            saveRet.status = "ok";
                        }).catch((err) => {
                            saveRet.status = "err"
                        }).finally(() => {
                            res.write(JSON.stringify(saveRet));
                            res.end();
                        });
                    });
                } else {
                    res.writeHead(403);
                    res.write("Editor disabled");
                    res.end();
                }
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
                if (filehandle.settings.allow_copier) {
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
                } else {
                    res.writeHead(403);
                    res.write("File copier is disabled");
                    res.end();
                }
                break;

            case "/copylog":
                fs.readFile("data/copylog.txt", 'utf-8', function(err, data) {
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
                fs.readFile("data/wantfiles.list", function(err, data) {
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
                if (filehandle.settings.allow_copier) {
                var newWantfiles = "";
                req.on('data', function(data) {
                    newWantfiles += data;
                });
                req.on('end', function() {
                    fs.writeFile("data/wantfiles.list", newWantfiles, (err) => {
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
                } else {
                    res.writeHead(403);
                    res.write("File copier disabled");
                    res.end();
                }
                break;

            case "/copierCopy":
                if (filehandle.settings.allow_copier) {
                    filecopier.copyOrDelete("copy");
                    res.writeHead(200);
                    res.write("ok");
                    res.end();
                } else {
                    res.writeHead(403);
                    res.write("File copier disabled");
                    res.end();
                }
                break;
            case "/copierDelete":
                if (filehandle.settings.allow_copier) {
                    filecopier.copyOrDelete("delete");
                    res.writeHead(200);
                    res.write("ok");
                    res.end();
                } else {
                    res.writeHead(403);
                    res.write("File copier disabled");
                    res.end();
                }
                break;

            case "/copyfile":
                //TODO
                break;

            case "/logout":
                expireToken((parseCookies(req)).token);
                res.end();
                break;

            default:
                if (filehandle.settings.allow_editor) {
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
                } else {
                    res.writeHead(403);
                    res.write("Editor is disabled");
                    res.end();
                }
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
