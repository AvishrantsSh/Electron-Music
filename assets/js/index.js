const electron = require('electron')
const remote = electron.remote

// Control Buttons
const closeBtn = document.getElementById('closeBtn')
const minBtn = document.getElementById('minBtn')
const resBtn = document.getElementById('resBtn')
const playBtn = document.getElementById('playBtn')

// Icon Set
const maxmin = document.getElementById('maxmin')
const playicon = document.getElementById('playicon')

closeBtn.addEventListener('click', function () {
    var window = remote.getCurrentWindow()
    window.close()
})

minBtn.addEventListener('click', function () {
    var window = remote.getCurrentWindow()
    window.minimize()
})

resBtn.addEventListener('click', function () {
    var window = remote.getCurrentWindow()
    if (window.isMaximized()) {
        window.unmaximize()

        maxmin.classList.remove("fa-square");
        maxmin.classList.add("fa-clone");
    }
    else {
        if (window.maximizable) {
            window.maximize()
            maxmin.classList.add("fa-square");
            maxmin.classList.remove("fa-clone");
        }
    }
})

playBtn.addEventListener('click', function(){
    if(playicon.classList.contains("fa-play")){
        playicon.classList.remove("fa-play")
        playicon.classList.add("fa-pause")
    }
    else{
        playicon.classList.add("fa-play")
        playicon.classList.remove("fa-pause")
    }
})