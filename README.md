Javascript/HTML5 Karaoke (CD+G) Player
======================================

This is a [CD Graphics (CD+G)](https://en.wikipedia.org/wiki/CD%2BG) implementation in Javascript that draws to an HTML5 canvas. It's based on the [player by Luke Tucker](https://github.com/ltucker/html5_karaoke) with a few key differences:

* Uses [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) instead of a fixed timer for rendering
* Has a `sync` method that can be used in conjunction with an audio element's [timeupdate](https://developer.mozilla.org/en-US/docs/Web/Events/timeupdate) event and [currentTime](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/currentTime) property to synchronize graphics to audio (see the demo)
* No jQuery dependencies

Running the Demo
----------------
1. Place your audio file and cdg file in the `build` folder alongside `index.html` (this folder will be served by [webpack-dev-server](https://webpack.github.io/docs/webpack-dev-server.html))
2. Update lines 1 and 2 of `app/index.js` with those filenames
3. `npm install`
4. `npm start`
5. Open `http://localhost:8080/webpack-dev-server/` in a browser and you should see/hear things!

Note: This demo relies on the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) to download and decode the CD+G data stream to a 'normal' array usable by the player. Fetch is currently included as a polyfill via Webpack to achieve this until the browsers catch up.

Resources
---------
* [Jim Bumgardner's CD+G Revealed](http://jbum.com/cdg_revealed.html) document/specification

License
-------

[ISC](https://opensource.org/licenses/ISC)
