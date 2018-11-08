/************************************************
*
* CDGContext represents a specific state of
* the screen, clut and other CDG variables.
*
************************************************/

const CDGContext = function (userCanvas) {
  // visible canvas
  this.userCanvas = userCanvas
  this.userCanvasCtx = userCanvas.getContext('2d')

  // offscreen canvas
  this.canvas = document.createElement('canvas')
  this.canvas.width = this.WIDTH
  this.canvas.height = this.HEIGHT
  this.ctx = this.canvas.getContext('2d')
  this.imageData = this.ctx.createImageData(this.WIDTH, this.HEIGHT)

  this.init()
}

CDGContext.prototype.WIDTH = 300
CDGContext.prototype.HEIGHT = 216
CDGContext.prototype.DISPLAY_WIDTH = 288
CDGContext.prototype.DISPLAY_HEIGHT = 192
CDGContext.prototype.DISPLAY_BOUNDS = [ 6, 12, 294, 204 ]
CDGContext.prototype.TILE_WIDTH = 6
CDGContext.prototype.TILE_HEIGHT = 12

CDGContext.prototype.init = function () {
  this.hOffset = 0
  this.vOffset = 0
  this.keyColor = null
  this.clut = new Array(16).fill([0, 0, 0]) // color lookup table
  this.pixels = new Array(this.WIDTH * this.HEIGHT).fill(0)
  this.buffer = new Array(this.WIDTH * this.HEIGHT).fill(0)
  this.lastScale = 0
}

CDGContext.prototype.setCLUTEntry = function (index, r, g, b) {
  this.clut[index] = [r, g, b].map(c => c * 17)
}

CDGContext.prototype.renderFrame = function () {
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

      // Set the rgba values in the image data
      this.imageData.data[offset] = r
      this.imageData.data[offset + 1] = g
      this.imageData.data[offset + 2] = b
      this.imageData.data[offset + 3] = colorIndex === this.keyColor ? 0x00 : 0xff
    }
  }

  this.ctx.putImageData(this.imageData, 0, 0)

  // copy to user canvas and scale
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

const CDG_NOOP = 0
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

const CDGInstruction = function () {}
CDGInstruction.prototype.dump = function () {
  return this.name
}

/************************************************
*
* NOOP
*
************************************************/
const CDGNoopInstruction = function () {}
CDGNoopInstruction.prototype = new CDGInstruction()
CDGNoopInstruction.prototype.instruction = CDG_NOOP
CDGNoopInstruction.prototype.name = 'Noop'
CDGNoopInstruction.prototype.execute = function (context) {}

/************************************************
*
* MEMORY_PRESET
*
************************************************/
const CDGMemoryPresetInstruction = function (bytes, offset) {
  if (arguments.length > 0) {
    this.init(bytes, offset)
  }
}
CDGMemoryPresetInstruction.prototype = new CDGInstruction()
CDGMemoryPresetInstruction.prototype.instruction = CDG_MEMORY_PRESET
CDGMemoryPresetInstruction.prototype.name = 'Memory Preset'
CDGMemoryPresetInstruction.prototype.init = function (bytes, offset) {
  const doff = offset + CDG_DATA
  this.color = bytes[doff] & 0x0F
  this.repeat = bytes[doff + 1] & 0x0F
}

CDGMemoryPresetInstruction.prototype.execute = function (context) {
  context.pixels.fill(this.color)
}

/************************************************
*
* BORDER_PRESET
*
************************************************/

