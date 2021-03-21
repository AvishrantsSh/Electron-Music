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
curr_track.addEventListener('ended', nextSong)
curr_track.addEventListener('loadeddata', () => {
    ipc.send('song-details', JSON.stringify({ 'track': curr_index, 'duration': parseInt(curr_track.duration) }))
})
let curr_index = -1;

// Minor Configurations
let shuffle = false /* Is Shuffle Enabled */
let loop = 0 /* Loop Type (0 - No loop, 1 - Loop Queue, 2 - Loop Track)*/
let is_playing = false

function pauseTrack(send = true) {
    if (is_playing) {
        // Ease-in and out feature to be added here
        curr_track.pause();
        if (send)
            ipc.send('song-pause')
    }
    is_playing = false;
}

function resumeTrack(send = true) {
    if (!is_playing && curr_index == -1) {
        playSong(0)
    }
    else {
        curr_track.play();
    }
    is_playing = true;
    if (send)
        ipc.send('song-resume')
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
        pauseTrack(false)
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

    createSongObject(audpath)
        .then(data => {
            curr_track.src = data
            curr_track.load()
            curr_track.play()
            is_playing = true
            // ID3 tags Extraction
            id3tags(audpath)

            ipc.send('song-resume')

        })
        .catch(err => {
            ipc.send('INACCESSIBLE')
        })


}

async function id3tags(audpath) {
    try {
        let metadata = await mm.parseFile(audpath);
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
    if (curr_track.currentTime > 10) {
        playSong(curr_index)
        return
    }
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
        navigator.mediaSession.setActionHandler('seekbackward', () => {
            curr_track.currentTime = Math.max(curr_track.currentTime - 10, 0)
        });
        navigator.mediaSession.setActionHandler('seekforward', () => {
            curr_track.currentTime = Math.min(curr_track.currentTime + 10, curr_track.duration)
        });
        // navigator.mediaSession.setActionHandler('seekto', function () { /* Code excerpted. */ });
        // navigator.mediaSession.setActionHandler('skipad', function () { /* Code excerpted. */ });
        navigator.mediaSession.setActionHandler('previoustrack', prevSong);
        navigator.mediaSession.setActionHandler('nexttrack', nextSong);
    }
    else {
        return
    }
}

// function syncMain() {
//     console.log(metadata)
//     if (metadata == null) {
//         ipc.send('sync-res', null)
//         return
//     }
//     ipc.send('sync-res', metadata.common)
// }

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

ipc.on('resume', resumeTrack)

ipc.on('pause', pauseTrack)

ipc.on('next-song', nextSong)

ipc.on('prev-song', prevSong)

ipc.on('track', function (event, arg) {
    playSong(arg)
})

// ipc.on('sync-main', syncMain)
