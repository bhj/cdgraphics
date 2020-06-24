cdgraphics
==========

A [CD+Graphics (CD+G)](https://en.wikipedia.org/wiki/CD%2BG) implementation in JavaScript that draws to an HTML5 canvas. It's based on the [player by Luke Tucker](https://github.com/ltucker/html5_karaoke) with improvements from [Keith McKnight's fork](https://github.com/kmck/karaoke).

* Fast (60fps) rendering using [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)
* Supports audio synchronization
* Callback support for CD+G title background changes
* Optional forced background keying (transparency) and shadow effects
* ES2015+
* Not designed for server-side rendering

Installation
------------
```
$ npm i cdgraphics
```

Usage
-----
### `new CDGraphics(canvas, [options])`

- `canvas`: Your [`<canvas>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas) element. Required.
- `options`: Optional object with one or more of the following:

| Property | Type | Description | Default
| --- | --- | --- | --- |
| forceKey | Boolean | Force backgrounds to be transparent, even if the CD+G title did not explicitly specify it. | `false`
| onBackgroundChange | Function | Called when the CD+G title's background color or alpha changes. The RGBA color is passed as an array like `[r, g, b, a]` with alpha being `0` or `1`. The reported alpha includes the effect of the forceKey option, if enabled. | `undefined` |
| shadowBlur | Number | [CanvasRenderingContext2D.shadowBlur](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/shadowBlur) (You likely also want to enable forceKey) | `0` |
| shadowColor | String | [CanvasRenderingContext2D.shadowColor](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/shadowColor) (Alpha is defaulted to `1` here so that any shadowBlur is visible without explicitly specifying this option) | `rgba(0,0,0,1)` |
| shadowOffsetX | Number | [CanvasRenderingContext2D.shadowOffsetX](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/shadowOffsetX) | `0` |
| shadowOffsetY | Number | [CanvasRenderingContext2D.shadowOffsetY](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/shadowOffsetY) | `0` |

**Note:** When using shadow* options, graphics will render smaller and/or offset to fit the canvas as needed to avoid clipping the shadow.

Methods
-------

### `load(array)`

Takes an array of bytes and parses the CD+G instructions synchronously. This must be done before calling `play`. Here's an example using fetch:

```js
fetch(cdgFileUrl)
  .then(response => response.arrayBuffer())
  .then(buffer => {
    cdg.load(new Uint8Array(buffer))
  })
```

### `play()`

Starts or resumes playback. Has no effect if already playing.

### `pause()`

Pauses playback. Has no effect if already paused.

### `setOptions(object)`

Sets one or more [options](#usage) on-the-fly.

 ```js
 // whether playing or paused...
 cdg.setOptions({ forceKey: true })
 ```

### `syncTime(number)`

Sets the last known audio position in seconds (s). This can be used with the
 [timeupdate](https://developer.mozilla.org/en-US/docs/Web/Events/timeupdate) event of an audio element to keep the graphics synchronized:

 ```js
 // your <audio> element
 audio.addEventListener('timeupdate', () => cdg.syncTime(audio.currentTime))
 ```

Example
-------
This creates and passes a `<canvas>` to the constructor, then downloads and plays the .cdg file:

```js
const CDGraphics = require('cdgraphics')

// or your existing <canvas> element
const canvas = document.createElement('canvas')
document.body.appendChild(canvas)
canvas.width = 600
canvas.height = 432

const cdg = new CDGraphics(canvas)

// download, parse and play
fetch('your_file.cdg')
  .then(response => response.arrayBuffer())
  .then(buffer => {
    cdg.load(new Uint8Array(buffer))
    cdg.play()
  })

```

Running the Demo
----------------

To see how it all comes together:

1. Clone the repo
2. Place your audio and .cdg file in the `demo` folder
3. Update lines 1 and 2 of `demo/demo.js` with those filenames
4. `npm i`
5. `npm run demo`
6. Browse to `http://localhost:8080` (the demo is served by webpack-dev-server)

Resources
---------
* [Jim Bumgardner's CD+G Revealed](http://jbum.com/cdg_revealed.html) document/specification

License
-------

[ISC](https://opensource.org/licenses/ISC)
