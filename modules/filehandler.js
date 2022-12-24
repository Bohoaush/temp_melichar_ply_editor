var fs = require("fs");
var fastxmlparser = require("fast-xml-parser");

var xmlparser = new fastxmlparser.XMLParser({ignoreAttributes: false});
var xmlbuilder = new fastxmlparser.XMLBuilder({ignoreAttributes: false});

function loadPlyFromFile("ply/" + filename) {
    return new Promise(resolve => {
        fs.readFile(filename, function(err, data) {
            if (err) {
                reject(err);
            } else {
                var plyItemsArr = [];
                for (let plyitem of xmlparser.parse(data).playlist.clip) {
                    var jsoitem = {}
                    jsoitem.path = plyitem['#text'];
                    jsoitem.duration = plyitem['@_duration'];
                    plyItemsArr.push(jsoitem);
                }
                resolve(plyItemsArr);
            }
        }
    }
}

function listAvailablePlys() {
    return new Promise(resolve => {
        fs.readdir("ply/", (err, filenames) => {
            if (err) {
                reject(err);
            } else {
                resolve(filenames);
            }
        });
    });
}

function writePlyToFile(playlistObj, "ply/" + filename) {
    var exportXml = "<?xml version=\"1.0\"?>\n<playlist>\n"
    for (let plyitem of playlistObj) {
        exportXml += "   <clip duration=\"" + plyitem.duration + "\">" + plyitem.path + "</clip>\n");
    }
    exportXml += "</playlist>";
    fs.writeFile(filename, exportXml, (err) => {
        if (err) {
            console.log(err);
        }
    }
}

function copyPlyTo(filename, destination) {
    //TODO
}
