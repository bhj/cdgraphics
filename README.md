cdgraphics
==========

[CD+Graphics (CD+G)](https://en.wikipedia.org/wiki/CD%2BG) implementation in JavaScript that draws to an HTML5 canvas. It's based on the [player by Luke Tucker](https://github.com/ltucker/html5_karaoke) with improvements from [Keith McKnight's fork](https://github.com/kmck/karaoke).

* Fast (60fps) rendering using [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)
* Supports audio synchronization
* Callback for CD+G title background color changes
* Option to force CD+G title transparent background
* ES2015 compatible
* Not designed for server-side rendering

Installation
------------
```
$ npm i cdgraphics
```

Usage
-----

### `new CDGPlayer(canvas, [options])`

- `canvas`: Your canvas element. Required.
- `options`: Optional object with one or more of the following:

| Property | Type | Description | Default
| --- | --- | --- | --- |
| forceTransparent | boolean | Force backgrounds to be transparent, even if the CD+G title did not explicitly specify it. | false
| onBackgroundChange | function | Will be called when the CD+G title's background color or alpha changes. The RGBA color is passed as an array like `[r, g, b, a]` with alpha being 0 or 1. The reported alpha includes the effect of the `forceTransparent` option, if enabled. | undefined |

The following example creates and passes a `<canvas>` to the constructor, then downloads and plays the .cdg file:

```js
const CDGPlayer = require('cdgraphics')

// or your existing <canvas> element
const canvas = document.createElement('canvas')
document.body.appendChild(canvas)
canvas.width = 600
canvas.height = 432

const cdg = new CDGPlayer(canvas)

// download, parse and play
fetch('your_file.cdg')
  .then(response => response.arrayBuffer())
  .then(buffer => {
    cdg.load(new Uint8Array(buffer))
    cdg.play()
  })

```

Methods
-------

### `forceTransparent(boolean)`

Enables or disables the `forceTransparent` option (see Usage above) while playing or paused.

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

### `sync(number)`

Sets the last known position of the audio source in milliseconds (ms). This can be used with the
 [timeupdate](https://developer.mozilla.org/en-US/docs/Web/Events/timeupdate) event of an audio element to keep the graphics synchronized:

 ```js
 // your <audio> element
 audio.addEventListener('timeupdate', function () {
   cdg.sync(audio.currentTime * 1000) // convert to ms
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
6. Point your browser to `http://localhost:8080` (the demo is served by webpack-dev-server)

Resources
---------
* [Jim Bumgardner's CD+G Revealed](http://jbum.com/cdg_revealed.html) document/specification

License
-------

[ISC](https://opensource.org/licenses/ISC)
