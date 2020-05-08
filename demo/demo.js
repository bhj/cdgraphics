const audioUrl = 'YOUR_MP3_FILE.mp3'
const cdgUrl = 'YOUR_CDG_FILE.cdg'

document.addEventListener('DOMContentLoaded', () => {
  const audio = document.getElementById('audio')
  const canvas = document.getElementById('canvas')

  const CDGPlayer = require('../index.js')
  const cdg = new CDGPlayer(canvas, {
    onBackgroundChange: color => {
      console.log('onBackgroundChange', color)
    }
  })

  // link to audio events
  audio.addEventListener('play', () => { cdg.play() })
  audio.addEventListener('pause', () => { cdg.pause() })
  audio.addEventListener('timeupdate', () => {
    cdg.sync(audio.currentTime * 1000) // convert to ms
  })

  // checkbox for forceTransparent
  const checkbox = document.getElementById('force_transparent')

  checkbox.addEventListener('change', (e) => {
    cdg.forceTransparent(e.target.checked)
  })

  // download and load cdg file
  fetch(cdgUrl)
    .then(response => response.arrayBuffer())
    .then(buffer => {
      // arrayBuffer to Uint8Array
      cdg.load(new Uint8Array(buffer))

      // start loading audio
      audio.src = audioUrl
    })
})
