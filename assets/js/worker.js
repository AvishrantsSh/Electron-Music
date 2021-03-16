const electron = require('electron')
const path = require('path')
const remote = electron.remote
const fs = require('fs');
const dataurl = require('dataurl')
const ipc = electron.ipcRenderer

// Config Files
const MStore = require('../assets/js/mstore.js');

let curr_track = document.createElement('audio');
let is_playing = false

function pauseTrack() {
    curr_track.pause();
    is_playing = false;
}

function resumeTrack() {
    curr_track.play();
    is_playing = true;
}

function playSong(index) {
    let mlib_path = 'music-lib'
    let mlib = new MStore({
        configName: mlib_path,
        defaults: {
            mdir: [],
            mpaths: [],
        }
    });

    let mpaths = mlib.get('mpaths')
    let audpath = mpaths[index]
    createSongObject(audpath)
        .then(data => {
            curr_track.src = data
            curr_track.load();
            curr_track.play()
            console.log(data)
        })
        .catch(err => {
            console.log(err)
        })

    is_playing = true
}

const createSongObject = (filepath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filepath, (err, data) => {
            if (err) { reject(err) }
            resolve(dataurl.convert({ data, mimetype: 'audio/mp3' }))
        })
    })
}
ipc.on('toggle', function(event, arg){
    if(is_playing) pauseTrack()
    else resumeTrack()
})

ipc.on('resume', function (event, arg) {
    resumeTrack()
})

ipc.on('pause', function (event, arg) {
    pauseTrack()
})

ipc.on('track', function (event, arg) {
    playSong(arg)
})

