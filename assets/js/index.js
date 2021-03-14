const electron = require('electron')
const path = require('path')
const remote = electron.remote

// Control Buttons
const closeBtn = document.getElementById('closeBtn')
const minBtn = document.getElementById('minBtn')
const resBtn = document.getElementById('resBtn')
const playBtn = document.getElementById('playBtn')

// Icon Set
const maxmin = document.getElementById('maxmin')
const playicon = document.getElementById('playicon')

// Misc
const addM = document.getElementById('folder_pick')
const currWin = remote.getCurrentWindow()

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
    if (playicon.classList.contains("fa-play")) {
        playicon.classList.remove("fa-play")
        playicon.classList.add("fa-pause")
    }
    else {
        playicon.classList.add("fa-play")
        playicon.classList.remove("fa-pause")
    }
})

addM.addEventListener('click', function () {
    const modalPath = path.join('file://', __dirname, 'pathdef.html')

    let win = new remote.BrowserWindow({
        width: 400,
        parent: currWin,
        modal: true,
        height: 320,
        alwaysOnTop: true,
        frame: false,
        show: false,
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