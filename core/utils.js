'use strict'
;(function () {
  const deepCopy = (x) => JSON.parse(JSON.stringify(x))
  const isDefined = (x) => typeof x !== 'undefined' && x !== null

  Zest.minify = function (original) {
    const gameData = deepCopy(original)
    delete gameData.editor
    gameData.scripts.forEach((script) => {
      delete script?.data?.__comments
      delete script?.data?.__srcOrder
    })
    return gameData
  }

  const SCALE_FACTOR = 2
  const imgDataToURL = (img) => {
    const canvas = document.createElement('canvas')
    canvas.width = img.width * SCALE_FACTOR
    canvas.height = img.height * SCALE_FACTOR

    const ctx = canvas.getContext('2d')
    ctx.putImageData(img, 0, 0)

    ctx.imageSmoothingEnabled = false
    ctx.drawImage(
      canvas,
      0,
      0,
      img.width,
      img.height,
      0,
      0,
      canvas.width,
      canvas.height
    )

    return canvas.toDataURL('image/png')
  }

  Zest.prototype.getCardURL = function () {
    return imgDataToURL(this.getCardImageData())
  }

  Zest.prototype.getWrapURL = function () {
    return imgDataToURL(this.getWrapImageData())
  }

  Zest.prototype.getIconURL = function () {
    return imgDataToURL(this.getIconImageData())
  }

  const PIXEL_WIDTH = 200
  const PIXEL_HEIGHT = 120
  const EdgeDirection = { UP: 0, RIGHT: 1, DOWN: 2, LEFT: 3 }

  const getBounds = (coords) =>
    coords.reduce(
      ([left, top, right, bottom], [x, y]) => [
        Math.min(left, x),
        Math.min(top, y),
        Math.max(right, x),
        Math.max(bottom, y),
      ],
      [Infinity, Infinity, -Infinity, -Infinity]
    )

  Zest.prototype.getWorldLayout = function (startRoom) {
    const grid = new Map()
    const toVisit = []

    grid.set(startRoom.id, [0, 0])
    toVisit.push(startRoom)

    while (toVisit.length > 0) {
      const room = toVisit.shift()

      const [x, y] = grid.get(room.id)
      const edges = room.exits
        .filter((exit) => isDefined(exit.edge))
        .filter((exit) => !grid.has(exit.room))
        .forEach((exit) => {
          let tx = x
          let ty = y
          if (exit.edge === EdgeDirection.RIGHT) tx++
          if (exit.edge === EdgeDirection.LEFT) tx--
          if (exit.edge === EdgeDirection.DOWN) ty++
          if (exit.edge === EdgeDirection.UP) ty--

          grid.set(exit.room, [tx, ty])
          toVisit.push(this.getRoom(exit.room))
        })
    }

    const [left, top, right, bottom] = getBounds(grid.values())
    const layout = grid.entries().map(([id, [x, y]]) => ({
      room: this.getRoom(id),
      x: x - left,
      y: y - top,
    }))
    const width = right - left + 1
    const height = bottom - top + 1

    return { layout, width, height }
  }

  Zest.prototype.getWorldCanvas = function (room) {
    const start = room ? this.getRoom(room) : this.start
    const { layout, width, height } = this.getWorldLayout(start)

    const canvas = document.createElement('canvas')
    canvas.width = width * PIXEL_WIDTH
    canvas.height = height * PIXEL_HEIGHT

    const ctx = canvas.getContext('2d')

    layout.forEach(({ room, x, y }) => {
      const img = this.getRoomImageData(room)
      ctx.putImageData(img, x * PIXEL_WIDTH, y * PIXEL_HEIGHT)
    })

    return canvas
  }
})()
