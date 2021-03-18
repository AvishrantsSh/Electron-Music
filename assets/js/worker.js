// Imports !!
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
let curr_index = -1;

// Minor Configurations
let shuffle = false /* Is Shuffle Enabled */
let loop = 0 /* Loop Type (0 - No loop, 1 - Loop Queue, 2 - Loop Track)*/
let is_playing = false

function pauseTrack() {
    if (is_playing) {
        curr_track.pause();
        is_playing = false
    }
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
    if (is_playing) {
        curr_track.pause()
        curr_track.src = ''
        curr_track.load();
        curr_track.play()
        is_playing = false
    }
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
        mediasessionUpdate(metadata.common)
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

function mediasessionUpdate(metadata) {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: metadata.title,
            artist: metadata.artist,
            album: metadata.album,
            // artwork: [
            //     { src: 'https://dummyimage.com/96x96', sizes: '96x96', type: 'image/png' },
            //     { src: 'https://dummyimage.com/128x128', sizes: '128x128', type: 'image/png' },
            //     { src: 'https://dummyimage.com/192x192', sizes: '192x192', type: 'image/png' },
            //     { src: 'https://dummyimage.com/256x256', sizes: '256x256', type: 'image/png' },
            //     { src: 'https://dummyimage.com/384x384', sizes: '384x384', type: 'image/png' },
            //     { src: 'https://dummyimage.com/512x512', sizes: '512x512', type: 'image/png' },
            // ]
        });

        navigator.mediaSession.setActionHandler('play', resumeTrack);
        navigator.mediaSession.setActionHandler('pause', pauseTrack);
        // navigator.mediaSession.setActionHandler('stop', function () { /* Code excerpted. */ });
        // navigator.mediaSession.setActionHandler('seekbackward', function () { /* Code excerpted. */ });
        // navigator.mediaSession.setActionHandler('seekforward', function () { /* Code excerpted. */ });
        // navigator.mediaSession.setActionHandler('seekto', function () { /* Code excerpted. */ });
        // navigator.mediaSession.setActionHandler('skipad', function () { /* Code excerpted. */ });
        navigator.mediaSession.setActionHandler('previoustrack', prevSong);
        navigator.mediaSession.setActionHandler('nexttrack', nextSong);
    }
    else {
        return
    }
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

