const electron = require('electron')
const path = require('path')
const MStore = require('../assets/js/mstore.js');
const remote = electron.remote
const mlib_path = 'music-lib'

const mlib = new MStore({
    configName: mlib_path,
    defaults: {
        total: 0,
        mdir: [],
        mpaths: [],
    }
});

// Control Buttons
const closeBtn = document.getElementById('closeBtn')
const addpth = document.getElementById('addpath')

closeBtn.addEventListener('click', function () {
    var window = remote.getCurrentWindow()
    window.close()
})

addpth.addEventListener('click', function () {
    // console.log(mlib.get('mdir'))
    var path = remote.dialog.showOpenDialog({ properties: ['openDirectory'] }).then(result => {
        if (result.canceled == false) {
            var currArr = mlib.get('mdir')
            var found = currArr.indexOf(result.filePaths[0])
            if (found == -1) {
                currArr.push(result.filePaths[0])
                mlib.set('mdir', currArr)
            }
            else{
                console.log("Path Already Exists!")
            }
        }
    }).catch(err => {
        console.log(err)
    });
})