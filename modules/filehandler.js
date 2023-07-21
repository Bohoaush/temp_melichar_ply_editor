var fs = require("fs");
var fastxmlparser = require("fast-xml-parser");

var xmlparser = new fastxmlparser.XMLParser({ignoreAttributes: false});
var xmlbuilder = new fastxmlparser.XMLBuilder({ignoreAttributes: false});

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
                        plyItemsArr.push(jsonitem);
                    }
                }
                resolve(plyItemsArr);
            }
        });
    });
}

function listAvailablePlys() {
    return new Promise((resolve, reject) => {
        fs.readdir("/mnt/Video/playlisty", (err, filenames) => {
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
            var logoxmins = "";
            if (plyitem.logo != undefined && plyitem.logo != "" && plyitem.logo != "default") {
                logoxmins = "\" logo=\"" + plyitem.logo;
            }
            exportXml += ("   <" + plyitem.type + " duration=\"" + parseInt(plyitem.duration*1000) + logoxmins + "\">/mnt/Video/" + plyitem.path + "</clip>\n");
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
    listAvailablePlys,
    loadPlyFromFile
}