const CDGBorderPresetInstruction = function (bytes, offset) {
  if (arguments.length > 0) {
    this.init(bytes, offset)
  }
}
CDGBorderPresetInstruction.prototype = new CDGInstruction()
CDGBorderPresetInstruction.prototype.instruction = CDG_BORDER_PRESET
CDGBorderPresetInstruction.prototype.name = 'Border Preset'
CDGBorderPresetInstruction.prototype.init = function (bytes, offset) {
  this.color = bytes[offset + CDG_DATA] & 0x0F
}
CDGBorderPresetInstruction.prototype.execute = function (context) {
  const b = context.DISPLAY_BOUNDS
  for (let x = 0; x < context.WIDTH; x++) {
    for (let y = 0; y < b[1]; y++) {
      context.pixels[x + y * context.WIDTH] = this.color
    }
    for (let y = b[3] + 1; y < context.HEIGHT; y++) {
      context.pixels[x + y * context.WIDTH] = this.color
    }
  }
  for (let y = b[1]; y <= b[3]; y++) {
    for (let x = 0; x < b[0]; x++) {
      context.pixels[x + y * context.WIDTH] = this.color
    }
    for (let x = b[2] + 1; x < context.WIDTH; x++) {
      context.pixels[x + y * context.WIDTH] = this.color
    }
  }
}

/************************************************
*
* TILE_BLOCK
*
************************************************/

