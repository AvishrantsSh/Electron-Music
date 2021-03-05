const electron = require('electron')
const remote = electron.remote

const closeBtn = document.getElementById('closeBtn')
const minBtn = document.getElementById('minBtn')
const resBtn = document.getElementById('resBtn')

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
    window.maximize()
})