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
*
* CDGContext represents a specific state of
* the screen, clut and other CDG variables.
*
************************************************/
class CDGContext {
  constructor (userCanvas, cfg = {}) {
    // visible canvas
    this.userCanvas = userCanvas
    this.userCanvasCtx = userCanvas.getContext('2d')

    // offscreen canvas
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.WIDTH
    this.canvas.height = this.HEIGHT
    this.ctx = this.canvas.getContext('2d')
    this.imageData = this.ctx.createImageData(this.WIDTH, this.HEIGHT)
    this.forceTransparent = cfg.forceTransparent

    this.init()
  }

  init () {
    this.hOffset = 0
    this.vOffset = 0
    this.keyColor = null // clut index
    this.bgColor = null // clut index
    this.clut = new Array(16).fill([0, 0, 0]) // color lookup table
    this.pixels = new Array(this.WIDTH * this.HEIGHT).fill(0)
    this.buffer = new Array(this.WIDTH * this.HEIGHT).fill(0)
    this.lastScale = 0
  }

  setCLUTEntry (index, r, g, b) {
    this.clut[index] = [r, g, b].map(c => c * 17)
  }

  get backgroundRGBA () {
    if (this.bgColor === null) {
      return [0, 0, 0, this.forceTransparent ? 0 : 1]
    }

    return [
      ...this.clut[this.bgColor], // rgb
      this.bgColor === this.keyColor ? 0 : 1, // a
    ]
  }

  renderFrame () {
    const [left, top, right, bottom] = [0, 0, this.WIDTH, this.HEIGHT]
    const scale = Math.min(
      Math.floor(this.userCanvas.clientWidth / this.WIDTH),
      Math.floor(this.userCanvas.clientHeight / this.HEIGHT),
    )

    for (let x = left; x < right; x++) {
      for (let y = top; y < bottom; y++) {
        // The offset is where we draw the pixel in the raster data
        const offset = 4 * (x + (y * this.WIDTH))
        // Respect the horizontal and vertical offsets for grabbing the pixel color
        const px = ((x - this.hOffset) + this.WIDTH) % this.WIDTH
        const py = ((y - this.vOffset) + this.HEIGHT) % this.HEIGHT
        const pixelIndex = px + (py * this.WIDTH)
        const colorIndex = this.pixels[pixelIndex]
        const [r, g, b] = this.clut[colorIndex]
        const isTransparent = colorIndex === this.keyColor ||
          (this.forceTransparent && (colorIndex === this.bgColor || this.bgColor == null))

        // Set the rgba values in the image data
        this.imageData.data[offset] = r
        this.imageData.data[offset + 1] = g
        this.imageData.data[offset + 2] = b
        this.imageData.data[offset + 3] = isTransparent ? 0x00 : 0xff
      }
    }

    this.ctx.putImageData(this.imageData, 0, 0)

    // clear destination canvas first if there's transparency
    if (this.keyColor >= 0) {
      this.userCanvasCtx.clearRect(0, 0, this.WIDTH * scale, this.HEIGHT * scale)
    }

    // copy to destination canvas and scale
    this.userCanvasCtx.drawImage(this.canvas, 0, 0, this.WIDTH * scale, this.HEIGHT * scale)

    if (scale !== this.lastScale) {
      this.lastScale = scale

      // these seem to need to be reapplied whenever the scale factor for drawImage changes
      this.userCanvasCtx.mozImageSmoothingEnabled = false
      this.userCanvasCtx.webkitImageSmoothingEnabled = false
      this.userCanvasCtx.msImageSmoothingEnabled = false
      this.userCanvasCtx.imageSmoothingEnabled = false
    }
  }
}

CDGContext.prototype.WIDTH = 300
CDGContext.prototype.HEIGHT = 216
CDGContext.prototype.DISPLAY_WIDTH = 288
CDGContext.prototype.DISPLAY_HEIGHT = 192
CDGContext.prototype.DISPLAY_BOUNDS = [ 6, 12, 294, 204 ]
CDGContext.prototype.TILE_WIDTH = 6
CDGContext.prototype.TILE_HEIGHT = 12

class CDGInstruction {
  constructor (bytes = [], offset = 0) {
    this.bytes = bytes.slice(offset, offset + PACKET_SIZE)
  }

  execute (context) { }
}

/************************************************
*
* NOOP
*
************************************************/
class CDGNoopInstruction extends CDGInstruction { }

