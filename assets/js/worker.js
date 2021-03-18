const electron = require('electron')
const path = require('path')
const remote = electron.remote
const fs = require('fs');
const dataurl = require('dataurl')
const ipc = electron.ipcRenderer

// ID3 Extractor
const mm = require('music-metadata');
const util = require('util');

// Config Files
const MStore = require('../assets/js/mstore.js');
const mlib_path = 'music-lib'

let curr_track = document.createElement('audio');
curr_track.addEventListener("ended", () => { nextSong() });
let curr_index = -1;

// Minor Configurations
let shuffle = false /* Is Shuffle Enabled */
let loop = 0 /* Loop Type (0 - No loop, 1 - Loop Queue, 2 - Loop Track)*/
let is_playing = false

function pauseTrack() {
    curr_track.pause();
    is_playing = false;
}

function resumeTrack() {
    if (!is_playing && curr_index == -1) {
        playSong(0)
    }
    else {
        curr_track.play();
    }
    is_playing = true;
}

// Core Function - All Songs are queued and played over here

function playSong(index) {
    let mlib = new MStore({
        configName: mlib_path,
        defaults: {
            mdir: [],
            mpaths: [],
        }
    });

    // Reset Current Progress
    curr_track.pause()
    curr_track.src = ""
    curr_track.load()
    is_playing = false

    let mpaths = mlib.get('mpaths')

    if (index >= mpaths.length || index < 0) {
        curr_index = -1
        console.log('Queue Finished')
        return
    }

    curr_index = index
    let audpath = mpaths[curr_index]

    // ID3 tags Extraction
    id3tags(audpath)

    createSongObject(audpath)
        .then(data => {
            curr_track.src = data
            curr_track.load();
            curr_track.play()
            is_playing = true
        })
        .catch(err => {
            console.log(err)
        })

    is_playing = true
}

async function id3tags(audpath) {
    try {
        const metadata = await mm.parseFile(audpath);
        ipc.send('id3-result', metadata.common)
    } catch (error) {
        console.error(error.message);
    }
}

function nextSong() {
    let mlib = new MStore({
        configName: mlib_path,
        defaults: {
            mdir: [],
            mpaths: [],
        }
    });
    let mpaths = mlib.get('mpaths')
    if (loop == 0) playSong(curr_index + 1)
    if (loop == 1) playSong((curr_index + 1) % mpaths.length)
    if (loop == 2) playSong((curr_index))
}

function prevSong() {
    let mlib = new MStore({
        configName: mlib_path,
        defaults: {
            mdir: [],
            mpaths: [],
        }
    });
    let mpaths = mlib.get('mpaths')
    if (loop == 0) playSong(curr_index - 1)
    if (loop == 1) playSong((curr_index - 1) % mpaths.length)
    if (loop == 2) playSong((curr_index))
}

const createSongObject = (filepath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filepath, (err, data) => {
            if (err) { reject(err) }
            resolve(dataurl.convert({ data, mimetype: 'audio/mp3' }))
        })
    })
}

ipc.on('toggle', () => {
    if (is_playing) pauseTrack()
    else resumeTrack()
})

ipc.on('resume', () => { resumeTrack() })

ipc.on('pause', () => { pauseTrack() })

ipc.on('next-song', () => { nextSong() })

ipc.on('prev-song', () => { prevSong() })

ipc.on('track', function (event, arg) {
    playSong(arg)
})

