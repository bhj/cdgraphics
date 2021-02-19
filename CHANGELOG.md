## v6.0.0 (TBD)

v6 is a **major change** making the library significantly smaller and more flexible. Please see the README for updated example usage.

- Instead of drawing to a canvas, `render()` now simply returns an [ImageData object](https://developer.mozilla.org/en-US/docs/Web/API/ImageData) along with some metadata. This gives full control over your canvas (if a canvas is used at all!)
- The `onBackgroundChange` callback is removed; instead, check the `backgroundRGBA` metadata provided with each rendered frame
- The `setOptions()` method is removed, as options are now arguments to `render()`
- When loading a file, you now only need to pass the ArrayBuffer of the response (the creation of the `new Uint8Array` is handled internally)

**Improved:**
- Instructions are now processed JIT, significantly reducing `load()` time
- Added `contentBounds` metadata describing a bounding box that fits the rendered frame's non-transparent content

## v5.0.0 (July 23, 2020)

**Breaking changes/migrating from 4.x:**

v5 has a new, simple API. Instead of `play()`, `pause()` and `syncTime()`, you now control the [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) loop and `render()` a frame at the [currentTime](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio#attr-currentTime). This also enables full rewind/random seek support. See the README for more on using `render()`.

## v4.0.0 (June 23, 2020)

**Breaking changes/migrating from 3.x:**
- The `forceTransparent` option has been renamed `forceKey`. Subsequently, the `forceTransparent()` method has been removed, and `forceKey` can be set with the new `setOptions()` method.

**Improved:**
- Added shadow effects support
- Significantly reduced CPU usage during idle frames

## v3.0.0 (June 18, 2020)

**Breaking changes/migrating from 2.x:**
- Internet Explorer, Chrome < v30, and Firefox < v51 are no longer officially supported (removed vendor prefixes for [`imageSmoothingEnabled`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled))
- The `stop()` method has been renamed `pause()`
- The `sync()` method has been replaced with `syncTime()` and now expects a time in seconds (instead of ms)

**Improved:**
- Graphics now scale fluidly with the canvas instead of at fixed increments
- Canvas no longer temporarily appears blurry while resizing

## v2.0.1 (Nov 11, 2018)

- Improved documentation

## v2.0.0 (Nov 11, 2018)

- **BREAKING:** Requires ES2015 (or later) environment
- Major performance improvements from offscreen canvas rendering
- Added experimental forceTransparent option and callback for background color changes

## v1.0.2 (Apr 4, 2018)

- Fix playback when `play()` is called before `load()` when already at end

## v1.0.1 (Jan 21, 2018)

- Fix potential rendering errors by resetting canvas context on each load
- Fix playback failing to start when `play()` was called before `load()`
- Throw error if not instantiated with a valid canvas element

## v1.0.0 (Sep 10, 2017)

- Initial release
