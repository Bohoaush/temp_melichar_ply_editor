var fs = require("fs");
var readline = require("readline");

var filehandle = require("./filehandler.js");


var wantFiles = [];
var hasFiles = [];
var copiedFiles = [];
var erroredFiles = [];
var unavailFiles = [];

var copyingAt;

module.exports = {};

module.exports.copyOrDelete = function(func) {
    wantFiles = [];
    hasFiles = [];
    erroredFiles = [];
    unavailFiles = [];
    copyingAt = -1;
    //copiedFiles is overwritten from file each run, therefore nulling is unnecessary
    Promise.all([readWanted(), scanDir(filehandle.settings.filecop_wrk), readCopiedInfo()]).then(() => {
        if (func == "delete") {
            compareDelete();
        } else if (func == "copy") {
            compareCopy();
        }
    });
}

function readWanted() {
    return new Promise(resolve => {
        wantFiles = [];
        var readWantedFilesOneByOne = readline.createInterface({
            input: fs.createReadStream("data/wantfiles.list"),
            crlfDelay: Infinity
        });

        readWantedFilesOneByOne.on('line', (line) => {
            line = line.replace(filehandle.settings.filecop_ori, "");
            line = line.replace(/\\/g, "/"); // Replace Windows-like backslash with forward slash
            if (!(Array.from(line)[0] == '#')) {
                wantFiles.push(line);
            }
        });

        readWantedFilesOneByOne.once('close', () => {
            resolve();
        });
    });
}

function scanDir(dir) {
    return new Promise(resolve => {
        var subdirPromises = [];
        dir = (dir + "/");
        fs.readdir(dir, {withFileTypes: true}, (err, filenames) => {
            if (err) {
                console.log(err)
                fs.appendFile("data/copylog.txt", err.toString() + "\n", (err) => {
                    if (err) {
                        console.log(err);
                    }
                });
            } else {
                for (let file of filenames) {
                    if (file.isDirectory()) {
                        subdirPromises.push(scanDir(dir + file.name));
                    } else {
                        hasFiles.push(dir.replace(filehandle.settings.filecop_wrk, "") + file.name);
                    }
                }
            }
            Promise.all(subdirPromises).then(() => resolve());
        });
    });
}

function readCopiedInfo() {
    return new Promise((resolve, reject) => {
        fs.readFile("data/copyfile.info", "utf-8", (err, data) => {
            if (err) {
                console.log(err);
                fs.appendFile("data/copylog.txt", err.toString() + "\n", (err) => {
                    if (err) {
                        console.log(err);
                    }
                });
                reject(err);
            } else if (data != null) {
                copiedFiles = JSON.parse(data);
                resolve();
            }
        });
    });
}