const CDGTileBlockInstruction = function (bytes, offset) {
  if (arguments.length > 0) {
    this.init(bytes, offset)
  }
}
CDGTileBlockInstruction.prototype = new CDGInstruction()
CDGTileBlockInstruction.prototype.instruction = CDG_TILE_BLOCK
CDGTileBlockInstruction.prototype.name = 'Tile Block'
CDGTileBlockInstruction.prototype.init = function (bytes, offset) {
  const doff = offset + CDG_DATA
  // some players check bytes[doff+1] & 0x20 and ignores if it is set (?)
  this.colors = [bytes[doff] & 0x0F, bytes[doff + 1] & 0x0F]
  this.row = bytes[doff + 2] & 0x1F
  this.column = bytes[doff + 3] & 0x3F
  this.pixels = bytes.slice(doff + 4, doff + 16)
  this._offset = offset
}
CDGTileBlockInstruction.prototype.execute = function (context) {
  /* blit a tile */
  const x = this.column * context.TILE_WIDTH
  const y = this.row * context.TILE_HEIGHT

  if (x + 6 > context.WIDTH || y + 12 > context.HEIGHT) {
    console.log('TileBlock out of bounds (' + this.row + ',' + this.column + ')')
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
CDGTileBlockInstruction.prototype.op = function (context, offset, color) {
  context.pixels[offset] = color
}
CDGTileBlockInstruction.prototype.dump = function () {
  return this.name + '(' + this.row + ', ' + this.column + ') @' + this._offset
}

/************************************************
*
* TILE_BLOCK_XOR
*
************************************************/

const CDGTileBlockXORInstruction = function (bytes, offset) {
  if (arguments.length > 0) {
    this.init(bytes, offset)
  }
}
CDGTileBlockXORInstruction.prototype = new CDGTileBlockInstruction()
CDGTileBlockXORInstruction.prototype.instruction = CDG_TILE_BLOCK_XOR
CDGTileBlockXORInstruction.prototype.name = 'Tile Block (XOR)'
CDGTileBlockXORInstruction.prototype.op = function (context, offset, color) {
  context.pixels[offset] = context.pixels[offset] ^ color
}

/************************************************
*
* SCROLL_PRESET
*
************************************************/

const CDGScrollPresetInstruction = function (bytes, offset) {
  if (arguments.length > 0) {
    this.init(bytes, offset)
  }
}
CDGScrollPresetInstruction.prototype = new CDGInstruction()
CDGScrollPresetInstruction.prototype.instruction = CDG_SCROLL_PRESET
CDGScrollPresetInstruction.prototype.name = 'Scroll Preset'
CDGScrollPresetInstruction.prototype.init = function (bytes, offset) {
  const doff = offset + CDG_DATA
  this.color = bytes[doff] & 0x0F

  const hScroll = bytes[doff + 1] & 0x3F
  this.hCmd = (hScroll & 0x30) >> 4
  this.hOffset = (hScroll & 0x07)

  const vScroll = bytes[doff + 2] & 0x3F
  this.vCmd = (vScroll & 0x30) >> 4
  this.vOffset = (vScroll & 0x07)
}
CDGScrollPresetInstruction.prototype.execute = function (context) {
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
CDGScrollPresetInstruction.prototype.getPixel = function (context, offx, offy) {
  if (offx > 0 && offx < context.WIDTH && offy > 0 && offy < context.HEIGHT) {
    return context.pixels[offx + offy * context.WIDTH]
  } else {
    return this.color
  }
}

/************************************************
*
* SCROLL_COPY
*
************************************************/

const CDGScrollCopyInstruction = function (bytes, offset) {
  if (arguments.length > 0) {
    this.init(bytes, offset)
  }
}
CDGScrollCopyInstruction.prototype = new CDGScrollPresetInstruction()
CDGScrollCopyInstruction.prototype.instruction = CDG_SCROLL_COPY
CDGScrollCopyInstruction.prototype.name = 'Scroll Copy'
CDGScrollPresetInstruction.prototype.getPixel = function (context, offx, offy) {
  offx = (offx + context.WIDTH) % context.WIDTH
  offy = (offy + context.HEIGHT) % context.HEIGHT
  return context.pixels[offx + offy * context.WIDTH]
}

/************************************************
*
* SET_KEY_COLOR
*
************************************************/

const CDGSetKeyColorInstruction = function (bytes, offset) {
  if (arguments.length > 0) {
    this.init(bytes, offset)
  }
}
CDGSetKeyColorInstruction.prototype = new CDGInstruction()
CDGSetKeyColorInstruction.prototype.instruction = CDG_SET_KEY_COLOR
CDGSetKeyColorInstruction.prototype.name = 'Set Key Color'
CDGSetKeyColorInstruction.prototype.init = function (bytes, offset) {
  this.colorIndex = bytes[offset + CDG_DATA] & 0x0F
}
CDGSetKeyColorInstruction.prototype.execute = function (context) {
  context.keyColor = context.clut[this.colorIndex]
}

/************************************************
*
* LOAD_CLUT_LOW
*
************************************************/

const CDGLoadCLUTLowInstruction = function (bytes, offset) {
  if (arguments.length > 0) {
    this.init(bytes, offset)
  }
}
CDGLoadCLUTLowInstruction.prototype = new CDGInstruction()
CDGLoadCLUTLowInstruction.prototype.instruction = CDG_LOAD_CLUT_LOW
CDGLoadCLUTLowInstruction.prototype.name = 'Load CLUT (Low)'
CDGLoadCLUTLowInstruction.prototype.CLUT_OFFSET = 0
CDGLoadCLUTLowInstruction.prototype.init = function (bytes, offset) {
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
CDGLoadCLUTLowInstruction.prototype.execute = function (context) {
  for (let i = 0; i < 8; i++) {
    context.setCLUTEntry(i + this.CLUT_OFFSET,
      this.colors[i][0],
      this.colors[i][1],
      this.colors[i][2])
  }
}

/************************************************
*
* LOAD_CLUT_HI
*
************************************************/

const CDGLoadCLUTHighInstruction = function (bytes, offset) {
  if (arguments.length > 0) {
    this.init(bytes, offset)
  }
}
CDGLoadCLUTHighInstruction.prototype = new CDGLoadCLUTLowInstruction()
CDGLoadCLUTHighInstruction.prototype.instruction = CDG_LOAD_CLUT_HI
CDGLoadCLUTHighInstruction.prototype.name = 'Load CLUT (High)'
CDGLoadCLUTHighInstruction.prototype.CLUT_OFFSET = 8

/************************************************
*
* CDGParser
*
************************************************/

const CDGParser = function () {}
CDGParser.prototype.COMMAND_MASK = 0x3F
CDGParser.prototype.CDG_COMMAND = 0x9
CDGParser.prototype.PACKET_SIZE = 24

CDGParser.prototype.BY_TYPE = {}
CDGParser.prototype.BY_TYPE[CDG_MEMORY_PRESET] = CDGMemoryPresetInstruction
CDGParser.prototype.BY_TYPE[CDG_BORDER_PRESET] = CDGBorderPresetInstruction
CDGParser.prototype.BY_TYPE[CDG_TILE_BLOCK] = CDGTileBlockInstruction
CDGParser.prototype.BY_TYPE[CDG_SCROLL_PRESET] = CDGScrollPresetInstruction
CDGParser.prototype.BY_TYPE[CDG_SCROLL_COPY] = CDGScrollCopyInstruction
CDGParser.prototype.BY_TYPE[CDG_SET_KEY_COLOR] = CDGSetKeyColorInstruction
CDGParser.prototype.BY_TYPE[CDG_LOAD_CLUT_LOW] = CDGLoadCLUTLowInstruction
CDGParser.prototype.BY_TYPE[CDG_LOAD_CLUT_HI] = CDGLoadCLUTHighInstruction
CDGParser.prototype.BY_TYPE[CDG_TILE_BLOCK_XOR] = CDGTileBlockXORInstruction

CDGParser.prototype.parseOne = function (bytes, offset) {
  const command = bytes[offset] & this.COMMAND_MASK
  /* if this packet is a cdg command */

  if (command === this.CDG_COMMAND) {
    const opcode = bytes[offset + 1] & this.COMMAND_MASK
    const InstructionType = this.BY_TYPE[opcode]
    if (typeof (InstructionType) !== 'undefined') {
      return new InstructionType(bytes, offset)
    } else {
      console.log('Unknown CDG instruction (instruction = ' + opcode + ')')
      return new CDGNoopInstruction()
    }
  }
  return new CDGNoopInstruction()
}

CDGParser.prototype.parseData = function (bytes) {
  const instructions = []

  for (let offset = 0; offset < bytes.length; offset += this.PACKET_SIZE) {
    const instruction = this.parseOne(bytes, offset)
    if (instruction != null) {
      instructions.push(instruction)
    }
  }

  return instructions
}

/************************************************
*
* CDGPlayer
*
************************************************/

const CDGPlayer = function (canvas) {
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error('Must be instantiated with a canvas element')
  }

  this.canvas = canvas
  this.init()
}

CDGPlayer.prototype.init = function () {
  this.instructions = []
  this.pc = -1 // packet counter
  this.frameId = null
  this.pos = 0 // current position in ms
  this.lastSyncPos = null // ms
  this.lastTimestamp = null // DOMHighResTimeStamp
}

CDGPlayer.prototype.load = function (data) {
  this.stop()
  this.init()

  const parser = new CDGParser()
  this.instructions = parser.parseData(data)
  this.context = new CDGContext(this.canvas)
  this.pc = 0
}

CDGPlayer.prototype.render = function () {
  this.context.renderFrame()
}

CDGPlayer.prototype.step = function () {
  if (this.pc >= 0 && this.pc < this.instructions.length) {
    this.instructions[this.pc].execute(this.context)
    this.pc += 1
  } else {
    this.stop()
    this.pc = -1
    console.log('No more instructions.')
  }
}

CDGPlayer.prototype.fastForward = function (count) {
  const max = this.pc + count
  while (this.pc >= 0 && this.pc < max) {
    this.step()
  }
}

CDGPlayer.prototype.play = function () {
  if (!this.frameId && this.instructions.length) {
    this.frameId = requestAnimationFrame(this.update.bind(this))
    this.lastTimestamp = performance.now()
  }
}

CDGPlayer.prototype.stop = function () {
  cancelAnimationFrame(this.frameId)
  this.frameId = null
}

CDGPlayer.prototype.sync = function (ms) {
  this.lastSyncPos = ms
  this.lastTimestamp = performance.now()
}

CDGPlayer.prototype.update = function (timestamp) {
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
  if (ffAmt > 0) {
    this.fastForward(ffAmt)
    this.render()
  }
}

module.exports = CDGPlayer
