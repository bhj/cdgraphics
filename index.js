const CDG_NOOP = 0 // eslint-disable-line no-unused-vars
const CDG_MEMORY_PRESET = 1
const CDG_BORDER_PRESET = 2
const CDG_TILE_BLOCK = 6
const CDG_SCROLL_PRESET = 20
const CDG_SCROLL_COPY = 24
const CDG_SET_KEY_COLOR = 28
const CDG_LOAD_CLUT_LOW = 30
const CDG_LOAD_CLUT_HI = 31
const CDG_TILE_BLOCK_XOR = 38

const CDG_SCROLL_NONE = 0 // eslint-disable-line no-unused-vars
const CDG_SCROLL_LEFT = 1
const CDG_SCROLL_RIGHT = 2
const CDG_SCROLL_UP = 1
const CDG_SCROLL_DOWN = 2

const CDG_DATA = 4
const PACKET_SIZE = 24

/************************************************
* CDGContext represents a specific state of
* the screen, clut and other CDG variables.
************************************************/
class CDGContext {
  constructor (userCanvas) {
    // visible canvas
    this.userCanvas = userCanvas
    this.userCanvasCtx = userCanvas.getContext('2d')

    // offscreen canvas
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.WIDTH
    this.canvas.height = this.HEIGHT
    this.ctx = this.canvas.getContext('2d')

    this.init()
  }

  init () {
    this.hOffset = 0
    this.vOffset = 0
    this.keyColor = null // clut index
    this.bgColor = null // clut index
    this.clut = new Array(16).fill([0, 0, 0]) // color lookup table
    this.contentBounds = [0, 0, 0, 0] // x1, y1, x2, y2
    this.pixels = new Array(this.WIDTH * this.HEIGHT).fill(0)
    this.buffer = new Array(this.WIDTH * this.HEIGHT).fill(0)
    this.imageData = this.ctx.createImageData(this.WIDTH, this.HEIGHT)
  }

  setCLUTEntry (index, r, g, b) {
    this.clut[index] = [r, g, b].map(c => c * 17)
  }

  get backgroundRGBA () {
    if (this.bgColor === null) {
      return [0, 0, 0, this.forceKey ? 0 : 1]
    }

    return [
      ...this.clut[this.bgColor], // rgb
      this.bgColor === this.keyColor || this.forceKey ? 0 : 1, // a
    ]
  }

  get contentBoundsCoords () {
    const [x1, y1, x2, y2] = this.contentBounds
    return [x1 * this.scale, y1 * this.scale, x2 * this.scale, y2 * this.scale]
  }

  paint () {
    this.scale = Math.min(this.userCanvas.clientWidth / this.WIDTH,
      this.userCanvas.clientHeight / this.HEIGHT,
    )

    // clear destination canvas if there's transparency
    if (this.keyColor >= 0) {
      this.userCanvasCtx.clearRect(0, 0, this.WIDTH * this.scale, this.HEIGHT * this.scale)
    }

    // these get reset when the canvas is resized
    this.userCanvasCtx.imageSmoothingEnabled = false
    this.userCanvasCtx.shadowBlur = this.shadowBlur
    this.userCanvasCtx.shadowColor = this.shadowColor
    this.userCanvasCtx.shadowOffsetX = this.shadowOffsetX
    this.userCanvasCtx.shadowOffsetY = this.shadowOffsetY

    // copy and scale to visible canvas, shrinking to
    // prevent any shadow from being clipped
    this.userCanvasCtx.drawImage(
      this.canvas,
      this.shadowBlur - this.shadowOffsetX,
      this.shadowBlur - this.shadowOffsetY,
      (this.WIDTH * this.scale) - this.shadowBlur * 2,
      (this.HEIGHT * this.scale) - this.shadowBlur * 2
    )
  }

