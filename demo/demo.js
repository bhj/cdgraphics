const audioUrl = 'YOUR_MP3_FILE.mp3'
const cdgUrl = 'YOUR_CDG_FILE.cdg'

const app = document.getElementById('app')
const audio = document.createElement('audio')
const canvas = document.createElement('canvas')
const CDGPlayer = require('../index.js')
const cdg = new CDGPlayer(canvas)

// add <canvas> to page
canvas.width = 600
canvas.height = 432
canvas.style.border = '1px solid #ccc'
app.appendChild(canvas)

// add <audio> to page
audio.src = audioUrl
audio.controls = true
audio.style.display = 'block'
app.appendChild(audio)

// link to audio element's play/pause events
audio.addEventListener('play', function () { cdg.play() })
audio.addEventListener('pause', function () { cdg.stop() })

// sync to audio element's currentTime property
audio.addEventListener('timeupdate', function () {
  cdg.sync(audio.currentTime * 1000) // convert to ms
})

// download and load cdg file
fetch(cdgUrl)
  .then(checkStatus)
  .then(function (response) {
    return response.arrayBuffer()
  }).then(function (buffer) {
    // arrayBuffer to Uint8Array
    cdg.load(new Uint8Array(buffer))
  }).catch(function (error) {
    console.log('request failed', error)
  })

// helper for fetch response
function checkStatus (response) {
  if (response.status >= 200 && response.status < 300) {
    return response
  } else {
    var error = new Error(response.statusText)
    error.response = response
    throw error
  }
}