function compareCopy() {
    return new Promise(resolve => {
        copyingAt++;
        if (copyingAt < wantFiles.length) {
            wafle = wantFiles[copyingAt];
            if (!fs.existsSync(filehandle.settings.filecop_wrk + wafle)) {
                if (fs.existsSync(filehandle.settings.filecop_mnt + wafle)) {
                    console.log("copying " + wafle);
                    fs.appendFile("data/copylog.txt", "copying " + wafle + "\n", (err) => {
                        if (err) {
                            console.log(err);
                            fs.appendFile("data/copylog.txt", err.toString() + "\n", (err) => {
                                if (err) {
                                    console.log(err);
                                }
                            });
                        }
                    });
                    let wafletracedir = wafle.match(/.*\//);
                    if (!fs.existsSync(filehandle.settings.filecop_wrk + wafletracedir)) {
                        fs.mkdirSync((filehandle.settings.filecop_wrk + wafletracedir), {recursive: true});
                        console.log("created directory " + wafletracedir);
                        fs.appendFile("data/copylog.txt", ("created directory " + wafletracedir) + "\n", (err) => {
                            if (err) {
                                console.log(err);
                            }
                        });
                    }
                    fs.copyFile(filehandle.settings.filecop_mnt + wafle, filehandle.settings.filecop_wrk + wafle, (err) => {
                        if (err) {
                            console.log(err);
                            fs.appendFile("data/copylog.txt", err.toString() + "\n", (err) => {
                                if (err) {
                                    console.log(err);
                                }
                            });
                            erroredFiles.push(wafle);
                        } else {
                            copiedFiles.push(wafle);
                            console.log("copied " + wafle);
                            fs.appendFile("data/copylog.txt", "copied " + wafle + "\n", (err) => {
                                if (err) {
                                    console.log(err);
                                }
                            });
                        }
                        compareCopy();
                    });
                } else {
                    console.log(wafle + " doesn't exist");
                    fs.appendFile("data/copylog.txt", wafle + " doesn't exist\n", (err) => {
                        if (err) {
                            console.log(err);
                        }
                    });
                    unavailFiles.push(wafle);
                    compareCopy();
                }
            } else {
                compareCopy();
            }
        } else {
            fs.writeFile("data/copyfile.info", JSON.stringify(copiedFiles), (err) => {
                if (err) {
                    console.log(err);
                    fs.appendFile("copylog.txt", err.toString() + "\n", (err) => {
                        if (err) {
                            console.log(err);
                        }
                    });
                }
            });
            if (unavailFiles.length > 0) {
                console.log(unavailFiles + " are not available");
                fs.appendFile("data/copylog.txt", unavailFiles + " are not available\n", (err) => {
                    if (err) {
                        console.log(err);
                    }
                });
            }
            if (erroredFiles.length > 0) {
                console.log("_________________________________");
                console.log(erroredFiles + " had errors during copy!");
                fs.appendFile("data/copylog.txt", "___________________________________\n" + erroredFiles + " had errors during copy\n", (err) => {
                    if (err) {
                        console.log(err);
                    }
                });
            }
            console.log("_____________COPYING FINISHED_____________");
            fs.appendFile("data/copylog.txt", "_____________COPYING FINISHED_____________\n", (err) => {
                if (err) {
                    console.log(err);
                }
            });
        }
        resolve();
    });
}

function compareDelete() {
    var deletePromises = [];
    for (cofle of copiedFiles) {
        var isWafle = false;
        for (wafle of wantFiles) {
            if (cofle == wafle) {
                isWafle = true;
                break;
            }
        }
        if (!isWafle) {
            if (fs.existsSync(filehandle.settings.filecop_wrk + cofle)) {
                deletePromises.push(executeDelete(cofle));
            }
        }
    }
    Promise.all(deletePromises).then(() => {
        copiedFiles = copiedFiles.filter(aplit => aplit !== null);
        fs.writeFile("data/copyfile.info", JSON.stringify(copiedFiles), (err) => {
            if (err) {
                console.log(err);
                fs.appendFile("data/copylog.txt", err.toString(), (err) => {
                    if (err) {
                        console.log(err);
                    }
                });
            }
        });
    });
    
}

function executeDelete(toDelete) {
    return new Promise(resolve => {
        if (fs.lstatSync(filehandle.settings.filecop_wrk + toDelete).isFile()) {
            fs.promises.unlink(filehandle.settings.filecop_wrk + toDelete).then(() => {
                console.log("deleted " + toDelete);
                fs.appendFile("data/copylog.txt", "deleted " + toDelete + "\n", (err) => {
                    if (err) {
                        console.log(err);
                    }
                });
                for (cofldl of copiedFiles) {
                    if (toDelete == cofldl) {
                        copiedFiles[copiedFiles.indexOf(cofldl)] = null;
                    }
                }
            }).catch((err) => {
                console.log(err);
                fs.appendFile("data/copylog.txt", err.toString(), (err) => {
                    if (err) {
                        console.log(err);
                    }
                });

            }).finally(() => {;
                resolve();
            });
        } else {
            console.log("Not deleting " + toDelete + ". Not a regular file");
            fs.appendFile("data/copylog.txt", "Not deleting " + toDelete + ". Not a regular file\n", (err) => {
                if (err) {
                    console.log(err);
                }
            });
        }
    });
}
