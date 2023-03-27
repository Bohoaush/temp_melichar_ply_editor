const http = require('http');

function getMediaCls() {
    return new Promise((resolve, reject) => {
        http.get("http://127.0.0.1:8000/cls", res => {
            let data = [];
            var availableClips = [];
            res.on('data', part => {
                data.push(part);
            });
            res.on('end', () => {
                data = (Buffer.concat(data).toString()).split("\n");
                for (let i = 1; i < (data.length - 2); i++) {
                    data[i] = data[i].split("  ");
                    data[i][2] = data[i][2].split(" ");
                    data[i][2][3] = data[i][2][3].split("/");
                    data[i].name = (data[i][0]).replace("\"", "");
                    data[i].duration = (data[i][2][2] * (data[i][2][3][0]/data[i][2][3][1]));
                    let avaClip = {name: data[i].name, duration: data[i].duration};
                    availableClips.push(avaClip);
                }
                resolve(availableClips);
            });
        }).on('error', err => {
            reject(err);
        });
    });
}

module.exports = {
    getMediaCls
}
