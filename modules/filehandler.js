var fs = require("fs");

function loadPlyFromFile(filename) {
    return new Promise((resolve, reject) => {
        fs.readFile("/mnt/Video/playlisty/" + filename, function(err, data) {
            if (err) {
                reject(err);
            } else {
                var plyItemsArr = [];

                let playlistLoadingSubproduct = data.toString();
                playlistLoadingSubproduct = playlistLoadingSubproduct.split("<playlist>")[1];
                playlistLoadingSubproduct = playlistLoadingSubproduct.split("</playlist>")[0];
                playlistLoadingSubproduct = playlistLoadingSubproduct.split("<");
                for (let i = 0; i < playlistLoadingSubproduct.length; i++) {
                    console.log(playlistLoadingSubproduct);
                    let openingtag = playlistLoadingSubproduct[i].match(/^.*? /);
                    if (openingtag) {
                        let jsonitem = {};

                        jsonitem.type = openingtag[0].replace(" ", "");

                        jsonitem.path = playlistLoadingSubproduct[i].replace(/.*>/, "");
                        jsonitem.path = jsonitem.path.replace("/mnt/Video/", "");

                        let durparam = playlistLoadingSubproduct[i].match(/duration=".*?"/);
                        if (durparam) {
                            durparam = durparam[0].replace("duration=\"", "");
                            durparam = durparam.replace("\"", "");
                            jsonitem.duration = (durparam / 1000);
                        }

                        let logoparam = playlistLoadingSubproduct[i].match(/logo=".*?"/);
                        if (logoparam) {
                            logoparam = logoparam[0].replace("logo=\"", "");
                            jsonitem.logo = logoparam.replace("\"", "");
                        }

                        let logoshiftparam = playlistLoadingSubproduct[i].match(/logoOffset=".*?"/);
                        if (logoshiftparam) {
                            logoshiftparam = logoshiftparam[0].replace("logoOffset=\"", "");
                            if (logoshiftparam == "4:3\"") {
                                jsonitem.logoshift = true;
                            }
                        }

                        let disableistr = playlistLoadingSubproduct[i].match(/notOnInternet=".*?"/);
                        if (disableistr) {
                            jsonitem.disableistr = true;
                        }

                        let loop = playlistLoadingSubproduct[i].match(/loop=".*?"/);
                        if (loop) {
                            jsonitem.loop = true;
                        }
                        plyItemsArr.push(jsonitem);
                    }
                }
                resolve(plyItemsArr);
            }
        });
    });
}

function loadPlyFromJsonFile(filename) {
    return new Promise((resolve, reject) => {
        fs. readFile("/mnt/Video/playlisty/forNewMelichar/" + filename, function(err, data) {
            if (err) {
                reject(err);
            } else {
                let plyToLoad = JSON.parse(data.toString());
                let plyItemsArr = [];
                for (let meliitemkey in plyToLoad.playlist) {
                    let meliplyitem = plyToLoad.playlist[meliitemkey];
                    let pledplyitem = {
                        //type: set later,
                        path: meliplyitem.file.path,
                        duration: (meliplyitem.file.duration / 1000),
                        //logo: not yet implemented,
                        loop: meliplyitem.looped
                    }
                    if (meliplyitem.file.type == "video") {
                        pledplyitem.type = "clip";
                    } else if (meliplyitem.file.type == "stream") {
                        pledplyitem.type = "stream";
                    }
                    plyItemsArr.push(pledplyitem);
                }
                resolve(plyItemsArr);
            }
        });
    });
}

function listAvailablePlys(cdir) {
    return new Promise((resolve, reject) => {
        let dir = cdir || "/mnt/Video/playlisty";
        fs.readdir(dir, (err, filenames) => {
            if (err) {
                reject(err);
            } else {
                resolve(filenames);
            }
        });
    });
}

