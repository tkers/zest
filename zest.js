// standard B/W
let COLOR_WHITE = [0xff, 0xff, 0xff, 0xff]
let COLOR_BLACK = [0x00, 0x00, 0x00, 0xff]

// device appearance
COLOR_WHITE = [0xba, 0xae, 0xa9, 0xff]
COLOR_BLACK = [0x31, 0x2f, 0x28, 0xff]

const noop = () => {}

function wrapText(str, maxWidth, maxLines) {
  const lines = []
  let from = 0

  while (from < str.length) {
    let breakAt = from + maxWidth

    if (breakAt >= str.length) {
      lines.push(str.slice(from))
      break
    }

    const nl = str.indexOf('\n', from)
    if (nl > from && nl < breakAt) {
      lines.push(str.slice(from, nl))
      from = nl + 1
    } else {
      const bl = str.lastIndexOf(' ', breakAt)
      if (bl > from) {
        lines.push(str.slice(from, bl))
        from = bl + 1
      } else {
        lines.push(str.slice(from, breakAt))
        from = breakAt
      }
    }
  }

  if (maxLines) {
    const result = []
    for (let l = 0; l < lines.length; l += maxLines) {
      result.push(lines.slice(l, l + maxLines).join('\n'))
    }
    return result
  } else {
    return lines.join('\n')
  }
}

// transform [{ name: n, ... }] -> { n: { ... } }
const byName = (arr) => Object.fromEntries(arr.map((x) => [x.name, x]))

const ROOM_WIDTH = 25
const ROOM_HEIGHT = 15
const coordToIndex = (x, y) => x + y * ROOM_WIDTH
const indexToCoord = (ix) => {
  const y = Math.floor(ix / ROOM_WIDTH)
  const x = ix - y * ROOM_WIDTH
  return [x, y]
}

const EdgeDirection = { TOP: 0, RIGHT: 1, DOWN: 2, LEFT: 3 }

// 'inline' frames into tiles for easier access
const resolveFrames = (tiles, frameData) => {
  tiles.forEach((tile) => {
    tile.frames = tile.frames?.map((id) => frameData[id]?.data)
  })
}

// 'inline' tiles into rooms for easier access
const resolveTiles = (rooms, tileData) => {
  rooms.forEach((room) => {
    room.tiles = room.tiles?.map((id) => tileData[id])
  })
}

// get the current frame of a tile, fps aware
const getCurrentFrameForTile = (tile, frameIx) =>
  tile.frames[Math.floor((tile.fps / 20) * frameIx) % tile.frames.length]

// get the current snapshot of a room, as an array of frames
const roomToStill = (room, frameIx) =>
  room.tiles.map((tile) => getCurrentFrameForTile(tile, frameIx))

// extract key meta information from the game data
const getMetaInfo = (data) => ({
  name: data.name,
  author: data.author,
  version: data.versionString,
  build: data.buildNumber,
  intro: data.intro,
})

// const repairAndCleanup = (data) => {
//   data.tiles = data.tiles.filter(Boolean) // remove gaps
//   data.rooms = data.rooms.filter(Boolean) // remove gaps
// }

// library namespace
class Zest {
  static run(data, canvas) {
    const game = new Zest(canvas)
    game.loadCart(data)
    game.play()
    // game.attract()
    return game
  }

  static load(data, canvas) {
    const game = new Zest(canvas)
    game.load(data)
    return game
  }

  constructor(canvas) {
    this.canvas = canvas
    this.ctx2d = canvas.getContext('2d')
    this.isRunning = false
    this.isPaused = false
  }

  restart() {
    this.loadCart(JSON.parse(this.originalCart))
    this.play()
  }

  load(data, wrapped) {
    this.loadCart(data)
    if (wrapped) this.room = this.wrap ?? this.card ?? this.start
    this.render()
  }

  loadCart(data) {
    if (this.isRunning) {
      this.stop()
    }

    // repairAndCleanup(data)
    console.log(data)

    this.originalCart = JSON.stringify(data)
    this.cart = data
    this.meta = getMetaInfo(data)
    this.frameIx = 0

    console.log(`Loaded "${this.meta.name}" by ${this.meta.author}`)

    // make rooms reference frames directly for convenience
    resolveFrames(data.tiles, data.frames)
    resolveTiles(data.rooms, data.tiles)
    data.player.tile = data.tiles[data.player.id]

    // create a lookup table for room and tile names
    this.namedRooms = byName(data.rooms)
    this.namedTiles = byName(data.tiles)
    this.backgroundTile =
      this.namedTiles[data.background == 1 ? 'black' : 'white']

    // some sort of context?
    this.globals = {}

    // lookup the rooms for the Wrapper, Card and player starting location
    this.wrap = data.wrap !== -1 ? data.rooms[data.wrap] : null
    this.card = data.card !== -1 ? data.rooms[data.card] : null
    this.icon = data.card !== -1 ? data.rooms[data.icon] : null
    this.start = data.rooms[data.player.room]

    // current room to render
    this.player = data.player
    this.room = this.card ?? this.start
  }

