const electron = require('electron')
const path = require('path')
const remote = electron.remote
const MStore = require('../assets/js/mstore.js');
const mlib_path = 'music-lib'

const mlib = new MStore({
    configName: mlib_path,
    defaults: {
        total: 0,
        mdir: [],
        mpaths: [],
    }
});

let total = mlib.get('total')
let  mdir = mlib.get('path')
console.log(total)