function writePlyToFile(playlistObj, filename) {
    return new Promise((resolve, reject) => {
        var exportXml = "<?xml version=\"1.0\"?>\n<playlist>\n"
        for (let plyitem of playlistObj.plyitems) {
            var optionsxmlinsert = "";
            if (plyitem.logo != undefined && plyitem.logo != "" && plyitem.logo != "default") {
                optionsxmlinsert = "\" logo=\"" + plyitem.logo;
            }
            if (plyitem.logoshift) {
                optionsxmlinsert += "\" logoOffset=\"4:3";
            }
            if (plyitem.disableistr) {
                optionsxmlinsert += "\" notOnInternet=\"";
            }
            if (plyitem.loop) {
                optionsxmlinsert += "\" loop=\""
            }
            if (plyitem.type == "clip") {
                plyitem.path = ("/mnt/Video/" + plyitem.path);
            }
            exportXml += ("   <" + plyitem.type + " duration=\"" + parseInt(plyitem.duration*1000) + optionsxmlinsert + "\">" + plyitem.path + "</" + plyitem.type + ">\n");
        }
        exportXml += "</playlist>";
        fs.writeFile("/mnt/Video/playlisty/" + filename, exportXml, (err) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

function writePlyToJsonFile(playlistObj, filename) {
    return new Promise((resolve, reject) => {
        let exportObj = {playlist:{}};
        for (let plyitem of playlistObj.plyitems) {
            let exp_plyitem = {file: {}};
            exp_plyitem.file.name = plyitem.path.replace(/.*\//,"");
            if (plyitem.type == "clip") {
                exp_plyitem.file.type = "video";
                exp_plyitem.file.segment = "video";
            } else if (plyitem.type == "stream") {
                exp_plyitem.file.type = "stream";
            }
            exp_plyitem.file.exists = true;
            exp_plyitem.file.path = plyitem.path;
            // not setting exp_plyitem.format
            exp_plyitem.file.duration = parseInt(plyitem.duration*1000);
            // not setting aspect ratio
            // exp_plyitem.startTime = 0; // figure this out later if necessary...
            exp_plyitem.expectedDuration = parseInt(plyitem.duration*1000);
            exp_plyitem.fixed = false;
            if (!plyitem.loop) {
                exp_plyitem.looped = false;
            } else {
                exp_plyitem.looped = true;
            }
            exp_plyitem.played = false;
            exp_plyitem.loaded = false;
            if (plyitem.logo == undefined || plyitem.logo == "" || plyitem.logo == "default") {
                exp_plyitem.logo = {};
            } else {
                // TODO
            }
            exportObj.playlist[plyitem.id - -1] = exp_plyitem;
        }
        exportObj.date = filename.replace("playlist-", "");
        exportObj.date = exportObj.date.replace(".ply", "");
        let exportJson = JSON.stringify(exportObj);
        fs.writeFile("/mnt/Video/playlisty/forNewMelichar/" + filename, exportJson, (err) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

function copyPlyTo(filename, destination) {
    //TODO
}


setSettings();

function setSettings() {
    return new Promise((resolve, reject) => {
        fs.readFile("./settings.json", function(err, data) {
            if (err) {
                console.log(err);
            }
            if (data != null) {
                module.exports.settings = JSON.parse(data);
                resolve();
            } else {
                reject();
            }
        });
    }).catch(err => {
        console.log(err || "Unable to read settings");
        return new Promise((resolve, reject) => {
            module.exports.settings = {
                http_port: 8087,
                http_pass: "1234567",
                edi_accs_lvl: "full", // full / read / none
                redir_to_cop: true,
                allow_copier: true,
                redir_to_edi: true,
                http_ifc_lbl: "Your label with any color",
                htt_lbl_colr: "black",
                htt_lbl_bgcl: "yellow",
                filecop_mnt: "../../",
                filecop_ori: "../",
                filecop_wrk: "../"
            }
            if (!fs.existsSync("./settings.json")) {
                fs.writeFile("./settings.json", JSON.stringify(module.exports.settings), (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        }).catch(err => {
            console.log(err);
        });
    });
}


module.exports = {
    writePlyToFile,
    writePlyToJsonFile,
    listAvailablePlys,
    loadPlyFromFile,
    loadPlyFromJsonFile
}
