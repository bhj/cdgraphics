cdgraphics
==========

A [CD Graphics (CD+G)](https://en.wikipedia.org/wiki/CD%2BG) implementation in JavaScript that draws to an HTML5 canvas. It's based on the [player by Luke Tucker](https://github.com/ltucker/html5_karaoke) and incorporates rendering improvements from [Keith McKnight's fork](https://github.com/kmck/karaoke).

* Uses [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) and an offscreen canvas for better performance
* Has a `sync` method for synchronizing to an audio element
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
- `options`: Optional object with one or more of the following properties:

| Option | Type | Description | Default
| --- | --- | --- | --- |
| forceTransparent | boolean | Experimental option that attempts to force backgrounds to be transparent, even if the CD+G title did not explicitly specify it. | false
| onBackgroundChange | function | Callback that will be invoked when the canvas background color changes. The color is passed as an array like `[r, g, b, a]` with `a` being 0 or 1. The reported alpha value includes the effect of the forceTransparent option, if enabled. | undefined |

Basic example:

```js
const CDGPlayer = require('cdgraphics')

const canvas = document.createElement('canvas') // or your existing element
const cdg = new CDGPlayer(canvas)
```

Example with options:
```js
const CDGPlayer = require('cdgraphics')

const canvas = document.createElement('canvas') // or your existing element
const cdg = new CDGPlayer(canvas, {
  forceTransparent: true,
  onBackgroundChange: color => { console.log('onBackgroundChange', color) }
})
```

Methods
-------

### `forceTransparent(bool)`

Enables or disables the `forceTransparent` option (see Usage above) while playing or paused.

### `load(bytes)`

Takes an array of bytes and parses the CD+G instructions. This method is synchronous and must be done before calling `play`. Here's an example using the fetch API:

```js
fetch(cdgFileUrl)
  .then(response => response.arrayBuffer())
  .then(buffer => {
    cdg.load(new Uint8Array(buffer))
  })
```

### `play()`

Starts or continues playback. Has no effect if already playing.

### `stop()`

Stops (pauses) playback. Has no effect if already stopped.

### `sync(ms)`

Sets the last known position of the audio source, in milliseconds. This can be used with the
 [timeupdate](https://developer.mozilla.org/en-US/docs/Web/Events/timeupdate) event of an audio element to keep the graphics in sync:

 ```js
 // your audio DOM element
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
