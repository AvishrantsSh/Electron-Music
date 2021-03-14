const electron = require('electron')
const path = require('path')
const remote = electron.remote
const MStore = require('../assets/js/mstore.js');
const mlib_path = 'music-lib'

const mlib = new MStore({
    configName: mlib_path,
    defaults: {
        mdir: [],
        mpaths: [],
    }
});

let  mdir = mlib.get('mdir')
console.log(total)


