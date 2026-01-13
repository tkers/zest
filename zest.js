// standard B/W
let COLOR_WHITE = [0xff, 0xff, 0xff, 0xff]
let COLOR_BLACK = [0x00, 0x00, 0x00, 0xff]

// device appearance
COLOR_WHITE = [0xba, 0xae, 0xa9, 0xff]
COLOR_BLACK = [0x31, 0x2f, 0x28, 0xff]

// transform [{ name: n, ... }] -> { n: { ... } }
const byName = (arr) => Object.fromEntries(arr.map((x) => [x.name, x]))

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
}

// library namespace
class Zest {
  static run(data, canvas) {
    const game = new Zest(data, canvas)
    game.play()
    game.attract()
    return game
  }

  static load(data, canvas) {
    return new Zest(data, canvas)
  }

  constructor(data, canvas) {
    repairAndCleanup(data)
    console.log(data)

    this.cart = data
    this.canvas = canvas
    this.meta = getMetaInfo(data)
    this.frameIx = 0

    console.log(`Loaded "${this.meta.name}" by ${this.meta.author}`)

    // make rooms reference frames directly for convenience
    resolveFrames(data.tiles, data.frames)
    resolveTiles(data.rooms, data.tiles)

    // create a lookup table foor room and tile names
    this.namedRooms = byName(data.rooms)
    this.namedTiles = byName(data.tiles)

    // lookup the rooms for the Wrapper, Card and player starting location
    this.wrap = data.wrap !== -1 ? data.rooms[data.wrap] : null
    this.card = data.card !== -1 ? data.rooms[data.card] : null
    this.icon = data.card !== -1 ? data.rooms[data.icon] : null
    this.start = data.rooms[data.player.room]

    // current room to render
    this.room = this.wrap ?? this.card ?? this.start
    this.render()
  }

  play() {
    this.room = this.start

    // loop at 20 FPS (50ms per tick)
    setInterval(() => {
      this.render()
      this.frameIx++
    }, 50)
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

    ctx.putImageData(imgData, 0, 0)
  }
}
