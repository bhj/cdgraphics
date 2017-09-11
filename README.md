cdgraphics
==========

A [CD Graphics (CD+G)](https://en.wikipedia.org/wiki/CD%2BG) implementation in Javascript that draws to an HTML5 canvas. It's based on the [player by Luke Tucker](https://github.com/ltucker/html5_karaoke) with a few differences:

* Uses [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) instead of a fixed timer for rendering
* Has a `sync` method to synchronize with an audio element's [timeupdate](https://developer.mozilla.org/en-US/docs/Web/Events/timeupdate) event (see the demo)
* No jQuery dependency

Running the Demo
----------------
1. Place your audio and .cdg file in the `build` folder alongside `index.html` (this folder will be served by [webpack-dev-server](https://webpack.github.io/docs/webpack-dev-server.html))
2. Update lines 1 and 2 of `demo.js` with those filenames (this demo app gets compiled to `build/bundle.js`)
3. `npm install`
4. `npm start`
5. Open `http://localhost:8080/webpack-dev-server/` in a browser and you should see/hear things!

Resources
---------
* [Jim Bumgardner's CD+G Revealed](http://jbum.com/cdg_revealed.html) document/specification

License
-------

[ISC](https://opensource.org/licenses/ISC)
