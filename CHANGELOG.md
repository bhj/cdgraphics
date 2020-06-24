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
