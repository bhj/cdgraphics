## v3.0.0 (TBD)

**Breaking changes:**
- Dropped support for Internet Explorer, Chrome < v30, Firefox < v51 (removed vendor prefixes for `imageSmoothingEnabled`)
- The `stop()` method has been renamed `pause()`

**Improved:**
- Graphics now smoothly scale with the canvas instead of at fixed increments
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
