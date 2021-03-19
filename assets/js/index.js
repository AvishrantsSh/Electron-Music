const electron = require('electron')
const path = require('path')
const remote = electron.remote
const fs = require('fs');
const ipc = electron.ipcRenderer

// All storage stuff to be done here
const MStore = require('../assets/js/mstore.js');
const mlib_path = 'music-lib'

// Control Buttons
const closeBtn = document.getElementById('closeBtn')
const minBtn = document.getElementById('minBtn')
const resBtn = document.getElementById('resBtn')
const playBtn = document.getElementById('playBtn')
const refreshBtn = document.getElementById('refreshBtn')
const resetBtn = document.getElementById('resetBtn')
const progress = document.getElementById('progress-bar')
const total_dur = document.getElementById('total-dur')
const curr_dur = document.getElementById('curr-dur')

// Icon Set
const maxmin = document.getElementById('maxmin')
const playicon = document.getElementById('playicon')

// Misc
const addM = document.getElementById('folder_pick')
const mtable = document.getElementById('mtable')
let is_playing = false
const currWin = remote.getCurrentWindow()

const thead_layout = `
    <thead>
        <tr>
            <th class="col-xs-3">SNo </th>
            <th class="col-xs-9">Song </th>
        </tr>
    </thead>`;


closeBtn.addEventListener('click', function () {
    currWin.close()
})

minBtn.addEventListener('click', function () {
    currWin.minimize()
})

resBtn.addEventListener('click', function () {
    if (currWin.isMaximized()) {
        currWin.unmaximize()
        maxmin.classList.remove("fa-square");
        maxmin.classList.add("fa-clone");
    }
    else {
        if (currWin.maximizable) {
            currWin.maximize()
            maxmin.classList.add("fa-square");
            maxmin.classList.remove("fa-clone");
        }
    }
})

playBtn.addEventListener('click', function () {
    if (is_playing) {
        ipc.send("playback-toggle")
        is_playing = false
    }
    else {
        ipc.send("playback-toggle")
        is_playing = true
    }
})

addM.addEventListener('click', function () {
    const modalPath = path.join('file://', __dirname, 'pathdef.html')

    let win = new remote.BrowserWindow({
        backgroundColor: '#333',
        parent: currWin,
        modal: true,
        width: 400,
        height: 320,
        alwaysOnTop: true,
        frame: false,
        show: false,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    })

    win.once('ready-to-show', () => {
        win.show()
    })

    win.on('close', () => { win = null })
    win.loadURL(modalPath)
    win.show()
})

refreshBtn.addEventListener('click', reindex)
resetBtn.addEventListener('click', resetdb)

// Handler Functions
function initread() {

    // Request sync with worker process
    ipc.send('request-sync')

    let mlib = new MStore({
        configName: mlib_path,
        defaults: {
            mdir: [],
            mpaths: [],
        }
    });

    console.log('Fetching Songs..')
    let mpaths = mlib.get('mpaths')
    let total = mpaths.length
    if (total == 0) {
        mtable.innerHTML = `
            <tr>
                <td> Oh Snap. No Music Data Found</td>
            </tr>`
    }
    else {
        // let tmp = thead_layout
        let tmp
        mpaths.forEach(function (path, index) {
            let plist = path.split("/")
            tmp += `
                <tr onclick="playSong(`+ index + `)">
                    <td class="col-xs-3">`+ (index + 1) + `</td>
                    <td class="col-xs-9">`+ plist.pop() + `</td>
                </tr>`
        })

        mtable.innerHTML = tmp
    }
}

function reindex() {
    let mlib = new MStore({
        configName: mlib_path,
        defaults: {
            mdir: [],
            mpaths: [],
        }
    });
    let mdir = mlib.get('mdir')
    if (mdir.length > 0) {
        console.log("Reindexing Songs. Erased current data (" + mlib.get('mpaths').length + " song(s))")
        mdir.forEach(function (mpath, index) {
            console.log("Reading dir at " + mpath)
            fs.readdir(mpath, (err, files) => {
                var tmparr = []
                files.forEach(file => {
                    if (path.extname(file) == '.mp3') {
                        tmparr.push(mpath + "/" + file)
                    }
                });

                if (tmparr.length > 0) {
                    mlib.set('mpaths', tmparr)
                    console.log('Found ' + mlib.get('mpaths').length + " songs")
                }
                initread()
            });
        });
    }
    else {
        console.log('No results found')
        initread()
    }
}

function playSong(index) {
    ipc.send("play-track", index)
}

/* Use this function to reset db */
function resetdb() {
    let mlib = new MStore({
        configName: mlib_path,
        defaults: {
            mdir: [],
            mpaths: [],
        }
    });

    mlib.set('mdir', [])
    mlib.set('mpaths', [])
    console.log('Reset Complete')
    reindex()
}

function updateID3(arg) {
    console.log(arg)
    let title = document.getElementById('song-name')
    let artist = document.getElementById('song-artist')
    let cover = document.getElementById('song-cover')
    let cover2 = document.getElementById('song-covertest')
    title.textContent = arg.title
    artist.textContent = arg.artist
    let thumb = URL.createObjectURL(
        new Blob([arg.picture[0].data.buffer], { type: arg.picture[0].format } /* (1) */)
    );

    cover.style.backgroundImage = "url('" + thumb + "')"
    console.log(arg.picture[0])
}

window.onload = initread

ipc.on('add-finished', reindex)

ipc.on('id3-result', function (event, arg) {
    updateID3(arg)
})

ipc.on('song-details', function (event, arg) {
    let data = JSON.parse(arg)
    let min = parseInt(data.duration / 60)
    let sec = data.duration % 60
    min = min < 10 ? "0" + min : sec
    sec = sec < 10 ? "0" + sec : sec
    total_dur.innerHTML = min + ":" + sec
})