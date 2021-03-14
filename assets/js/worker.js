const electron = require('electron')
const remote = electron.remote
const MStore = require('../assets/js/mstore.js');
const mlib_path = 'music-lib'

const mlib = new MStore({
    configName: mlib_path,
    defaults: {
        total: 1,
        path: ['something is there'],
    }
});

let total = mlib.get('total')
let path = mlib.get('path')
console.log(total)
console.log(path[0])


