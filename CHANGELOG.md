## v7.0 (TBD)

**Breaking changes:**

- The package is now in ECMAScript Module (ESM) format
- The `load()` method has been removed in favor of simply passing your file's ArrayBuffer to the constructor

**Improved:**

- Added TypeScript declarations
- Moved the build system from Webpack to Vite; to run the demo you can now `npm run dev`

## v6.0.1 (2023-08-02)

**Fixed:**

- Rendering issues when scrolling vertically and/or drawing inside the border area prior to scrolling (thanks [hcs64](https://github.com/bhj/cdgraphics/pull/22))

**Improved:**

- Added a "Show content bounds" option to the demo that draws a green rectangle indicating the reported `contentBounds` coordinates for each frame

## v6.0.0 (2021-02-19)

v6 is a **major change** making the library significantly smaller and more flexible. Please see the README for updated example usage.

- Instead of drawing to a canvas, `render()` now simply returns an [ImageData object](https://developer.mozilla.org/en-US/docs/Web/API/ImageData) along with some metadata. This gives full control over your canvas (if a canvas is used at all!)
- The `onBackgroundChange` callback is removed; instead, check the `backgroundRGBA` metadata provided with each rendered frame
- The `setOptions()` method is removed, as options are now arguments to `render()`
- When loading a file, you now only need to pass the ArrayBuffer of the response (the creation of the `new Uint8Array` is handled internally)

**Improved:**
- Instructions are now processed JIT, significantly reducing `load()` time
- Added `contentBounds` metadata describing a bounding box that fits the rendered frame's non-transparent content

## v5.0.0 (2020-07-23)

**Breaking changes/migrating from 4.x:**

v5 has a new, simple API. Instead of `play()`, `pause()` and `syncTime()`, you now control the [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) loop and `render()` a frame at the [currentTime](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio#attr-currentTime). This also enables full rewind/random seek support. See the README for more on using `render()`.

## v4.0.0 (2020-06-23)

**Breaking changes/migrating from 3.x:**
- The `forceTransparent` option has been renamed `forceKey`. Subsequently, the `forceTransparent()` method has been removed, and `forceKey` can be set with the new `setOptions()` method.

**Improved:**
- Added shadow effects support
- Significantly reduced CPU usage during idle frames

## v3.0.0 (2020-06-18)

**Breaking changes/migrating from 2.x:**
- Internet Explorer, Chrome < v30, and Firefox < v51 are no longer officially supported (removed vendor prefixes for [`imageSmoothingEnabled`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled))
- The `stop()` method has been renamed `pause()`
- The `sync()` method has been replaced with `syncTime()` and now expects a time in seconds (instead of ms)

**Improved:**
- Graphics now scale fluidly with the canvas instead of at fixed increments
- Canvas no longer temporarily appears blurry while resizing

## v2.0.1 (2018-11-11)

- Improved documentation

## v2.0.0 (2018-11-11)

- **BREAKING:** Requires ES2015 (or later) environment
- Major performance improvements from offscreen canvas rendering
- Added experimental forceTransparent option and callback for background color changes

## v1.0.2 (2018-04-04)

- Fix playback when `play()` is called before `load()` when already at end

## v1.0.1 (2018-01-21)

- Fix potential rendering errors by resetting canvas context on each load
- Fix playback failing to start when `play()` was called before `load()`
- Throw error if not instantiated with a valid canvas element

## v1.0.0 (2017-09-10)

- Initial release
