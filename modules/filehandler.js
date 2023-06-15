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
                let plyitems = xmlparser.parse(data).playlist.clip;
                if (!(Symbol.iterator in plyitems)) {
                    plyitems = [plyitems];
                }
                for (let plyitem of plyitems) {
                    var jsoitem = {}
                    jsoitem.path = plyitem['#text'].replace("/mnt/Video/", "");
                    jsoitem.duration = (plyitem['@_duration']/1000);
                    jsoitem.logo = (plyitem['@_logo']);
                    plyItemsArr.push(jsoitem);
                    console.log(jsoitem);
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
            exportXml += ("   <clip duration=\"" + parseInt(plyitem.duration*1000) + logoxmins + "\">/mnt/Video/" + plyitem.path + "</clip>\n");
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
                allow_editor: true,
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
