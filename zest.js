// standard B/W
let COLOR_WHITE = [0xff, 0xff, 0xff, 0xff]
let COLOR_BLACK = [0x00, 0x00, 0x00, 0xff]

// device appearance
COLOR_WHITE = [0xba, 0xae, 0xa9, 0xff]
COLOR_BLACK = [0x31, 0x2f, 0x28, 0xff]

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
    tile.frames = tile.frames.map((id) => frameData[id]?.data)
  })
}

// 'inline' tiles into rooms for easier access
const resolveTiles = (rooms, tileData) => {
  rooms.forEach((room) => {
    room.tiles = room.tiles.map((id) => tileData[id])
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

const repairAndCleanup = (data) => {
  data.tiles = data.tiles.filter(Boolean) // remove garbage?
  data.rooms = data.rooms.filter(Boolean) // remove garbage?
}

// library namespace
class Zest {
  static run(data, canvas) {
    const game = new Zest(canvas)
    game.load(data)
    game.play()
    // game.attract()
    return game
  }

  constructor(canvas) {
    this.canvas = canvas
    this.isRunning = false
  }

  load(data) {
    if (this.isRunning) {
      this.stop()
    }

    repairAndCleanup(data)
    console.log(data)

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
    this.room = this.wrap ?? this.card ?? this.start
    this.render()
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
      this.render()
      this.frameIx++
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

  getTileAt(x, y) {
    const ix = coordToIndex(x, y)
    return this.room.tiles[ix]
  }

  say(message) {
    console.log(`[SAY] ${message}`)
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
    let tx = this.player.x + dx
    let ty = this.player.y + dy

    // @TODO also emit bump on room boundary?
    if (tx < 0) {
      tx = 0
    }
    if (tx >= ROOM_WIDTH) {
      tx = ROOM_WIDTH - 1
    }
    if (ty < 0) {
      ty = 0
    }
    if (ty >= ROOM_HEIGHT) {
      ty = ROOM_HEIGHT - 1
    }

    const target = this.getTileAt(tx, ty)
    if (target.solid) {
      // @TODO emit bump
      if (target.type == 2) {
        // sprite type
        // @TODO check autoact first?
        if (typeof target.sound !== 'undefined') {
          this.playSound(target.sound)
        }
        if (target.says) {
          this.say(target.says)
        }
      }
      return
    }

    if (target.type == 3) {
      // item type
      // @TODO emit collect
      const keyName = `${target.name}s`
      const counter = this.globals[keyName] ?? 0
      this.globals[keyName] = counter + 1
      this.room.tiles[coordToIndex(tx, ty)] = this.backgroundTile
      if (typeof target.sound !== 'undefined') {
        this.playSound(target.sound)
      }
      if (target.says) {
        this.say(target.says)
      }
      console.log(`Collected ${counter + 1} ${keyName}`)
    }

    // @TODO emit update
    const prevX = this.player.x
    const prevY = this.player.y
    this.player.x = tx
    this.player.y = ty

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
          console.log(`[FIN] ${exit.fin}`)
          // @TODO actually end the game
          this.room = this.card
        } else {
          this.gotoRoom(exit.room, exit.tx, exit.ty)
        }
      }
    })
  }

  pressUp() {
    this.movePlayer(0, -1)
  }

  pressDown() {
    this.movePlayer(0, 1)
  }

  pressLeft() {
    this.movePlayer(-1, 0)
  }

  pressRight() {
    this.movePlayer(1, 0)
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
    // get the canvas context for our display
    const ctx = this.canvas.getContext('2d')
    const cardImgData = roomToStill(this.room, this.frameIx)

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

        const arr = cardImgData[ti]
        const col = arr[pi]

        let [r, g, b, a] = COLOR_WHITE
        if (col == 1) [r, g, b, a] = COLOR_BLACK

        let ix = x + y * 200
        pixels[ix * 4] = r
        pixels[ix * 4 + 1] = g
        pixels[ix * 4 + 2] = b
        pixels[ix * 4 + 3] = a
      }
    }

    if (this.room == this.cart.rooms[this.player.room]) {
      const px = this.player.x * 8
      const py = this.player.y * 8
      const pf = getCurrentFrameForTile(this.player.tile, this.frameIx)

      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const col = pf[x + y * 8]

          if (col == 2) continue // transparent
          let [r, g, b, a] = COLOR_WHITE
          if (col == 1) [r, g, b, a] = COLOR_BLACK

          let ix = px + x + (py + y) * 200
          pixels[ix * 4] = r
          pixels[ix * 4 + 1] = g
          pixels[ix * 4 + 2] = b
          pixels[ix * 4 + 3] = a
        }
      }
    }

    ctx.putImageData(imgData, 0, 0)
  }
}