  renderFrame () {
    const [left, top, right, bottom] = [0, 0, this.WIDTH, this.HEIGHT]
    let [x1, y1, x2, y2] = [this.WIDTH, this.HEIGHT, 0, 0] // content bounds
    let isContent = false

    for (let y = top; y < bottom; y++) {
      for (let x = left; x < right; x++) {
        // Respect the horizontal and vertical offsets for grabbing the pixel color
        const px = ((x - this.hOffset) + this.WIDTH) % this.WIDTH
        const py = ((y - this.vOffset) + this.HEIGHT) % this.HEIGHT
        const pixelIndex = px + (py * this.WIDTH)
        const colorIndex = this.pixels[pixelIndex]
        const [r, g, b] = this.clut[colorIndex]
        const isKeyColor = colorIndex === this.keyColor ||
          (this.forceKey && (colorIndex === this.bgColor || this.bgColor == null))

        // Set the rgba values in the image data
        const offset = 4 * (x + (y * this.WIDTH))
        this.imageData.data[offset] = r
        this.imageData.data[offset + 1] = g
        this.imageData.data[offset + 2] = b
        this.imageData.data[offset + 3] = isKeyColor ? 0x00 : 0xff

        // test content bounds
        if (!isKeyColor) {
          isContent = true
          if (x1 > x) x1 = x
          if (y1 > y) y1 = y
          if (x2 < x) x2 = x
          if (y2 < y) y2 = y
        }
      }
    }

    this.ctx.putImageData(this.imageData, 0, 0)
    this.paint()

    // we make two tweaks to the reported bounds here:
    // 1) if there are no visible pixels (i.e. bg is keyed and canvas was just cleared)
    // we want to report [0,0,0,0] instead of the full dimensions (hence isContent flag)
    // 2) account for width/height of the rightmost/bottommost pixels in 2nd coordinates
    this.contentBounds = isContent || !this.forceKey ? [x1, y1, x2 + 1, y2 + 1] : [0, 0, 0, 0]
  }
}

CDGContext.prototype.WIDTH = 300
CDGContext.prototype.HEIGHT = 216
CDGContext.prototype.DISPLAY_WIDTH = 288
CDGContext.prototype.DISPLAY_HEIGHT = 192
CDGContext.prototype.DISPLAY_BOUNDS = [6, 12, 294, 204]
CDGContext.prototype.TILE_WIDTH = 6
CDGContext.prototype.TILE_HEIGHT = 12

/************************************************
* NOOP
************************************************/
class CDGNoopInstruction {
  execute () {
    return false // indicate no work was performed
  }
}

/************************************************
* MEMORY_PRESET
************************************************/
class CDGMemoryPresetInstruction {
  constructor (bytes) {
    this.color = bytes[CDG_DATA] & 0x0F
    this.repeat = bytes[CDG_DATA + 1] & 0x0F
  }

  execute (context) {
    context.pixels.fill(this.color)
    context.bgColor = this.color
  }
}

/************************************************
* BORDER_PRESET
************************************************/
class CDGBorderPresetInstruction {
  constructor (bytes) {
    this.color = bytes[CDG_DATA] & 0x0F
  }

  execute ({ DISPLAY_BOUNDS, WIDTH, pixels, HEIGHT }) {
    const b = DISPLAY_BOUNDS
    for (let x = 0; x < WIDTH; x++) {
      for (let y = 0; y < b[1]; y++) {
        pixels[x + y * WIDTH] = this.color
      }
      for (let y = b[3] + 1; y < HEIGHT; y++) {
        pixels[x + y * WIDTH] = this.color
      }
    }
    for (let y = b[1]; y <= b[3]; y++) {
      for (let x = 0; x < b[0]; x++) {
        pixels[x + y * WIDTH] = this.color
      }
      for (let x = b[2] + 1; x < WIDTH; x++) {
        pixels[x + y * WIDTH] = this.color
      }
    }
  }
}

/************************************************
* TILE_BLOCK
************************************************/
class CDGTileBlockInstruction {
  constructor (bytes) {
    // some players check bytes[doff+1] & 0x20 and ignores if it is set (?)
    this.colors = [bytes[CDG_DATA] & 0x0F, bytes[CDG_DATA + 1] & 0x0F]
    this.row = bytes[CDG_DATA + 2] & 0x1F
    this.column = bytes[CDG_DATA + 3] & 0x3F
    this.pixels = bytes.slice(CDG_DATA + 4, CDG_DATA + 16)
  }

  execute (context) {
    /* blit a tile */
    const x = this.column * context.TILE_WIDTH
    const y = this.row * context.TILE_HEIGHT

    if (x + 6 > context.WIDTH || y + 12 > context.HEIGHT) {
      console.log(`TileBlock out of bounds (${this.row},${this.column})`)
      return
    }

    for (let i = 0; i < 12; i++) {
      const curbyte = this.pixels[i]
      for (let j = 0; j < 6; j++) {
        const color = this.colors[((curbyte >> (5 - j)) & 0x1)]
        const offset = x + j + (y + i) * context.WIDTH
        this.op(context, offset, color)
      }
    }
  }

  op ({ pixels }, offset, color) {
    pixels[offset] = color
  }
}