/************************************************
*
* MEMORY_PRESET
*
************************************************/
class CDGMemoryPresetInstruction extends CDGInstruction {
  constructor (bytes, offset) {
    super(bytes, offset)

    const doff = offset + CDG_DATA
    this.color = bytes[doff] & 0x0F
    this.repeat = bytes[doff + 1] & 0x0F
  }

  execute (context) {
    context.pixels.fill(this.color)
    context.bgColor = this.color

    if (context.forceTransparent) {
      context.keyColor = this.color
    }
  }
}

/************************************************
*
* BORDER_PRESET
*
************************************************/
class CDGBorderPresetInstruction extends CDGInstruction {
  constructor (bytes, offset) {
    super(bytes, offset)

    this.color = bytes[offset + CDG_DATA] & 0x0F
  }

  execute ({ DISPLAY_BOUNDS, WIDTH, pixels, HEIGHT }) {
    // @todo skip if forceTransparent?

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
*
* TILE_BLOCK
*
************************************************/
class CDGTileBlockInstruction extends CDGInstruction {
  constructor (bytes, offset) {
    super(bytes, offset)

    const doff = offset + CDG_DATA
    // some players check bytes[doff+1] & 0x20 and ignores if it is set (?)
    this.colors = [bytes[doff] & 0x0F, bytes[doff + 1] & 0x0F]
    this.row = bytes[doff + 2] & 0x1F
    this.column = bytes[doff + 3] & 0x3F
    this.pixels = bytes.slice(doff + 4, doff + 16)
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
*
* TILE_BLOCK_XOR
*
************************************************/
class CDGTileBlockXORInstruction extends CDGTileBlockInstruction {
  op ({ pixels }, offset, color) {
    pixels[offset] = pixels[offset] ^ color
  }
}

/************************************************
*
* SCROLL_PRESET
*
************************************************/
class CDGScrollPresetInstruction extends CDGInstruction {
  constructor (bytes, offset) {
    super(bytes, offset)

    const doff = offset + CDG_DATA
    this.color = bytes[doff] & 0x0F

    const hScroll = bytes[doff + 1] & 0x3F
    this.hCmd = (hScroll & 0x30) >> 4
    this.hOffset = (hScroll & 0x07)

    const vScroll = bytes[doff + 2] & 0x3F
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

    let offx
    let offy
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
*
* SCROLL_COPY
*
************************************************/
class CDGScrollCopyInstruction extends CDGScrollPresetInstruction {
  getPixel ({ WIDTH, HEIGHT, pixels }, offx, offy) {
    offx = (offx + WIDTH) % WIDTH
    offy = (offy + HEIGHT) % HEIGHT
    return pixels[offx + offy * WIDTH]
  }
}

/************************************************
*
* SET_KEY_COLOR
*
************************************************/
class CDGSetKeyColorInstruction extends CDGInstruction {
  constructor (bytes, offset) {
    super(bytes, offset)
    this.index = bytes[offset + CDG_DATA] & 0x0F
  }

  execute (context) {
    context.keyColor = this.index
  }
}

/************************************************
*
* LOAD_CLUT_LOW
*
************************************************/
class CDGLoadCLUTLowInstruction extends CDGInstruction {
  constructor (bytes, offset) {
    super(bytes, offset)

    const doff = offset + CDG_DATA
    this.colors = Array(8)

    for (let i = 0; i < 8; i++) {
      const cur = doff + 2 * i

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
*
* LOAD_CLUT_HI
*
************************************************/
class CDGLoadCLUTHighInstruction extends CDGLoadCLUTLowInstruction {
  get clutOffset () { return 8 }
}

/************************************************
*
* CDGParser
*
************************************************/
class CDGParser {
  static parseOne (bytes, offset) {
    const command = bytes[offset] & this.COMMAND_MASK

    /* if this packet is a cdg command */
    if (command === this.CDG_COMMAND) {
      const opcode = bytes[offset + 1] & this.COMMAND_MASK
      const InstructionType = this.BY_TYPE[opcode]

      if (typeof (InstructionType) !== 'undefined') {
        return new InstructionType(bytes, offset)
      } else {
        console.log(`Unknown CDG instruction (instruction = ${opcode})`)
        return new CDGNoopInstruction()
      }
    }

    return new CDGNoopInstruction()
  }

  static parseData (bytes) {
    const instructions = []

    for (let offset = 0; offset < bytes.length; offset += PACKET_SIZE) {
      const instruction = this.parseOne(bytes, offset)

      if (instruction != null) {
        instructions.push(instruction)
      }
    }

    return instructions
  }
}

CDGParser.COMMAND_MASK = 0x3F
CDGParser.CDG_COMMAND = 0x9

CDGParser.BY_TYPE = {}
CDGParser.BY_TYPE[CDG_MEMORY_PRESET] = CDGMemoryPresetInstruction
CDGParser.BY_TYPE[CDG_BORDER_PRESET] = CDGBorderPresetInstruction
CDGParser.BY_TYPE[CDG_TILE_BLOCK] = CDGTileBlockInstruction
CDGParser.BY_TYPE[CDG_SCROLL_PRESET] = CDGScrollPresetInstruction
CDGParser.BY_TYPE[CDG_SCROLL_COPY] = CDGScrollCopyInstruction
CDGParser.BY_TYPE[CDG_SET_KEY_COLOR] = CDGSetKeyColorInstruction
CDGParser.BY_TYPE[CDG_LOAD_CLUT_LOW] = CDGLoadCLUTLowInstruction
CDGParser.BY_TYPE[CDG_LOAD_CLUT_HI] = CDGLoadCLUTHighInstruction
CDGParser.BY_TYPE[CDG_TILE_BLOCK_XOR] = CDGTileBlockXORInstruction

/************************************************
*
* CDGPlayer
*
************************************************/
class CDGPlayer {
  constructor (canvas, {
    forceTransparent = false,
    onBackgroundChange,
  } = {}) {
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Must be instantiated with a canvas element')
    }

    if (typeof forceTransparent !== 'boolean') {
      throw new Error(`'forceTransparent' option must be a boolean`)
    }

    if (onBackgroundChange && typeof onBackgroundChange !== 'function') {
      throw new Error(`'onBackgroundChange' option must be a function`)
    }

    this.canvas = canvas
    this.forceTransparent = forceTransparent
    this.onBackgroundChange = onBackgroundChange
    this.init()
  }

  init () {
    this.instructions = []
    this.pc = -1 // packet counter
    this.frameId = null
    this.pos = 0 // current position in ms
    this.lastSyncPos = null // ms
    this.lastTimestamp = null // DOMHighResTimeStamp
    this.lastBackground = null
  }

  load (data) {
    this.stop()
    this.init()

    this.instructions = CDGParser.parseData(data)
    this.context = new CDGContext(this.canvas, {
      forceTransparent: this.forceTransparent,
    })
    this.pc = 0
  }

  step () {
    if (this.pc >= 0 && this.pc < this.instructions.length) {
      this.instructions[this.pc].execute(this.context)
      this.pc += 1
    } else {
      this.stop()
      this.pc = -1
      console.log('No more instructions.')
    }
  }

  fastForward (count) {
    const max = this.pc + count
    while (this.pc >= 0 && this.pc < max) {
      this.step()
    }
  }

  play () {
    if (!this.frameId && this.instructions.length) {
      this.frameId = requestAnimationFrame(this.update.bind(this))
      this.lastTimestamp = performance.now()
    }
  }

  stop () {
    cancelAnimationFrame(this.frameId)
    this.frameId = null
  }

  sync (ms) {
    this.lastSyncPos = ms
    this.lastTimestamp = performance.now()
  }

  update (timestamp) {
    if (this.pc === -1) return

    // go ahead and request the next frame
    this.frameId = requestAnimationFrame(this.update.bind(this))

    if (this.lastSyncPos) {
      // last known audio position + time delta
      this.pos = this.lastSyncPos + (timestamp - this.lastTimestamp)
    } else {
      // time delta only (unsynced)
      this.pos += timestamp - this.lastTimestamp
      this.lastTimestamp = timestamp
    }

    // determine packet we should be at, based on spec
    // of 4 packets per sector @ 75 sectors per second
    const newPc = Math.floor(4 * 75 * (this.pos / 1000))
    const ffAmt = newPc - this.pc

    if (ffAmt <= 0) return

    this.fastForward(ffAmt)
    this.context.renderFrame()

    if (this.onBackgroundChange) {
      const cur = this.context.backgroundRGBA
      const last = this.lastBackground

      if (cur && !(last && cur.every((val, i) => val === last[i]))) {
        this.lastBackground = cur
        this.onBackgroundChange(cur)
      }
    }
  }
}

module.exports = CDGPlayer