  play() {
    if (this.isRunning) {
      console.log('[WARN] Already running')
      return
    }
    this.isRunning = true

    this.room = this.start

    // loop at 20 FPS (50ms per tick)
    this.loopTimer = setInterval(() => {
      if (this.isPaused) return
      this.render()
      if (!this.dialogActive) this.frameIx++
    }, 50)
  }

  stop() {
    if (!this.isRunning) {
      console.log('[WARN] Already stopped')
      return
    }
    this.isRunning = false
    clearInterval(this.loopTimer)
    this.loopTimer = null
  }

  pauseResume() {
    this.isPaused = !this.isPaused
    return this.isPaused
  }

  getTileAt(x, y) {
    const ix = coordToIndex(x, y)
    return this.room.tiles[ix]
  }

  psEval(src) {
    // string or num literal
    if (!Array.isArray(src)) return src

    // expression
    const [head, ...rest] = src
    if (head === 'format') {
      return rest.reduce((str, part) => `${str}${this.psEval(part)}`, '')
    } else if (head === 'get') {
      return this.globals[rest[0]] ?? 0
    } else if (head === 'lpad') {
      return this.psEval(rest[0]).toString().padStart(rest[1], rest[2])
    } else if (head === 'rpad') {
      return this.psEval(rest[0]).toString().padEnd(rest[1], rest[2])
    }

    return '[ParseError]'
  }

  say(message, cb) {
    if (Array.isArray(message)) message = this.psEval(message)
    this.dialogActive = true
    this.dialogPages = wrapText(message, 17, 4)
    this.dialogText = this.dialogPages.shift()
    this.dialogCb = cb ?? noop
  }

  advanceSay() {
    if (!this.dialogActive) return false
    if (this.dialogPages.length > 0) {
      this.dialogText = this.dialogPages.shift()
    } else {
      this.dialogActive = false
      this.dialogCb()
    }
    return true
  }

  playSound(ix) {
    const snd = this.cart.sounds[ix]
    console.log(`[PLAY] ${snd.name}`)
  }

  gotoRoom(roomIx, px, py) {
    this.room = this.cart.rooms[roomIx]
    this.player.room = roomIx
    this.player.x = px
    this.player.y = py
  }

  movePlayer(dx, dy) {
    if (this.advanceSay()) {
      return
    }

    let tx = this.player.x + dx
    let ty = this.player.y + dy
    let canMove = true

    if (tx < 0) {
      tx = 0
      canMove = false
    }
    if (tx >= ROOM_WIDTH) {
      tx = ROOM_WIDTH - 1
      canMove = false
    }
    if (ty < 0) {
      ty = 0
      canMove = false
    }
    if (ty >= ROOM_HEIGHT) {
      ty = ROOM_HEIGHT - 1
      canMove = false
    }

    const target = this.getTileAt(tx, ty)
    if (target.solid) {
      canMove = false
    }

    // sprite type
    if (target.type == 2) {
      // @TODO check config.autoAct first
      if (typeof target.sound !== 'undefined') {
        this.playSound(target.sound)
      }
      if (target.says) {
        this.say(target.says)
      }
    } else if (target.type == 3) {
      // item type, run the default collect handler
      const keyName = `${target.name}s`
      const counter = this.globals[keyName] ?? 0
      this.globals[keyName] = counter + 1
      this.room.tiles[coordToIndex(tx, ty)] = this.backgroundTile
      // @TODO emit collect event
      if (typeof target.sound !== 'undefined') {
        this.playSound(target.sound)
      }
      if (target.says) {
        this.say(target.says)
      }
      // console.log(`Collected ${counter + 1} ${keyName}`)
    }

    // @TODO emit update
    const prevX = this.player.x
    const prevY = this.player.y
    if (canMove) {
      // @TODO emit update event
      this.player.x = tx
      this.player.y = ty
    } else {
      // @TODO emit bump event
    }

    // check for exits
    this.room.exits.forEach((exit) => {
      if (typeof exit.edge !== 'undefined') {
        if (exit.edge == EdgeDirection.TOP) {
          if (prevY == exit.y && dy < 0) {
            this.gotoRoom(exit.room, prevX, exit.ty)
          }
        } else if (exit.edge == EdgeDirection.RIGHT) {
          if (prevX == exit.x && dx > 0) {
            this.gotoRoom(exit.room, exit.tx, prevY)
          }
        } else if (exit.edge == EdgeDirection.DOWN) {
          if (prevY == exit.y && dy > 0) {
            this.gotoRoom(exit.room, prevX, exit.ty)
          }
        } else if (exit.edge == EdgeDirection.LEFT) {
          if (prevX == exit.x && dx < 0) {
            this.gotoRoom(exit.room, exit.tx, prevY)
          }
        }
      } else if (tx == exit.x && ty == exit.y) {
        if (exit.fin) {
          // @TODO use exit.song to play/stop music
          this.room = {
            tiles: Array(15 * 25).fill(this.namedTiles.black),
          }
          this.say(exit.fin, () => {
            this.restart()
          })
        } else {
          this.gotoRoom(exit.room, exit.tx, exit.ty)
        }
      }
    })
  }