/************************************************
* TILE_BLOCK_XOR
************************************************/
class CDGTileBlockXORInstruction extends CDGTileBlockInstruction {
  op ({ pixels }, offset, color) {
    pixels[offset] = pixels[offset] ^ color
  }
}

/************************************************
* SCROLL_PRESET
************************************************/
class CDGScrollPresetInstruction {
  constructor (bytes) {
    this.color = bytes[CDG_DATA] & 0x0F

    const hScroll = bytes[CDG_DATA + 1] & 0x3F
    this.hCmd = (hScroll & 0x30) >> 4
    this.hOffset = (hScroll & 0x07)

    const vScroll = bytes[CDG_DATA + 2] & 0x3F
    this.vCmd = (vScroll & 0x30) >> 4
    this.vOffset = (vScroll & 0x07)
  }

  execute (context) {
    context.hOffset = Math.min(this.hOffset, 5)
    context.vOffset = Math.min(this.vOffset, 11)

    let hmove = 0
    if (this.hCmd === CDG_SCROLL_RIGHT) {
      hmove = context.TILE_WIDTH
    } else if (this.hCmd === CDG_SCROLL_LEFT) {
      hmove = -context.TILE_WIDTH
    }

    let vmove = 0
    if (this.vCmd === CDG_SCROLL_DOWN) {
      vmove = context.TILE_HEIGHT
    } else if (this.vCmd === CDG_SCROLL_UP) {
      vmove = -context.TILE_HEIGHT
    }

    if (hmove === 0 && vmove === 0) {
      return
    }

    let offx, offy
    for (let x = 0; x < context.WIDTH; x++) {
      for (let y = 0; y < context.HEIGHT; y++) {
        offx = x + hmove
        offy = y + vmove
        context.buffer[x + y * context.WIDTH] = this.getPixel(context, offx, offy)
      }
    }

    const tmp = context.pixels
    context.pixels = context.buffer
    context.buffer = tmp
  }

  getPixel ({ WIDTH, HEIGHT, pixels }, offx, offy) {
    if (offx > 0 && offx < WIDTH && offy > 0 && offy < HEIGHT) {
      return pixels[offx + offy * WIDTH]
    } else {
      return this.color
    }
  }
}

/************************************************
* SCROLL_COPY
************************************************/
class CDGScrollCopyInstruction extends CDGScrollPresetInstruction {
  getPixel ({ WIDTH, HEIGHT, pixels }, offx, offy) {
    offx = (offx + WIDTH) % WIDTH
    offy = (offy + HEIGHT) % HEIGHT
    return pixels[offx + offy * WIDTH]
  }
}

/************************************************
* SET_KEY_COLOR
************************************************/
class CDGSetKeyColorInstruction {
  constructor (bytes) {
    this.index = bytes[CDG_DATA] & 0x0F
  }

  execute (context) {
    context.keyColor = this.index
  }
}

/************************************************
* LOAD_CLUT_LOW
************************************************/
class CDGLoadCLUTLowInstruction {
  constructor (bytes) {
    this.colors = Array(8)

    for (let i = 0; i < 8; i++) {
      const cur = CDG_DATA + 2 * i

      let color = (bytes[cur] & 0x3F) << 6
      color += bytes[cur + 1] & 0x3F

      const rgb = Array(3)
      rgb[0] = color >> 8 // red
      rgb[1] = (color & 0xF0) >> 4 // green
      rgb[2] = color & 0xF // blue
      this.colors[i] = rgb
    }
  }

  execute (context) {
    for (let i = 0; i < 8; i++) {
      context.setCLUTEntry(i + this.clutOffset,
        this.colors[i][0],
        this.colors[i][1],
        this.colors[i][2])
    }
  }

  get clutOffset () { return 0 }
}

/************************************************
* LOAD_CLUT_HI
************************************************/
class CDGLoadCLUTHighInstruction extends CDGLoadCLUTLowInstruction {
  get clutOffset () { return 8 }
}

/************************************************
* CDGParser
************************************************/
class CDGParser {
  constructor (buffer) {
    this.bytes = new Uint8Array(buffer)
    this.numPackets = buffer.byteLength / PACKET_SIZE
    this.pc = -1
  }

  parseThrough (sec) {
    // determine packet we should be at, based on spec
    // of 4 packets per sector @ 75 sectors per second
    const newPc = Math.floor(4 * 75 * sec)
    const instructions = []

    if (this.pc > newPc) {
      // rewind kindly
      this.pc = -1
      instructions.isRestarting = true
    }

    while (this.pc < newPc && this.pc < this.numPackets) {
      this.pc++
      const offset = this.pc * PACKET_SIZE
      instructions.push(this.parse(this.bytes.slice(offset, offset + PACKET_SIZE)))
    }

    return instructions
  }

