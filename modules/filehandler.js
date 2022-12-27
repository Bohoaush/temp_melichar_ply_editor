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
                for (let plyitem of xmlparser.parse(data).playlist.clip) {
                    var jsoitem = {}
                    jsoitem.path = plyitem['#text'].replace("/mnt/Video/", "");
                    jsoitem.duration = plyitem['@_duration'];
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
    var exportXml = "<?xml version=\"1.0\"?>\n<playlist>\n"
    for (let plyitem of playlistObj.plyitems) {
        exportXml += ("   <clip duration=\"" + parseInt(plyitem.duration) + "\">/mnt/Video/" + plyitem.path + "</clip>\n");
    }
    exportXml += "</playlist>";
    fs.writeFile("/mnt/Video/playlisty/" + filename, exportXml, (err) => {
        if (err) {
            console.log(err);
        }
    });
}

function copyPlyTo(filename, destination) {
    //TODO
}


module.exports = {
    writePlyToFile,
    listAvailablePlys,
    loadPlyFromFile
}
