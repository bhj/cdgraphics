# cdgraphics

A [CD+Graphics (CD+G)](https://en.wikipedia.org/wiki/CD%2BG) implementation in JavaScript that draws to an HTML5 canvas. It's based on the [player by Luke Tucker](https://github.com/ltucker/html5_karaoke) with improvements from [Keith McKnight's fork](https://github.com/kmck/karaoke).

* 60fps rendering with [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)
* Audio synchronization with [currentTime](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio#attr-currentTime)
* Optional background keying (transparency) and shadow effects
* Supports callback for CD+G title background color changes
* Supports rewind and random seek
* ES2015+ with no dependencies

## Installation
```
$ npm i cdgraphics
```

## API

### `new CDGraphics(canvas, [options])`

- `canvas`: Your [`<canvas>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas) element. Required.
- `options`: Object with one or more [options](#options).

```js
import CDGraphics from 'cdgraphics'

const canvas = document.getElementById('my-canvas')
const cdg = new CDGraphics(canvas, { forceKey: true }) // force background transparency
```

#### Options

| Property | Type | Description | Default
| --- | --- | --- | --- |
| forceKey | boolean | Force backgrounds to be transparent, even if the CD+G title did not explicitly specify it. | `false`
| onBackgroundChange | function | Called when the CD+G title's background color or alpha changes. The RGBA color is passed as an array like `[r, g, b, a]` with alpha being `0` or `1`. The reported alpha includes the effect of the forceKey option, if enabled. | `undefined` |
| shadowBlur | number | [CanvasRenderingContext2D.shadowBlur](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/shadowBlur) (You likely also want to enable forceKey) | `0` |
| shadowColor | string | [CanvasRenderingContext2D.shadowColor](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/shadowColor) (Alpha is defaulted to `1` here so that any shadowBlur is visible without explicitly specifying this option) | `rgba(0,0,0,1)` |
| shadowOffsetX | number | [CanvasRenderingContext2D.shadowOffsetX](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/shadowOffsetX) | `0` |
| shadowOffsetY | number | [CanvasRenderingContext2D.shadowOffsetY](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/shadowOffsetY) | `0` |

**Note:** When using shadow* options, graphics will render smaller and/or offset to fit the canvas as needed to avoid clipping the shadow.

### `.load(array)`

Loads an array of bytes and parses the CD+G instructions. This must be done before calling `render()`.

```js
fetch(cdgFileUrl)
  .then(response => response.arrayBuffer())
  .then(buffer => {
    cdg.load(new Uint8Array(buffer))
  })
```

### `.render([number])`

Renders the frame at the given playback position (in seconds). Calling without a parameter will re-paint the last-rendered frame to the canvas.

This method is designed to be used with [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) and the [currentTime](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio#attr-currentTime) property of an HTMLMediaElement (usually an `<audio>` element). The following excerpt shows a basic render loop:

 ```js
let frameId

// methods for render loop
const play = () => {
  frameId = requestAnimationFrame(play)
  cdg.render(audio.currentTime)
}
const pause = () => cancelAnimationFrame(frameId)

// link to <audio> element
audio.addEventListener('play', play)
audio.addEventListener('pause', pause)
audio.addEventListener('ended', pause)
audio.addEventListener('seeked', () => cdg.render(audio.currentTime))
 ```

See [the demo code](https://github.com/bhj/cdgraphics/blob/master/demo/demo.js) for a complete example.

### `.setOptions(object)`

Sets one or more [options](#options) and re-renders.

## Demo

To run the demo and see how it all comes together:

1. Clone the repo
2. Place your audio and .cdg file in the `demo` folder
3. Update lines 1 and 2 of `demo/demo.js` with those filenames
4. `$ npm i`
5. `$ npm run demo`
6. Browse to `http://localhost:8080` (the demo is served by webpack-dev-server)

## Resources

* [Jim Bumgardner's CD+G Revealed](http://jbum.com/cdg_revealed.html) document/specification

## License

[ISC](https://opensource.org/licenses/ISC)
