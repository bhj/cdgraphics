const audioUrl = 'YOUR_MP3_FILE.mp3'
const cdgUrl = 'YOUR_CDG_FILE.cdg'

document.addEventListener('DOMContentLoaded', () => {
  const audio = document.getElementById('audio')
  const canvas = document.getElementById('canvas')
  const CDGraphics = require('../index.js')
  let frameId

  const cdg = new CDGraphics(canvas, {
    // forceKey: true,
    onBackgroundChange: ([r, g, b, a]) => {
      console.log('onBackgroundChange:', `rgba(${r},${g},${b},${a})`)
    },
    onContentBoundsChange: ([x1, y1, x2, y2]) => {
      console.log('onContentBoundsChange:', `(${x1},${y1}) (${x2},${y2})`)
    }
  })

  // methods for render loop
  const play = () => {
    frameId = requestAnimationFrame(play)
    cdg.render(audio.currentTime)
  }
  const pause = () => cancelAnimationFrame(frameId)

  // link to audio events (depending on your app, not all are strictly necessary)
  audio.addEventListener('play', play)
  audio.addEventListener('pause', pause)
  audio.addEventListener('ended', pause)
  audio.addEventListener('seeked', () => cdg.render(audio.currentTime))

  // download and load cdg file
  fetch(cdgUrl)
    .then(response => response.arrayBuffer())
    .then(buffer => {
      cdg.load(buffer)
      audio.src = audioUrl // pre-load audio
    })

  // demo options UI only
  const forceKeyCheckbox = document.getElementById('forceKey')
  const shadowBlurRange = document.getElementById('shadowBlur')
  const shadowOffsetXRange = document.getElementById('shadowOffsetX')
  const shadowOffsetYRange = document.getElementById('shadowOffsetY')

  forceKeyCheckbox.addEventListener('change', (e) => cdg.setOptions({ forceKey: e.target.checked }))
  shadowBlurRange.addEventListener('change', (e) => cdg.setOptions({ shadowBlur: e.target.value }))
  shadowOffsetXRange.addEventListener('change', (e) => cdg.setOptions({ shadowOffsetX: e.target.value }))
  shadowOffsetYRange.addEventListener('change', (e) => cdg.setOptions({ shadowOffsetY: e.target.value }))
})
