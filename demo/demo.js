const audioUrl = 'YOUR_MP3_FILE.mp3'
const cdgUrl = 'YOUR_CDG_FILE.cdg'

document.addEventListener('DOMContentLoaded', () => {
  const audio = document.getElementById('audio')
  const canvas = document.getElementById('canvas')
  const CDGraphics = require('../index.js')

  const cdg = new CDGraphics(canvas, {
    forceKey: true,
    onBackgroundChange: color => {
      console.log('onBackgroundChange', color)
    }
  })

  // link to audio events
  audio.addEventListener('play', () => cdg.play())
  audio.addEventListener('pause', () => cdg.pause())
  audio.addEventListener('timeupdate', () => cdg.syncTime(audio.currentTime))

  // options UI
  const forceKeyCheckbox = document.getElementById('force_transparent')
  const shadowBlurRange = document.getElementById('shadowBlur')
  const shadowOffsetXRange = document.getElementById('shadowOffsetX')
  const shadowOffsetYRange = document.getElementById('shadowOffsetY')

  forceKeyCheckbox.addEventListener('change', (e) => cdg.setOptions({ forceKey: e.target.checked }))
  shadowBlurRange.addEventListener('change', (e) => cdg.setOptions({ shadowBlur: e.target.value }))
  shadowOffsetXRange.addEventListener('change', (e) => cdg.setOptions({ shadowOffsetX: e.target.value }))
  shadowOffsetYRange.addEventListener('change', (e) => cdg.setOptions({ shadowOffsetY: e.target.value }))

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
