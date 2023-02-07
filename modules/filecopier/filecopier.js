var fs = require("fs");
var readline = require("readline");


//////////////////////////////////////////////////////////
//////////////////USER-CONFIGURABLE///////////////////////
//////////////////////////////////////////////////////////
// Mounted remote folder containing wanted files
var mntdir = "/home/bohoaush/Documents/testfs/pole-mnt/";
// Original remote folder name to be replaced - use = mntdir for same directory in file and mounted
var oridir = "\\\\W.X.Y.Z\\video\\"
// Folder where you want files
var workdir = "/home/bohoaush/Documents/testfs/local-fs/";
//////////////////////////////////////////////////////////
//////////////END-OF-USER-CONFIGURABLE(///////////////////
//////////////////////////////////////////////////////////


var wantFiles = [];
var hasFiles = [];
var copiedFiles = [];
var erroredFiles = [];
var unavailFiles = [];

module.exports = {};

module.exports.copyOrDelete = function(func) {
    Promise.all([readWanted(), scanDir(workdir), readCopiedInfo()]).then(() => {
        if (func == "delete") {
            compareDelete();
        } else if (func == "copy") {
            compareCopy();
        }
    });
}

function readWanted() {
    return new Promise(resolve => {
        var readWantedFilesOneByOne = readline.createInterface({
            input: fs.createReadStream("modules/filecopier/wantfiles.list"),
            crlfDelay: Infinity
        });

        readWantedFilesOneByOne.on('line', (line) => {
            line = line.replace(oridir, "");
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
                fs.appendFile("modules/filecopier/copylog.txt", err + "\n", (err) => {
                    if (err) {
                        console.log(err);
                    }
                });
            } else {
                for (let file of filenames) {
                    if (file.isDirectory()) {
                        subdirPromises.push(scanDir(dir + file.name));
                    } else {
                        hasFiles.push(dir.replace(workdir, "") + file.name);
                    }
                }
            }
            Promise.all(subdirPromises).then(() => resolve());
        });
    });
}

function readCopiedInfo() {
    return new Promise((resolve, reject) => {
        fs.readFile("modules/filecopier/copyfile.info", "utf-8", (err, data) => {
            if (err) {
                console.log(err);
                fs.appendFile("modules/filecopier/copylog.txt", err + "\n", (err) => {
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
    for (wafle of wantFiles) {
        if (!fs.existsSync(workdir + wafle)) {
            if (fs.existsSync(mntdir + wafle)) {
                copiedFiles.push(wafle);
                console.log("copying " + wafle);
                fs.appendFile("modules/filecopier/copylog.txt", "copying " + wafle + "\n", (err) => {
                    if (err) {
                        console.log(err);
                        fs.appendFile("modules/filecopier/copylog.txt", err + "\n", (err) => {
                            if (err) {
                                console.log(err);
                            }
                        });
                    }
                });
                try {
                	fs.copyFileSync(mntdir + wafle, workdir + wafle)
                	console.log("copied " + wafle);
                    fs.appendFile("modules/filecopier/copylog.txt", "copied " + wafle + "\n", (err) => {
                        if (err) {
                            console.log(err);
                        }
                    });
                } catch(err) {
	                console.log(err);
                    fs.appendFile("modules/filecopier/copylog.txt", err + "\n", (err) => {
                        if (err) {
                            console.log(err);
                        }
                    });
	                erroredFiles.push(wafle);
                }
            } else {
            	console.log(wafle + " doesn't exist");
                fs.appendFile("modules/filecopier/copylog.txt", wafle + " doesn't exist\n", (err) => {
                    if (err) {
                        console.log(err);
                    }
                });
            	unavailFiles.push(wafle);
            }
        }
    }
    fs.writeFile("modules/filecopier/copyfile.info", JSON.stringify(copiedFiles), (err) => {
        if (err) {
            console.log(err);
            fs.appendFile("copylog.txt", err + "\n", (err) => {
                if (err) {
                    console.log(err);
                }
            });
        }
    });
    if (unavailFiles.length > 0) {
    	console.log(unavailFiles + " are not available");
        fs.appendFile("modules/filecopier/copylog.txt", unavailFiles + " are not available\n", (err) => {
            if (err) {
                console.log(err);
            }
        });
    }
    if (erroredFiles.length > 0) {
    	console.log("_________________________________");
    	console.log(erroredFiles + " had errors during copy!");
        fs.appendFile("modules/filecopier/copylog.txt", "___________________________________\n" + erroredFiles + " had errors during copy\n", (err) => {
            if (err) {
                console.log(err);
            }
        });
    }
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
            if (fs.existsSync(workdir + cofle)) {
                deletePromises.push(executeDelete(cofle));
            }
        }
    }
    Promise.all(deletePromises).then(() => {
        copiedFiles = copiedFiles.filter(aplit => aplit !== null);
        fs.writeFile("modules/filecopier/copyfile.info", JSON.stringify(copiedFiles), (err) => {
            if (err) {
                console.log(err);
                fs.appendFile("modules/filecopier/copylog.txt", err, (err) => {
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
        fs.unlink(workdir + toDelete, (err) => {
            if (err) {
                console.log(err);
                fs.appendFile("modules/filecopier/copylog.txt", err, (err) => {
                    if (err) {
                        console.log(err);
                    }
                });
            } else {
                console.log("deleted " + toDelete);
                fs.appendFile("modules/filecopier/copylog.txt", "deleted " + toDelete + "\n", (err) => {
                    if (err) {
                        console.log(err);
                    }
                });
                for (cofldl of copiedFiles) {
                    if (toDelete == cofldl) {
                        copiedFiles[copiedFiles.indexOf(cofldl)] = null;
                    }
                }
            }
            resolve();
        });
    });
}
