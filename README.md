cdgraphics
==========

A [CD Graphics (CD+G)](https://en.wikipedia.org/wiki/CD%2BG) implementation in JavaScript that draws to an HTML5 canvas. It's based on the [player by Luke Tucker](https://github.com/ltucker/html5_karaoke) and incorporates rendering improvements from [Keith McKnight's fork](https://github.com/kmck/karaoke).

* Uses [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) and an offscreen canvas for improved playback performance
* Has a `sync` method for synchronizing to an audio element
* Not designed for server-side rendering

Installation
------------
```
$ npm i cdgraphics
```

Usage
-----
```js
const CDGPlayer = require('cdgraphics')

// pass it your canvas DOM element
const cdg = new CDGPlayer(canvas)
```

API
-------

### .load(data)

Takes a CD+G data stream as an array and parses it in preparation for playback. This must be done before calling `play`. Here's an example using the fetch API:

```js
fetch(cdgFileUrl)
  .then(response => response.arrayBuffer())
  .then(buffer => {
    cdg.load(new Uint8Array(buffer))
  })
```

### .play()

Starts or continues playback. Has no effect if already playing.

### .stop()

Stops (pauses) playback. Has no effect if already stopped.

### .sync(ms)

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
