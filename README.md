# cdgraphics

A fast, flexible [CD+Graphics (CD+G)](https://en.wikipedia.org/wiki/CD%2BG) renderer.

* Designed for [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)
* Audio synchronization when used with [currentTime](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio#attr-currentTime)
* Optional background keying (transparency)
* Reports background RGBA and content bounds for each frame
* Supports all [modern browsers](https://caniuse.com/mdn-api_imagedata_imagedata)
* No dependencies

## Installation
```
$ npm i cdgraphics
```

## API

### `new CDGraphics()`

Instantiates a new parser/renderer.

```js
import CDGraphics from 'cdgraphics'
const cdg = new CDGraphics()
```

### `.load(buffer)`

Loads a CD+G file. Accepts an [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer), which can be had via the [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) of a [fetch()](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API). You must `load()` a CD+G file before calling `render()`.

```js
fetch(cdgFileUrl)
  .then(response => response.arrayBuffer())
  .then(buffer => cdg.load(buffer))
```

### `.render(time, [options])`

- `time`: Number (in seconds) of the frame to render. This will usually be the [currentTime](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio#attr-currentTime) of an `<audio>` element.
- `options`: Object with one or more of the following:
  - `forceKey`: Forces backgrounds to be transparent, even if the CD+G title did not explicitly specify it. Defaults to `false`.

Returns an object with the following properties:

- `imageData`: [ImageData object](https://developer.mozilla.org/en-US/docs/Web/API/ImageData) containing the rendered frame's pixel data.
- `isChanged`: Boolean indicating whether the frame changed since the last render. Useful for skipping unnecessary re-paints to the canvas.
- `backgroundRGBA`: Array containing the color of the frame's background in the form `[r, g, b, a]` with alpha being `0` or `1`. The reported alpha includes the effect of the forceKey option, if enabled.
- `contentBounds`: Array containing the coordinates of a bounding box that fits the frame's non-transparent pixels in the form `[x1, y1, x2, y2]`. Typically only useful when the forceKey option is enabled.

## Usage

The following excerpt demonstrates an audio-synced render loop that scales and draws to a canvas. See [the demo code](https://github.com/bhj/cdgraphics/blob/master/demo/demo.js) for a more complete example.

 ```js
const audio = document.getElementById('audio')
const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
let frameId

const doRender = time => {
  const frame = cdg.render(time)
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

// follow <audio> events
audio.addEventListener('play', play)
audio.addEventListener('pause', pause)
audio.addEventListener('ended', pause)
audio.addEventListener('seeked', () => doRender(audio.currentTime))
 ```

**NOTE**: As of this writing Safari does not fully implement [`createImageBitmap`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/createImageBitmap), however there are [other methods](https://stackoverflow.com/a/51394338) of scaling the image data when drawing to a canvas.

## Demo

To run the demo and see how it all comes together:

1. Clone the repo
2. Place your audio and .cdg file in the `demo` folder
3. Update lines 1 and 2 of `demo/demo.js` with those filenames
4. `$ npm i`
5. `$ npm run demo`
6. Browse to `http://localhost:8080` (the demo is served by webpack-dev-server)

## Acknowledgements

* Originally based on the [player by Luke Tucker](https://github.com/ltucker/html5_karaoke), with improvements from [Keith McKnight's fork](https://github.com/kmck/karaoke)
* [Jim Bumgardner's CD+G Revealed](http://jbum.com/cdg_revealed.html) document/specification

## License

[ISC](https://opensource.org/licenses/ISC)
