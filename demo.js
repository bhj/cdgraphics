const audioUrl = 'YOUR_MP3_FILE.mp3' // place in ./build folder
const cdgUrl = 'YOUR_CDG_FILE.cdg' // place in ./build folder

const app = document.getElementById('app')
const audio = document.createElement('audio')
const canvas = document.createElement('canvas')
const CDGPlayer = require('./index.js')
const cdg = new CDGPlayer(canvas)

// create <canvas> element
canvas.width = 600
canvas.height = 432
app.appendChild(canvas)

// create <audio> element
audio.src = audioUrl
app.appendChild(audio)

// start graphics when audio element begins playing
audio.addEventListener('playing', function () {
  cdg.play()
})

// sync to audio element's currentTime property
audio.addEventListener('timeupdate', function () {
  cdg.sync(audio.currentTime * 1000) // convert to ms
})

// download and decode cdg file asynchronously
fetch(cdgUrl)
  .then(checkStatus)
  .then(function (response) {
    return response.arrayBuffer()
  }).then(function (buffer) {
    // convert arrayBuffer to Uint8Array to normal Array
    cdg.load(Array.from(new Uint8Array(buffer)))

    // load and play the audio file, which will fire
    // the "playing" event and play() our CDGraphics
    audio.play()
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
