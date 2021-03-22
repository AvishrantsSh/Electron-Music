const electron = require('electron')
const path = require('path')
const MStore = require('../assets/js/mstore.js');
const remote = electron.remote
const ipc = electron.ipcRenderer

// Control Buttons
const closeBtn = document.getElementById('closeBtn')
const addpth = document.getElementById('addpath')
const mlib_path = 'music-lib'

closeBtn.addEventListener('click', function () {
    var window = remote.getCurrentWindow()
    window.close()
})

addpth.addEventListener('click', function () {
    let mlib = new MStore({
        configName: mlib_path,
        defaults: {
            mdir: [],
            mpaths: [],
        }
    });
    // console.log(mlib.get('mdir'))
    var path = remote.dialog.showOpenDialog({ properties: ['openDirectory'] }).then(result => {
        if (result.canceled == false) {
            var currArr = mlib.get('mdir')
            var found = currArr.indexOf(result.filePaths[0])
            if (found == -1) {
                currArr.push(result.filePaths[0])
                mlib.set('mdir', currArr)
                ipc.send('add-finished')
            }
            else {
                console.log("Path Already Exists!")
            }
            fetch_dir()
        }
    }).catch(err => {
        console.log(err)
    });
})

function fetch_dir() {
    let mlib = new MStore({
        configName: mlib_path,
        defaults: {
            mdir: [],
            mpaths: [],
        }
    });
    let mdir = mlib.get('mdir')
    let table = document.getElementById('dir_holder')
    if (mdir.length == 0) {
        table.innerHTML = `
            <tr>
                <td> Oh Snap. No Music Data Found</td>
            </tr>`
    }
    else {
        table.innerHTML = ""
        mdir.forEach(function (path, index) {
            table.innerHTML += `<tr onclick="playSong(` + index + `)">
                    <td class="col-xs-12">`+ path + `</td>
                </tr>`
        });
    }
}

window.onload = fetch_dir
