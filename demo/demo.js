const audioUrl = 'YOUR_MP3_FILE.mp3'
const cdgUrl = 'YOUR_CDG_FILE.cdg'

const CDGraphics = require('../index.js')
const cdg = new CDGraphics()

document.addEventListener('DOMContentLoaded', () => {
  const audio = document.getElementById('audio')
  const canvas = document.getElementById('canvas')
  const ctx = canvas.getContext('2d')
  let frameId

  const doRender = time => {
    const frame = cdg.render(time, { forceKey: forceKeyCheckbox.checked })
    if (!frame.isChanged) return

    createImageBitmap(frame.imageData)
      .then(bitmap => {
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
        ctx.drawImage(bitmap, 0, 0, canvas.clientWidth, canvas.clientHeight)
      })
  }

  // render loop
  const pause = () => cancelAnimationFrame(frameId)
  const play = () => {
    frameId = requestAnimationFrame(play)
    doRender(audio.currentTime)
  }

  // follow audio events (depending on your app, not all are strictly necessary)
  audio.addEventListener('play', play)
  audio.addEventListener('pause', pause)
  audio.addEventListener('ended', pause)
  audio.addEventListener('seeked', () => doRender(audio.currentTime))

  // download and load cdg file
  fetch(cdgUrl)
    .then(response => response.arrayBuffer())
    .then(buffer => {
      cdg.load(buffer)
      audio.src = audioUrl // pre-load audio
    })

  // for demo UI only
  const forceKeyCheckbox = document.getElementById('forceKey')
})