  parse (packet) {
    if ((packet[0] & this.COMMAND_MASK) === this.CDG_COMMAND) {
      const opcode = packet[1] & this.COMMAND_MASK
      const InstructionType = this.BY_TYPE[opcode]

      if (typeof (InstructionType) !== 'undefined') {
        return new InstructionType(packet)
      } else {
        console.log(`Unknown CDG instruction (instruction = ${opcode})`)
        return new CDGNoopInstruction()
      }
    }

    return new CDGNoopInstruction()
  }
}

CDGParser.prototype.COMMAND_MASK = 0x3F
CDGParser.prototype.CDG_COMMAND = 0x9
CDGParser.prototype.BY_TYPE = {
  [CDG_MEMORY_PRESET]: CDGMemoryPresetInstruction,
  [CDG_BORDER_PRESET]: CDGBorderPresetInstruction,
  [CDG_TILE_BLOCK]: CDGTileBlockInstruction,
  [CDG_SCROLL_PRESET]: CDGScrollPresetInstruction,
  [CDG_SCROLL_COPY]: CDGScrollCopyInstruction,
  [CDG_SET_KEY_COLOR]: CDGSetKeyColorInstruction,
  [CDG_LOAD_CLUT_LOW]: CDGLoadCLUTLowInstruction,
  [CDG_LOAD_CLUT_HI]: CDGLoadCLUTHighInstruction,
  [CDG_TILE_BLOCK_XOR]: CDGTileBlockXORInstruction
}

/************************************************
* CDGPlayer
************************************************/
class CDGPlayer {
  constructor (canvas, opts = {}) {
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Must be instantiated with an HTMLCanvasElement')
    }

    this.canvas = canvas
    this.ctx = new CDGContext(this.canvas)
    this.setOptions(opts)
  }

  load (buffer) {
    this.lastBackground = null
    this.lastContentBounds = null
    this.isDirty = false
    this.parser = new CDGParser(buffer)
  }

  render (curTime) {
    if (typeof curTime === 'undefined') {
      this.ctx.paint()
      return
    } else if (isNaN(curTime) || curTime < 0) throw new Error(`Invalid time: ${curTime}`)

    const instructions = this.parser.parseThrough(curTime)

    if (!instructions.length) {
      // nothing to do, but we'll try to help out and re-paint
      this.ctx.paint()
      return
    } else if (instructions.isRestarting) {
      this.ctx.init()
    }

    for (const i of instructions) {
      // set dirty flag if work was performed (and flag isn't already set)
      if (i.execute(this.ctx) !== false && !this.isDirty) {
        this.isDirty = true
      }
    }

    if (this.isDirty) {
      this.ctx.renderFrame()
      this.isDirty = false
    }

    if (this.onBackgroundChange) {
      const cur = this.ctx.backgroundRGBA
      const last = this.lastBackground

      if (cur && !(last && cur.every((val, i) => val === last[i]))) {
        this.lastBackground = cur
        this.onBackgroundChange(cur)
      }
    }

    if (this.onContentBoundsChange) {
      const cur = this.ctx.contentBoundsCoords
      const last = this.lastContentBounds

      if (cur && !(last && cur.every((val, i) => val === last[i]))) {
        this.lastContentBounds = cur
        this.onContentBoundsChange(cur)
      }
    }
  }

  setOptions ({
    forceKey = this.ctx.forceKey || false,
    onBackgroundChange = this.onBackgroundChange || undefined,
    onContentBoundsChange = this.onContentBoundsChange || undefined,
    shadowBlur = this.ctx.shadowBlur || 0,
    shadowColor = this.ctx.shadowColor || 'rgba(0,0,0,1)',
    shadowOffsetX = this.ctx.shadowOffsetX || 0,
    shadowOffsetY = this.ctx.shadowOffsetY || 0
  } = {}) {
    if (onBackgroundChange && typeof onBackgroundChange !== 'function') {
      throw new Error('"onBackgroundChange" option must be a function')
    }

    if (onContentBoundsChange && typeof onContentBoundsChange !== 'function') {
      throw new Error('"onContentBoundsChange" option must be a function')
    }

    this.onBackgroundChange = onBackgroundChange
    this.onContentBoundsChange = onContentBoundsChange
    Object.assign(this.ctx, { forceKey, shadowBlur, shadowColor, shadowOffsetX, shadowOffsetY })

    this.ctx.renderFrame()
  }
}

module.exports = CDGPlayer