  pressUp() {
    if (!this.isRunning || this.isPaused) return
    this.movePlayer(0, -1)
  }

  pressDown() {
    if (!this.isRunning || this.isPaused) return
    this.movePlayer(0, 1)
  }

  pressLeft() {
    if (!this.isRunning || this.isPaused) return
    this.movePlayer(-1, 0)
  }

  pressRight() {
    if (!this.isRunning || this.isPaused) return
    this.movePlayer(1, 0)
  }

  pressA() {
    if (this.advanceSay()) {
      return
    }
  }

  pressB() {
    if (this.advanceSay()) {
      return
    }
  }

  attract() {
    // demo reel, loop through the available rooms
    this.room = this.wrap ?? this.card
    setTimeout(() => {
      this.room = this.card
      setTimeout(() => {
        this.room = this.start

        let cr = this.cart.player.room
        setInterval(() => {
          cr = (cr + 1) % this.cart.rooms.length
          this.room = this.cart.rooms[cr]
          // console.log(currentRoom)
        }, 5000)
      }, 2400)
    }, 800)
  }

  render() {
    // get all room frames
    const tilemap = roomToStill(this.room, this.frameIx)

    // display player
    if (this.room == this.cart.rooms[this.player.room]) {
      const playerFrame = getCurrentFrameForTile(this.player.tile, this.frameIx)
      const ti = coordToIndex(this.player.x, this.player.y)
      // add background tile to transparent areas
      tilemap[ti] = playerFrame.map((fg, pi) =>
        fg == 2 ? tilemap[ti][pi] : fg
      )
    }

    // draw window
    if (this.dialogActive) {
      tilemap[coordToIndex(3, 3)] = this.cart.font.pipe[0] // top left
      for (let x = 4; x < 21; x++) {
        tilemap[coordToIndex(x, 3)] = this.cart.font.pipe[1]
        tilemap[coordToIndex(x, 8)] = this.cart.font.pipe[7]
      }
      tilemap[coordToIndex(21, 3)] = this.cart.font.pipe[2] // top right

      for (let y = 4; y < 8; y++) {
        tilemap[coordToIndex(3, y)] = this.cart.font.pipe[3]
        tilemap[coordToIndex(21, y)] = this.cart.font.pipe[5]
      }

      tilemap[coordToIndex(3, 8)] = this.cart.font.pipe[6] // arrow
      tilemap[coordToIndex(20, 8)] = this.cart.font.pipe[9] // arrow
      tilemap[coordToIndex(21, 8)] = this.cart.font.pipe[8] // bottom right

      for (let y = 4; y < 8; y++) {
        for (let x = 4; x < 21; x++) {
          tilemap[coordToIndex(x, y)] = this.cart.font.pipe[4]
        }
      }

      let xx = 4
      let yy = 4
      let text = this.dialogText

      for (let i = 0; i < text.length; i++) {
        let glyph = text.charCodeAt(i)
        if (xx > 20 || glyph == 10) {
          xx = 4
          yy++
        }
        if (glyph == 10) continue
        tilemap[coordToIndex(xx, yy)] = this.cart.font.chars[glyph - 32]
        xx++
      }
    }

    this.drawToCanvas(tilemap)
  }

  drawToCanvas(tilemap) {
    const imgData = new ImageData(200, 120)
    const pixels = imgData.data

    for (let y = 0; y < 120; y++) {
      const ty = Math.floor(y / 8)
      const py = y % 8
      for (let x = 0; x < 200; x++) {
        const tx = Math.floor(x / 8)
        const px = x % 8

        const ti = tx + 25 * ty
        const pi = px + 8 * py

        const arr = tilemap[ti]
        const col = arr[pi]

        const [r, g, b, a] = col == 1 ? COLOR_BLACK : COLOR_WHITE

        let ix = x + y * 200
        pixels[ix * 4] = r
        pixels[ix * 4 + 1] = g
        pixels[ix * 4 + 2] = b
        pixels[ix * 4 + 3] = a
      }
    }
    this.ctx2d.putImageData(imgData, 0, 0)
  }
}
