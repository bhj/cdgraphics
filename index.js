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
* the screen, color LUT and other CDG variables.
************************************************/
class CDGContext {
  constructor () {
    this.init()
  }

  init () {
    this.hOffset = 0
    this.vOffset = 0
    this.keyColor = null // color LUT index
    this.bgColor = null // color LUT index
    this.borderColor = null // color LUT index
    this.clut = new Array(16).fill([0, 0, 0]) // color LUT
    this.pixels = new Uint8ClampedArray(this.WIDTH * this.HEIGHT).fill(0)
    this.buffer = new Uint8ClampedArray(this.WIDTH * this.HEIGHT).fill(0)
    this.imageData = new ImageData(this.WIDTH, this.HEIGHT)

    // informational
    this.backgroundRGBA = [0, 0, 0, 0]
    this.contentBounds = [0, 0, 0, 0] // x1, y1, x2, y2
  }

  setCLUTEntry (index, r, g, b) {
    this.clut[index] = [r, g, b].map(c => c * 17)
  }

  renderFrame ({ forceKey = false } = {}) {
    const [left, top, right, bottom] = [0, 0, this.WIDTH, this.HEIGHT]
    let [x1, y1, x2, y2] = [this.WIDTH, this.HEIGHT, 0, 0] // content bounds
    let isContent = false

    for (let y = top; y < bottom; y++) {
      for (let x = left; x < right; x++) {
        let colorIndex

        if (this.borderColor !== null && (
          x < this.DISPLAY_BOUNDS[0] ||
          y < this.DISPLAY_BOUNDS[1] ||
          x >= this.DISPLAY_BOUNDS[2] ||
          y >= this.DISPLAY_BOUNDS[3])
        ) {
          colorIndex = this.borderColor
        } else {
          // Respect the horizontal and vertical offsets for grabbing the pixel color
          const px = x + this.hOffset
          const py = y + this.vOffset
          const pixelIndex = px + (py * this.WIDTH)
          colorIndex = this.pixels[pixelIndex]
        }

        const [r, g, b] = this.clut[colorIndex]
        const isKeyColor = colorIndex === this.keyColor ||
          (forceKey && (colorIndex === this.bgColor || this.bgColor == null))

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

    // report content bounds, with two tweaks:
    // 1) if there are no visible pixels, report [0,0,0,0] (isContent flag)
    // 2) account for size of the rightmost/bottommost pixels in 2nd coordinates (+1)
    this.contentBounds = isContent || !forceKey ? [x1, y1, x2 + 1, y2 + 1] : [0, 0, 0, 0]

    // report background status
    this.backgroundRGBA = this.bgColor === null
      ? [0, 0, 0, forceKey ? 0 : 1]
      : [...this.clut[this.bgColor], this.bgColor === this.keyColor || forceKey ? 0 : 1]
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
* MEMORY_PRESET
************************************************/
class CDGMemoryPresetInstruction {
  constructor (bytes) {
    this.color = bytes[CDG_DATA] & 0x0F
    this.repeat = bytes[CDG_DATA + 1] & 0x0F
  }

  execute (ctx) {
    ctx.pixels.fill(this.color)
    ctx.bgColor = this.color
    ctx.borderColor = null
  }
}

/************************************************
* BORDER_PRESET
************************************************/
class CDGBorderPresetInstruction {
  constructor (bytes) {
    this.color = bytes[CDG_DATA] & 0x0F
  }

  execute (ctx) {
    ctx.borderColor = this.color
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

  execute (ctx) {
    /* blit a tile */
    const x = this.column * ctx.TILE_WIDTH
    const y = this.row * ctx.TILE_HEIGHT

    if (x + 6 > ctx.WIDTH || y + 12 > ctx.HEIGHT) {
      console.log(`TileBlock out of bounds (${this.row},${this.column})`)
      return
    }

    for (let i = 0; i < 12; i++) {
      const curbyte = this.pixels[i]
      for (let j = 0; j < 6; j++) {
        const color = this.colors[((curbyte >> (5 - j)) & 0x1)]
        const offset = x + j + (y + i) * ctx.WIDTH
        this.op(ctx, offset, color)
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
    this.vOffset = (vScroll & 0x0f)
  }

  execute (ctx) {
    ctx.hOffset = Math.min(this.hOffset, 5)
    ctx.vOffset = Math.min(this.vOffset, 11)

    let hmove = 0
    if (this.hCmd === CDG_SCROLL_RIGHT) {
      hmove = ctx.TILE_WIDTH
    } else if (this.hCmd === CDG_SCROLL_LEFT) {
      hmove = -ctx.TILE_WIDTH
    }

    let vmove = 0
    if (this.vCmd === CDG_SCROLL_DOWN) {
      vmove = ctx.TILE_HEIGHT
    } else if (this.vCmd === CDG_SCROLL_UP) {
      vmove = -ctx.TILE_HEIGHT
    }

    if (hmove === 0 && vmove === 0) {
      return
    }

    let offx, offy
    for (let x = 0; x < ctx.WIDTH; x++) {
      for (let y = 0; y < ctx.HEIGHT; y++) {
        offx = x + hmove
        offy = y + vmove
        ctx.buffer[x + y * ctx.WIDTH] = this.getPixel(ctx, offx, offy)
      }
    }

    const tmp = ctx.pixels
    ctx.pixels = ctx.buffer
    ctx.buffer = tmp
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

  execute (ctx) {
    ctx.keyColor = this.index
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

  execute (ctx) {
    for (let i = 0; i < 8; i++) {
      ctx.setCLUTEntry(i + this.clutOffset,
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
      const cmd = this.parse(this.bytes.slice(offset, offset + PACKET_SIZE))

      // ignore no-ops
      if (cmd) instructions.push(cmd)
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
        return false // no-op
      }
    }

    return false // no-op
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
  constructor () {
    this.ctx = new CDGContext()
  }

  load (buffer) {
    if (!(buffer instanceof ArrayBuffer)) throw new Error('load() expects an ArrayBuffer')

    this.forceKey = null
    this.parser = new CDGParser(buffer)
  }

  render (time, opts = {}) {
    if (!this.parser) throw new Error('load() must be called before render()')
    if (isNaN(time) || time < 0) throw new Error(`Invalid time: ${time}`)

    const instructions = this.parser.parseThrough(time)
    const isChanged = !!instructions.length || !!instructions.isRestarting || opts.forceKey !== this.forceKey
    this.forceKey = opts.forceKey // cache last value so we re-render if it changes

    if (instructions.isRestarting) {
      this.ctx.init()
    }

    for (const i of instructions) {
      i.execute(this.ctx)
    }

    if (isChanged) {
      this.ctx.renderFrame(opts)
    }

    return {
      imageData: this.ctx.imageData,
      isChanged,
      backgroundRGBA: this.ctx.backgroundRGBA,
      contentBounds: this.ctx.contentBounds,
    }
  }
}

module.exports = CDGPlayer
