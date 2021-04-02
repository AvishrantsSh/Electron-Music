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

// Player Controls
const playBtn = document.getElementById('playBtn')
const shuffleBtn = document.getElementById('shuffleBtn')
const repBtn = document.getElementById('repBtn')
const next = document.getElementById('nextBtn')
const prev = document.getElementById('prevBtn')

const refreshBtn = document.getElementById('refreshBtn')
const resetBtn = document.getElementById('resetBtn')

const progress = document.getElementById('progress-bar')
const total_dur = document.getElementById('total-dur')
const curr_dur = document.getElementById('curr-dur')

// Icon Set
const maxmin = document.getElementById('maxmin')
const playicon = document.getElementById('playicon')
let title = document.getElementById('song-name')
let artist = document.getElementById('song-artist')
let cover = document.getElementById('song-cover')
let song_dur = 0

// Misc
const addM = document.getElementById('folder_pick')
const mtable = document.getElementById('mtable')
const currWin = remote.getCurrentWindow()

let is_playing = false
let def_cover = true
let progressTimer = null

const thead_layout = `
    <thead>
        <tr>
            <th class="col-xs-3">SNo </th>
            <th class="col-xs-9">Song </th>
        </tr>
    </thead>`;


// Event Listeners
closeBtn.addEventListener('click', function () {
    currWin.close()
})

minBtn.addEventListener('click', function () {
    currWin.minimize()
})

resBtn.addEventListener('click', function () {
    if (currWin.isMaximized()) {
        currWin.unmaximize()
        maxmin.className = "far fa-clone";
    }
    else {
        if (currWin.maximizable) {
            currWin.maximize()
            maxmin.className = "far fa-square";
        }
    }
})

playBtn.addEventListener('click', function () {
    if (is_playing)
        ipc.send("playback-toggle")
    else
        ipc.send("playback-toggle")

    if (progress.disabled == true)
        progress.disabled = false
})

addM.addEventListener('click', pickFolder)

refreshBtn.addEventListener('click', reindex)
resetBtn.addEventListener('click', resetdb)

shuffleBtn.addEventListener('mouseenter', () => {
    shuffleBtn.firstChild.classList.add('bx-flashing')
})

shuffleBtn.addEventListener('mouseleave', () => {
    shuffleBtn.firstChild.classList.remove('bx-flashing')
})

repBtn.addEventListener('mouseenter', () => {
    repBtn.firstChild.classList.add('bx-flashing')
})

repBtn.addEventListener('mouseleave', () => {
    repBtn.firstChild.classList.remove('bx-flashing')
})

next.addEventListener('click', () => {
    ipc.send('skip-next')
})

prev.addEventListener('click', () => {
    ipc.send('skip-previous')
})

shuffleBtn.addEventListener('click', ()=> {
    ipc.send('toggle-shuffle')
})

// Slider Functionality
progress.oninput = function () {
    var value = (this.value - this.min) / (this.max - this.min) * 100
    this.style.background = 'linear-gradient(to right, #82CFD0 0%, #82CFD0 ' + value + '%, #fff ' + value + '%, white 100%)'
    let min = parseInt(progress.value / 60)
    let sec = progress.value % 60
    min = min < 10 ? "0" + min : sec
    sec = sec < 10 ? "0" + sec : sec
    curr_dur.innerHTML = min + ":" + sec
    ipc.send('seek-pos', progress.value)
};
// Handler Functions
function initread() {
    // Request sync with worker process
    ipc.send('request-sync')
    let msg = document.getElementById('table-msg')

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
        msg.innerHTML = `No Music Data Found. 
        <button class="btn btn-secondary" onclick='pickFolder()'> Add Now!
        </button>`
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
            mtable.innerHTML = tmp
        })
        msg.innerHTML = 'Total Files Scanned : ' + mpaths.length
    }

    // Initial MaxMin Symbol
    if (currWin.isMaximized())
        maxmin.className = 'far fa-square'
    else
        maxmin.className = "far fa-clone";
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
    cleardt()
}

function cleardt() {
    mtable.innerHTML = ''
}
function updateID3(arg) {
    title.textContent = arg.title === undefined ? 'Unknown Song' : arg.title
    artist.textContent = arg.artist === undefined ? 'Unknown Artist' : arg.artist
    let thumb
    if (arg.picture === undefined) {
        thumb = "../assets/vectors/disc1.svg"
        def_cover = true
    }
    else {
        thumb = URL.createObjectURL(
            new Blob([arg.picture[0].data.buffer], { type: arg.picture[0].format } /* (1) */)
        );
        def_cover = false
    }

    cover.style.backgroundImage = "url('" + thumb + "')"
    if (def_cover) {
        cover.style.borderRadius = "50%"
        cover.style.animationDuration = "4s"
        cover.style.animationPlayState = 'running'
    }
    else {
        cover.style.borderRadius = "0px"
        cover.style.animationDuration = "0s"
        cover.style.animationPlayState = 'paused'
    }
}

function sliderUpdate() {
    if (is_playing) {
        let curr = parseInt(progress.value)
        progress.value = curr + 1
        let value = (progress.value - progress.min) / (progress.max - progress.min) * 100
        progress.style.background = 'linear-gradient(to right, #82CFD0 0%, #82CFD0 ' + value + '%, #fff ' + value + '%, white 100%)'
        let min = parseInt((curr + 1) / 60)
        let sec = (curr + 1) % 60
        min = min < 10 ? "0" + min : sec
        sec = sec < 10 ? "0" + sec : sec
        curr_dur.innerHTML = min + ":" + sec
    }
}

function pickFolder() {
    const modalPath = path.join('file://', __dirname, 'pathdef.html')

    let win = new remote.BrowserWindow({
        backgroundColor: '#333',
        parent: currWin,
        modal: true,
        width: 400,
        height: 320,
        // alwaysOnTop: true,
        frame: false,
        show: false,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    })

    // win.webContents.openDevTools()
    win.once('ready-to-show', () => {
        win.show()
    })

    win.on('close', () => { win = null })
    win.loadURL(modalPath)
    win.show()
}
window.onload = initread

ipc.on('add-finished', reindex)

ipc.on('song-resume', () => {
    is_playing = true;
    playicon.className = 'bx bx-pause'
    if (def_cover == true)
        cover.style.animationPlayState = 'running'
})

ipc.on('song-pause', () => {
    is_playing = false;
    playicon.className = 'bx bx-play'
    if (def_cover == true)
        cover.style.animationPlayState = 'paused'
})

ipc.on('id3-result', function (event, arg) {
    updateID3(arg)
})

ipc.on('song-details', function (event, arg) {
    let data = JSON.parse(arg)
    let min = parseInt(data.duration / 60)
    let sec = data.duration % 60
    min = min < 10 ? "0" + min : sec
    sec = sec < 10 ? "0" + sec : sec
    curr_dur.textContent = '00:00'
    total_dur.innerHTML = min + ":" + sec
    progress.value = 0
    progress.max = parseInt(data.duration)
    progress.style.background = 'linear-gradient(to right, #82CFD0 0%, #fff 0%, #fff 100%)'
    song_dur = data.duration

    if (progressTimer != null)
        clearInterval(progressTimer)

    progressTimer = setInterval(sliderUpdate, 1000)

})
ipc.on('INACCESSIBLE', () => {
    snack('File not Accessible. Was it deleted?')
    console.log('File Not Accessible')
})
