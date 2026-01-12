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

// the current tick (and how many ticks are needed for a full loop)
let globalLoopPeriod = -1
let frameIx = 0

// get the current snapshot (25x12 frames) of a room, tile fps aware
const roomToStill = (room) =>
  room.tiles.map(
    (tile) =>
      tile.frames[Math.floor((tile.fps / 20) * frameIx) % tile.frames.length]
  )

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
Zest = {}

// entrypoint
Zest.run = function (data) {
  console.log(data)
  repairAndCleanup(data)

  const meta = getMetaInfo(data)
  document.getElementById('label-title').innerText = meta.name
  document.getElementById('label-author').innerText = meta.author

  console.log(
    `${meta.name} by ${meta.author}\n${meta.intro}\n(version ${meta.version}, build ${meta.build})`
  )

  // make rooms reference frames directly for convenience
  resolveFrames(data.tiles, data.frames)
  resolveTiles(data.rooms, data.tiles)

  // calculate the animation period (how many ticks it takes for ALL tiles to be back at frame 0)
  data.tiles.forEach((tile) => {
    const isAnimated = tile.frames.length > 0 && tile.fps > 0
    const loopPeriod = isAnimated ? (tile.frames.length * 20) / tile.fps : 1
    globalLoopPeriod = Math.max(globalLoopPeriod, loopPeriod)
  })

  // create a lookup table foor room and tile names
  const namedRooms = byName(data.rooms)
  const namedTiles = byName(data.tiles)

  // lookup the rooms for the Wrapper, Card and player starting location
  const wrapRoom = data.rooms[data.wrap]
  const cardRoom = data.rooms[data.card]
  const initRoom = data.rooms[data.player.room]

  // current room to render, for demo purposes
  let currentRoom = wrapRoom ?? cardRoom ?? initRoom

  // find the canvas context for our display
  const canvas = document.getElementById('lcd')
  const ctx = canvas.getContext('2d')

  // advance 1 tick and render the canvas
  const renderNextFrame = () => {
    const cardImgData = roomToStill(currentRoom)
    frameIx = (frameIx + 1) % globalLoopPeriod
    // console.log(`${frameIx} / ${globalLoopPeriod}`)

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

  // loop at 20 FPS (50ms per tick)
  setInterval(renderNextFrame, 50)

  // demo reel, loop through the available rooms
  setTimeout(() => {
    currentRoom = cardRoom
    setTimeout(() => {
      currentRoom = initRoom

      let cr = data.player.room
      setInterval(() => {
        cr = (cr + 1) % data.rooms.length
        currentRoom = data.rooms[cr]
        // console.log(currentRoom)
      }, 5000)
    }, 2400)
  }, 800)
}
