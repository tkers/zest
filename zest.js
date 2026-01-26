const FPS = 20
const CELL_SIZE = 8
const ROOM_WIDTH = 25
const ROOM_HEIGHT = 15
const PIXEL_WIDTH = 200
const PIXEL_HEIGHT = 120
const FRAME_DURATION = 1 / FPS

// standard B/W
let COLOR_WHITE = [0xff, 0xff, 0xff, 0xff]
let COLOR_BLACK = [0x00, 0x00, 0x00, 0xff]

// device appearance
COLOR_WHITE = [0xba, 0xae, 0xa9, 0xff]
COLOR_BLACK = [0x31, 0x2f, 0x28, 0xff]

const EdgeDirection = { UP: 0, RIGHT: 1, DOWN: 2, LEFT: 3 }
const Button = { UP: 1, RIGHT: 2, DOWN: 3, LEFT: 4, A: 5, B: 6 }

const TileTypes = { 0: 'world', 1: 'player', 2: 'sprite', 3: 'item' }

function warn(message) {
  console.warn(`[WARN] ${message}`)
}
function fail(message) {
  console.error(`[FAIL] ${message}`)
}

let alreadyWarnedForUnknownExpressionType = {}

const Y2K = 946684800
const getDateTimePart = (part) => {
  const now = new Date()
  if (part === 'year') return now.getFullYear()
  else if (part === 'year99') return now.getFullYear() % 100
  else if (part === 'month') return now.getMonth() + 1
  else if (part === 'day') return now.getDate()
  else if (part === 'weekday') return (now.getDay() + 6) % 7
  else if (part === 'hour') return now.getHours()
  else if (part === 'hour12') return now.getHours() % 12
  else if (part === 'minute') return now.getMinutes()
  else if (part === 'second') return now.getSeconds()
  else if (part === 'ampm') return now.getHours() < 12 ? 'am' : 'pm'
  else if (part === 'timestamp') return Math.floor(now.getTime() / 1000) - Y2K
}

class ButtonState {
  constructor() {
    this.isPressed = false
    this.heldTime = 0
    this.justPressed = false
    this.isRepeating = false
  }
  press() {
    if (this.isPressed) return
    this.isPressed = true
    this.justPressed = true
    this.isRepeating = false
  }
  release() {
    if (!this.isPressed) return
    this.isPressed = false
    this.heldTime = 0
  }
  check(repeat, repeatDelay, repeatBetween) {
    // allows press-release within single frame
    if (this.justPressed) {
      this.justPressed = false
      return true
    }

    // otherwise it has to be a repeat
    if (this.isPressed && repeat) {
      this.heldTime += FRAME_DURATION
      const wait = this.isRepeating ? repeatBetween : repeatDelay
      if (this.heldTime >= wait) {
        this.isRepeating = true
        this.heldTime -= wait
        return true
      }
    }

    return false
  }
}

const noop = () => {}
const isDefined = (x) => typeof x !== 'undefined'
const isXY = (obj) => obj && Number.isFinite(obj.x) && Number.isFinite(obj.y)

function wrapText(str, maxWidth, maxLines) {
  const lines = []
  let from = 0

  while (from < str.length) {
    let breakAt = from + maxWidth

    const nl = str.indexOf('\n', from)
    if (nl >= from && nl <= breakAt) {
      lines.push(str.slice(from, nl))
      from = nl + 1
    } else if (breakAt >= str.length) {
      lines.push(str.slice(from))
      break
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

const coordToIndex = (x, y) => x + y * ROOM_WIDTH
const indexToCoord = (ix) => {
  const y = Math.floor(ix / ROOM_WIDTH)
  const x = ix - y * ROOM_WIDTH
  return [x, y]
}

const findSpecialGetter = (expr) => {
  if (!Array.isArray(expr)) return
  if (expr[0] !== 'get') return
  const parts = expr[1].split('.')
  if (parts.length !== 2 || parts[0] !== 'event') return
  return parts[1]
}

// 'inline' frames into tiles for easier access
const resolveFrames = (tiles, frameData) => {
  tiles.forEach((tile) => {
    tile.frames = tile.frames?.map((id) => frameData[id]?.data)
  })
}

const resolveTileScripts = (tiles, scriptData) => {
  tiles
    .filter((t) => isDefined(t.script))
    .forEach((tile) => {
      tile.script = scriptData[tile.script].data
    })
}

const resolveRoomScripts = (rooms, scriptData) => {
  rooms
    .filter((r) => isDefined(r.script))
    .forEach((room) => {
      room.script = scriptData[room.script].data
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
  tile.frames[Math.floor((tile.fps / FPS) * frameIx) % tile.frames.length]

const getCurrentFrameIndexForTile = (tile, frameIx) =>
  Math.floor((tile.fps / FPS) * frameIx) % tile.frames.length

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
    game.#loadCart(data)
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
    window.dump = () => {
      this.dump()
    }
  }

  restart() {
    this.#loadCart(JSON.parse(this.originalCart))
    this.play()
  }

  load(data, wrapped) {
    this.#loadCart(data)
    if (wrapped) this.room = this.wrap ?? this.card
    this.render()
  }

  #loadCart(data) {
    if (this.isRunning) {
      this.stop()
    }

    // repairAndCleanup(data)
    console.log(data)

    this.originalCart = JSON.stringify(data)
    this.cart = data
    this.meta = getMetaInfo(data)
    this.frameIx = 0

    this.dialogFrameIx = 0
    this.dialogActive = false

    this.config = {
      sayAdvanceDelay: 0.2,
      textSpeed: 20,
      textSkip: true,
      inputRepeat: true,
      inputRepeatDelay: 0.4,
      inputRepeatBetween: 0.2,
      autoAct: true,
      // follow: false,
      // followCenterX: 12,
      // followCenterY: 7,
      // followOverflowTile: 'black',
      // allowDismissRootMenu: false,
    }

    this.input = {
      [Button.UP]: new ButtonState(),
      [Button.RIGHT]: new ButtonState(),
      [Button.DOWN]: new ButtonState(),
      [Button.LEFT]: new ButtonState(),
      [Button.A]: new ButtonState(),
      [Button.B]: new ButtonState(),
    }
    this.isIgnored = false

    console.log(`Loaded "${this.meta.name}" by ${this.meta.author}`)

    // make rooms reference frames directly for convenience
    resolveTileScripts(data.tiles, data.scripts)
    resolveRoomScripts(data.rooms, data.scripts)
    resolveFrames(data.tiles, data.frames)
    resolveTiles(data.rooms, data.tiles)
    data.player.tile = data.tiles[data.player.id]

    // lookup the rooms for the Wrapper, Card and player starting location
    this.wrap = data.wrap !== -1 ? data.rooms[data.wrap] : null
    this.card = data.card !== -1 ? data.rooms[data.card] : null
    this.icon = data.card !== -1 ? data.rooms[data.icon] : null
    this.start = data.rooms[data.player.room]

    this.gameScript = data.scripts[data.script]?.data
    this.playerScript = data.player.tile.script

    // create a lookup table for room and tile names
    this.namedRooms = byName(data.rooms)
    this.namedTiles = byName(data.tiles)
    this.namedSounds = byName(data.sounds)
    this.namedSongs = byName(data.songs)
    this.backgroundTile =
      this.namedTiles[data.background == 1 ? 'black' : 'white']

    // some sort of context?
    this.globals = {}
    this.timers = {}

    // current room to render
    this.player = data.player
    this.player.visual = this.player.tile
    this.room = this.card
    this.roomTransition = null
    this.frameOverrides = {}

    this.storeKey = `zest/${this.meta.author}/${this.meta.name}`
    this.storeData = JSON.parse(localStorage.getItem(this.storeKey) ?? '{}')

    this.event = {
      px: this.player.x,
      py: this.player.y,
      tx: this.player.x,
      ty: this.player.y,
      player: this.player.tile.name,
      room: this.room.name,
      game: this.meta.name,
      aa: 0,
      ra: 0,
      frame: this.frameIx,
      ax: 0,
      ay: 0,
      az: 0,
      orientation: 'standing up',
    }
  }

  store(name) {
    if (name) {
      this.storeData[name] = this.globals[name]
    } else {
      localStorage.setItem(this.storeKey, JSON.stringify(this.storeData))
    }
  }

  restore(name) {
    if (name) {
      this.globals[name] = this.storeData[name]
    } else {
      this.globals = {
        ...this.globals,
        ...this.storeData,
      }
    }
  }

  toss() {
    this.storeData = {}
    localStorage.removeItem(this.storeKey)
  }

  #tick() {
    this.frameIx++
    this.event.frame = this.frameIx

    if (this.roomTransition) {
      this.#enter(this.roomTransition)
      this.roomTransition = null
    }

    this.runScript(this.gameScript, 'loop')
  }

  play() {
    if (this.isRunning) {
      warn('Already running')
      return
    }
    this.isRunning = true

    // LOAD event
    this.runScript(this.gameScript, 'load')
    this.cart.rooms.forEach((room) => this.runScript(room.script, 'load'))
    this.cart.tiles.forEach((tile) =>
      this.runScript(tile.script, 'load', { tile: tile.name })
    )

    // START
    this.#changeLoop(this.cart.song)
    this.runScript(this.gameScript, 'start')

    // ENTER starting room in next frame
    this.room = {
      tiles: Array(ROOM_HEIGHT * ROOM_WIDTH).fill(this.namedTiles.black),
    }
    this.roomTransition = this.start

    // loop at 20 FPS (50ms per tick)
    this.loopTimer = setInterval(() => {
      if (this.isPaused) return
      if (!this.dialogActive) {
        this.#tick()
        this.#runFrameTimers()
      } else {
        this.dialogLock--
        if (this.dialogTextIx < this.dialogText.length) {
          do {
            this.dialogTextIx += this.config.textSpeed / FPS
          } while (
            this.dialogText[this.dialogTextIx]?.trim() == '' &&
            this.dialogTextIx < this.dialogText.length
          )
        } else {
          this.dialogFrameIx++
        }
      }
      this.#updateInput()
      this.#runPlayerScript('draw')
      this.render()
    }, 1000 / FPS)
  }

  stop() {
    if (!this.isRunning) {
      warn('Already stopped')
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

  ignore() {
    this.isIgnored = true
  }

  listen() {
    this.isIgnored = false
  }

  getTileAt(x, y) {
    const ix = coordToIndex(x, y)
    return this.room.tiles[ix]
  }

  swapTileAt(x, y, tile) {
    const ix = coordToIndex(x, y)
    delete this.frameOverrides[ix]
    this.room.tiles[ix] = tile
  }

  #setFrameAt(x, y, frameIx) {
    const tile = this.getTileAt(x, y)
    const ix = coordToIndex(x, y)
    this.frameOverrides[ix] = frameIx
  }

  #getFrameAt(x, y) {
    const tile = this.getTileAt(x, y)
    const ix = coordToIndex(x, y)
    return (
      this.frameOverrides[ix] ?? getCurrentFrameIndexForTile(tile, this.frameIx)
    )
  }

  say(message, cb, ctx) {
    this.#clearInput()
    message = this.runExpression(message, null, { ...this.event, ...ctx })
    this.dialogActive = true
    this.dialogPages = wrapText(message, 17, 4)
    this.dialogText = this.dialogPages.shift()
    this.dialogTextIx = 0
    this.dialogLock = this.config.sayAdvanceDelay * FPS
    this.dialogCb = cb ?? noop
  }

  advanceSay() {
    if (!this.dialogActive) return false

    if (this.dialogLock >= 0) return true

    if (this.dialogTextIx < this.dialogText.length) {
      if (this.config.textSkip) {
        this.dialogTextIx = this.dialogText.length
        this.#clearInput()
      }
      return true
    }

    if (this.dialogPages.length > 0) {
      this.dialogText = this.dialogPages.shift()
      this.dialogTextIx = 0
      this.#clearInput()
    } else {
      this.dialogActive = false
      this.dialogCb()
    }
    return true
  }

  fin(message) {
    this.store()
    this.runScript(this.gameScript, 'finish')
    this.room = {
      tiles: Array(ROOM_HEIGHT * ROOM_WIDTH).fill(this.namedTiles.black),
    }
    this.say(message, () => {
      this.restart()
    })
  }

  #scheduleFrameTimer(cb, frameDelay) {
    const atFrame = this.frameIx + (frameDelay <= 1 ? 1 : Math.ceil(frameDelay))
    let list = this.timers[atFrame]
    if (!list) {
      list = []
      this.timers[atFrame] = list
    }
    list.push(cb)
  }

  #runFrameTimers() {
    let list = this.timers[this.frameIx]
    if (!list) return
    list.forEach((cb) => cb())
  }

  log(message) {
    console.log(`[GAME] ${message}`)
  }

  dump(context) {
    console.log({
      event: context ?? this.event,
      game: this.globals,
      store: this.storeData,
      config: this.config,
    })
  }

  getTile(ref) {
    if (typeof ref === 'string') return this.namedTiles[ref]
    else return this.cart.tiles[ref]
  }

  getRoom(ref) {
    if (typeof ref === 'string') return this.namedRooms[ref]
    else return this.cart.rooms[ref]
  }

  getSound(ref) {
    if (typeof ref === 'string') return this.namedSounds[ref]
    else return this.cart.sounds[ref]
  }

  getSong(ref) {
    if (typeof ref === 'string') return this.namedSongs[ref]
    else return this.cart.songs[ref]
  }

  playSound(ref) {
    const sound = this.getSound(ref)
    console.log(`[AUDIO] play ${sound.name}`) // @TODO implement
  }
  bpm(tempo) {
    console.log(`[AUDIO] bpm ${tempo}`) // @TODO implement
  }
  loopMusic(ref) {
    const song = this.getSong(ref)
    console.log(`[AUDIO] loop ${song.name}`) // @TODO implement
  }
  onceMusic(ref) {
    const song = this.getSong(ref)
    console.log(`[AUDIO] once ${song.name}`) // @TODO implement
  }
  stopMusic() {
    console.log(`[AUDIO] stop`) // @TODO implement
  }

  #changeLoop(ref) {
    if (!isDefined(ref) || ref === -1) return
    else if (ref === -2) this.stopMusic()
    else this.loopMusic(ref)
  }

  runExpression(expr, blocks = [], context) {
    if (this.calledDone) return

    //  pass through literals
    if (!Array.isArray(expr)) {
      return expr
    }

    const getValueOf = (name) => {
      if (typeof name !== 'string') {
        // number literal
        return name
      }

      const parts = name.split('.')
      if (parts.length === 1) {
        return this.globals[name] ?? 0
      } else if (parts.length === 2) {
        if (parts[0] === 'event') {
          if (name == 'event.self') return 0 // internal variable
          return context[parts[1]] ?? 0 // extended from this.event
        } else if (parts[0] === 'config') {
          return this.config[parts[1]] ?? 0
        } else if (parts[0] === 'datetime') {
          return getDateTimePart(parts[1])
        } else {
          return 0
        }
      } else {
        warn('Syntax error? Trying to get value of:')
        warn(identifier)
      }
    }

    const setValueOf = (name, val) => {
      const parts = name.split('.')
      if (parts.length === 1) {
        // global
        this.globals[name] = val
      } else if (parts[0] == 'config') {
        this.config[parts[1]] = val
      } else {
        warn(`Not allowed to set: ${name}`)
      }
    }

    const updateValueOf = (name, update) =>
      setValueOf(name, update(getValueOf(name)))

    const run = (e) => this.runExpression(e, blocks, context)
    const [op, ...args] = expr

    if (op === '_') {
      // ignore, identation maybe?
    } else if (op == '#') {
      // ignore, probably comments
    } else if (op === 'block') {
      blocks[args[0]].forEach((e) => {
        if (this.calledDone) return
        run(e)
      })
    } else if (op === 'if') {
      const [condition, iftrue, ...elses] = args
      const res = run(condition)
      if (res) {
        run(iftrue)
      } else {
        for (let i = 0; i < elses.length; i++) {
          const branch = elses[i]
          if (branch[0] === 'else') {
            run(branch[1])
            return
          } else if (branch[0] === 'elseif' && run(branch[1])) {
            run(branch[2])
            return
          }
        }
      }
    } else if (op === 'while') {
      const [condition, body] = args
      while (run(condition)) {
        if (this.calledDone) return
        run(body)
      }
    } else if (op === 'eq') {
      return getValueOf(args[0]) == run(args[1])
    } else if (op === 'neq') {
      return getValueOf(args[0]) != run(args[1])
    } else if (op === 'gt') {
      return getValueOf(args[0]) > run(args[1])
    } else if (op === 'lt') {
      return getValueOf(args[0]) < run(args[1])
    } else if (op === 'gte') {
      return getValueOf(args[0]) >= run(args[1])
    } else if (op === 'lte') {
      return getValueOf(args[0]) <= run(args[1])
    } else if (op === 'say') {
      const msg = run(args[0])
      if (args[1]) {
        this.say(msg, () => {
          run(args[1])
        })
      } else {
        this.say(msg)
      }
    } else if (op === 'fin') {
      this.fin(args[0])
    } else if (op === 'log') {
      this.log(run(args[0]))
    } else if (op === 'dump') {
      this.dump(context)
    } else if (op === 'ignore') {
      this.ignore()
    } else if (op === 'listen') {
      this.listen()
    } else if (op === 'type') {
      const who = run(args[0])
      const tile = isXY(who) ? this.getTileAt(who.x, who.y) : this.getTile(who)
      return TileTypes[tile.type]
    } else if (op === 'solid') {
      const who = run(args[0])
      const tile = isXY(who) ? this.getTileAt(who.x, who.y) : this.getTile(who)
      return tile.solid ? 1 : 0
    } else if (op === 'id') {
      const who = run(args[0])
      const tile = isXY(who) ? this.getTileAt(who.x, who.y) : this.getTile(who)
      return tile.id
    } else if (op === 'name') {
      const who = run(args[0])
      const tile = isXY(who) ? this.getTileAt(who.x, who.y) : this.getTile(who)
      return tile.name
    } else if (op === 'swap') {
      const newTile = this.getTile(run(args[0]))
      const where = args[1] && run(args[1])
      if (isXY(where)) {
        this.swapTileAt(where.x, where.y, newTile)
      } else if (context.self == this.playerScript) {
        this.player.frameIx = undefined
        this.player.visual = newTile
      } else if (isXY(context)) {
        this.swapTileAt(context.x, context.y, newTile)
      } else {
        fail('Can only call SWAP on a tile instance')
      }
    } else if (op === 'xy') {
      const [x, y] = args
      return { x: run(x), y: run(y) }
    } else if (op === 'tell') {
      // parse manually because run() would return the name as string
      const magic = findSpecialGetter(args[0])
      if (magic === 'player') {
        return this.runExpression(args[1], blocks, {
          ...context,
          x: this.player.x,
          y: this.player.y,
          tile: this.player.tile.name,
          self: this.playerScript,
        })
      } else if (magic === 'room') {
        return this.runExpression(args[1], blocks, {
          ...context,
          x: undefined,
          y: undefined,
          tile: undefined,
          self: this.room.script,
        })
      } else if (magic === 'game') {
        return this.runExpression(args[1], blocks, {
          ...context,
          x: undefined,
          y: undefined,
          tile: undefined,
          self: this.gameScript,
        })
      }

      const who = run(args[0])
      if (isXY(who)) {
        const tile = this.getTileAt(who.x, who.y)
        return this.runExpression(args[1], blocks, {
          ...context,
          x: who.x,
          y: who.y,
          tile,
          self: tile.script,
        })
      } else {
        const tile = this.getTile(who)
        return this.runExpression(args[1], blocks, {
          ...context,
          x: undefined,
          y: undefined,
          tile,
          self: tile.script,
        })
      }
    } else if (op === 'call') {
      if (context.self == this.playerScript) {
        this.#runPlayerScript(run(args[0]))
      } else if (isXY(context)) {
        const { x, y } = context
        const tile = this.getTileAt(x, y)
        this.runScript(tile.script, run(args[0]), { ...context, x, y, tile })
      } else {
        this.runScript(context.self, run(args[0]), context)
      }
    } else if (op === 'emit') {
      this.emit(run(args[0]))
    } else if (op === 'act') {
      this.act()
    } else if (op === 'goto') {
      const { x, y } = run(args[0])
      this.goto(x, y, run(args[1]))
    } else if (op === 'wait') {
      const delay = run(args[0]) * FPS
      this.#scheduleFrameTimer(() => run(args[1]), delay)
    } else if (op === 'bpm') {
      this.bpm(run(args[0]))
    } else if (op === 'loop') {
      this.loopMusic(run(args[0]))
    } else if (op === 'once') {
      this.onceMusic(run(args[0]))
    } else if (op === 'sound') {
      this.playSound(run(args[0]))
    } else if (op === 'stop') {
      this.stopMusic(run(args[0]))
    } else if (op === 'get') {
      return getValueOf(args[0])
    } else if (op === 'set') {
      setValueOf(args[0], run(args[1]))
    } else if (op === 'store') {
      this.store(args[0])
    } else if (op === 'restore') {
      this.restore(args[0])
    } else if (op === 'toss') {
      this.toss()
    } else if (op === 'frame') {
      if (isDefined(args[0])) {
        const frameIx = run(args[0])
        if (context.self == this.playerScript) {
          this.player.frameIx = frameIx
        } else if (isXY(context)) {
          this.#setFrameAt(context.x, context.y, frameIx)
        } else {
          fail('Can only set FRAME on a tile instance')
        }
      } else {
        if (context.self == this.playerScript) {
          return (
            this.player.frameIx ??
            getCurrentFrameIndexForTile(this.player.tile, this.frameIx)
          )
        } else if (isXY(context)) {
          return this.#getFrameAt(context.x, context.y)
        } else {
          fail('Can only get FRAME on a tile instance')
        }
      }
    } else if (op === 'random') {
      const range = Math.abs(args[1] - args[0] + 1)
      return Math.floor(Math.random() * range) + Math.min(args[0], args[1])
    } else if (op === 'sine') {
      return Math.sin(args[0])
    } else if (op === 'cosine') {
      return Math.cos(args[0])
    } else if (op === 'tangent') {
      return Math.tan(args[0])
    } else if (op === 'radians') {
      return (args[0] * Math.PI) / 180
    } else if (op === 'degrees') {
      return (args[0] * 180) / Math.PI
    } else if (op === 'inc') {
      return updateValueOf(args[0], (x) => x + 1)
    } else if (op === 'dec') {
      return updateValueOf(args[0], (x) => x - 1)
    } else if (op === 'add') {
      return updateValueOf(args[0], (x) => x + args[1])
    } else if (op === 'sub') {
      return updateValueOf(args[0], (x) => x - args[1])
    } else if (op === 'mul') {
      return updateValueOf(args[0], (x) => x * args[1])
    } else if (op === 'div') {
      return updateValueOf(args[0], (x) => x / args[1])
    } else if (op === 'floor') {
      return Math.floor(run(args[0]))
    } else if (op === 'ceil') {
      return Math.ceil(run(args[0]))
    } else if (op === 'round') {
      return Math.round(run(args[0]))
    } else if (op === 'format') {
      return args.reduce((str, part) => `${str}${run(part)}`, '')
    } else if (op === 'lpad') {
      return run(args[0]).toString().padStart(args[1], args[2])
    } else if (op === 'rpad') {
      return run(args[0]).toString().padEnd(args[1], args[2])
    } else if (op === 'embed') {
      const tile = this.getTile(args[0])
      return String.fromCharCode(128 + tile.id)
    } else if (op === 'done') {
      this.calledDone = true // could it really be this simple?
    } else {
      if (op in alreadyWarnedForUnknownExpressionType) return
      alreadyWarnedForUnknownExpressionType[op] = true
      warn(`Unknown expression type: ${op}`)
      warn(JSON.stringify(expr))
    }
  }

  runScript(script, name, ctx = {}) {
    if (!script) return

    // ctx can override 'self'
    const context = { ...this.event, self: script, ...ctx, name }

    const anyExpr = script.any
    if (anyExpr) {
      this.runExpression(anyExpr, script.__blocks, context)
      this.calledDone = false
    }

    const expr = script[name]
    if (expr) {
      this.runExpression(expr, script.__blocks, context)
      this.calledDone = false
    }
  }

  #runPlayerScript(name, ctx) {
    this.runScript(this.playerScript, name, {
      ...ctx,
      x: this.player.x,
      y: this.player.y,
      tile: this.player.tile.name,
    })
  }

  emit(name, ctx = {}) {
    this.runScript(this.gameScript, name)
    this.runScript(this.room.script, name)
    this.room.tiles.forEach((tile, ix) => {
      const [x, y] = indexToCoord(ix)
      this.runScript(tile.script, name, { ...ctx, x, y, tile: tile.name })
    })
    this.#runPlayerScript(name, ctx)
  }

  act() {
    const { px, py, dx, dy } = this.event
    const tx = px + dx
    const ty = py + dy
    const target = this.getTileAt(tx, ty)
    if (target) {
      this.#actOn(target, tx, ty)
    }
  }

  #actOn(target, x, y) {
    const ctx = { tile: target.name, x, y }
    if (target.script) {
      this.runScript(target.script, 'interact', ctx)
    } else {
      // noscript handler
      if (isDefined(target.sound)) {
        this.playSound(target.sound)
      }
      if (target.says) {
        this.say(target.says, null, ctx)
      }
    }
  }

  #collect(target, x, y) {
    const ctx = { tile: target.name, x, y }
    if (target.script) {
      this.runScript(target.script, 'collect', ctx)
    } else {
      // noscript handler
      const keyName = `${target.name}s`
      const counter = this.globals[keyName] ?? 0
      this.globals[keyName] = counter + 1
      this.room.tiles[coordToIndex(x, y)] = this.backgroundTile
      if (isDefined(target.sound)) {
        this.playSound(target.sound)
      }
      if (target.says) {
        this.say(target.says, null, ctx)
      }
    }
  }

  #enter(room) {
    this.room = room
    this.frameOverrides = {}

    this.player.room = this.room.id
    this.event.room = this.room.name

    // ENTER event
    this.#changeLoop(this.room.song)
    this.emit('enter')
  }

  goto(x, y, room) {
    if (isDefined(room)) {
      // EXIT event
      this.emit('exit')

      this.store()
      this.roomTransition = this.getRoom(room)
    }

    this.player.x = x
    this.player.y = y

    this.event = {
      ...this.event,
      room: this.room.name,
      px: x,
      py: y,
      tx: x,
      ty: y,
    }
  }

  #movePlayer(dx, dy) {
    if (dx == 0 && dy == 0) return
    if (dx !== 0 && dy !== 0) dx = 0 // no diagonal movement allowed

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

    this.event = { ...this.event, dx, dy, tx, ty, x: tx, y: ty }

    const target = this.getTileAt(tx, ty)
    if (target.solid) {
      canMove = false
    }

    const prevX = this.player.x
    const prevY = this.player.y
    if (canMove) {
      this.player.x = tx
      this.player.y = ty
      this.event.px = this.player.x
      this.event.py = this.player.y
    }

    this.#runPlayerScript('update')

    // sprite type
    let shouldBump = false
    if (target.type == 2) {
      if (this.config.autoAct) {
        this.#actOn(target, tx, ty)
      }
    } else if (target.type == 3) {
      this.#collect(target, tx, ty)
    } else if (!canMove) {
      shouldBump = true // unless there is an exit edge
    }

    this.event.tx = this.player.x + dx
    this.event.ty = this.player.y + dy

    // check for exits
    this.room.exits.forEach((exit) => {
      if (isDefined(exit.edge)) {
        if (exit.edge == EdgeDirection.UP) {
          if (prevY == exit.y && dy < 0) {
            this.goto(prevX, exit.ty, exit.room)
          }
        } else if (exit.edge == EdgeDirection.RIGHT) {
          if (prevX == exit.x && dx > 0) {
            this.goto(exit.tx, prevY, exit.room)
          }
        } else if (exit.edge == EdgeDirection.DOWN) {
          if (prevY == exit.y && dy > 0) {
            this.goto(prevX, exit.ty, exit.room)
          }
        } else if (exit.edge == EdgeDirection.LEFT) {
          if (prevX == exit.x && dx < 0) {
            this.goto(exit.tx, prevY, exit.room)
          }
        }
      } else if (tx == exit.x && ty == exit.y) {
        if (exit.fin) {
          this.#changeLoop(exit.song)
          this.fin(exit.fin)
        } else {
          this.goto(exit.tx, exit.ty, exit.room)
        }
      }
    })

    if (shouldBump && !this.roomTransition) {
      this.#runPlayerScript('bump')
    }
  }

  pressKey(key) {
    this.input[key].press()
  }
  releaseKey(key) {
    this.input[key].release()
  }

  #clearInput() {
    this.input[Button.UP].release()
    this.input[Button.RIGHT].release()
    this.input[Button.DOWN].release()
    this.input[Button.LEFT].release()
    this.input[Button.A].release()
    this.input[Button.B].release()
  }

  #updateInput() {
    const inputRepeat = this.config.inputRepeat
    const inputRepeatDelay = this.config.inputRepeatDelay
    const inputRepeatBetween = this.config.inputRepeatBetween

    let dx = 0
    let dy = 0
    let confirmPressed = false
    let cancelPressed = false
    let anythingPressed = false

    if (
      this.input[Button.UP].check(
        inputRepeat,
        inputRepeatDelay,
        inputRepeatBetween
      )
    ) {
      dy--
      anythingPressed = true
    }
    if (
      this.input[Button.DOWN].check(
        inputRepeat,
        inputRepeatDelay,
        inputRepeatBetween
      )
    ) {
      dy++
      anythingPressed = true
    }
    if (
      this.input[Button.RIGHT].check(
        inputRepeat,
        inputRepeatDelay,
        inputRepeatBetween
      )
    ) {
      dx++
      anythingPressed = true
    }
    if (
      this.input[Button.LEFT].check(
        inputRepeat,
        inputRepeatDelay,
        inputRepeatBetween
      )
    ) {
      dx--
      anythingPressed = true
    }

    if (
      this.input[Button.A].check(
        inputRepeat,
        inputRepeatDelay,
        inputRepeatBetween
      )
    ) {
      anythingPressed = true
      confirmPressed = true
    }
    if (
      this.input[Button.B].check(
        inputRepeat,
        inputRepeatDelay,
        inputRepeatBetween
      )
    ) {
      anythingPressed = true
      cancelPressed = true
    }

    if (!this.isRunning || this.isPaused) return
    if (!anythingPressed) return

    if (this.advanceSay()) return

    if (this.isIgnored) return

    if (dx !== 0 || dy !== 0) {
      this.#movePlayer(dx, dy)
    } else if (confirmPressed) {
      this.#runPlayerScript('confirm')
    } else if (cancelPressed) {
      this.#runPlayerScript('cancel')
    }
  }

  // drawFrame(frame, x, y, pixels) {
  //   const tx = x * 8
  //   const ty = y * 8

  //   for (let y = 0; y < 8; y++) {
  //     for (let x = 0; x < 8; x++) {
  //       const col = frame[x + y * 8]

  //       if (col == 2) continue // transparent
  //       let [r, g, b, a] = COLOR_WHITE
  //       if (col == 1) [r, g, b, a] = COLOR_BLACK

  //       let ix = tx + x + (ty + y) * PIXEL_WIDTH
  //       pixels[ix * 4] = r
  //       pixels[ix * 4 + 1] = g
  //       pixels[ix * 4 + 2] = b
  //       pixels[ix * 4 + 3] = a
  //     }
  //   }
  // }

  render() {
    // get all room frames

    // get the current snapshot of a room, as an array of frames
    const tilemap = this.room.tiles.map(
      (tile, ix) =>
        tile.frames[
          this.frameOverrides[ix] ??
            getCurrentFrameIndexForTile(tile, this.frameIx)
        ]
    )

    // display player
    if (this.room == this.cart.rooms[this.player.room]) {
      const playerFrame = isDefined(this.player.frameIx)
        ? this.player.visual.frames[this.player.frameIx]
        : getCurrentFrameForTile(this.player.visual, this.frameIx)
      const ti = coordToIndex(this.player.x, this.player.y)
      // add background tile to transparent areas
      tilemap[ti] = playerFrame.map((fg, pi) =>
        fg == 2 ? tilemap[ti][pi] : fg
      )
    }

    // draw window
    if (this.dialogActive) {
      tilemap[coordToIndex(3, 3)] = this.cart.font.pipe[0] // top left corner
      tilemap[coordToIndex(21, 3)] = this.cart.font.pipe[2] // top right corner

      // horizontal border
      for (let x = 4; x < 21; x++) {
        tilemap[coordToIndex(x, 3)] = this.cart.font.pipe[1]
        tilemap[coordToIndex(x, 8)] = this.cart.font.pipe[7]
      }

      // vertical border
      for (let y = 4; y < 8; y++) {
        tilemap[coordToIndex(3, y)] = this.cart.font.pipe[3]
        tilemap[coordToIndex(21, y)] = this.cart.font.pipe[5]
      }

      tilemap[coordToIndex(3, 8)] = this.cart.font.pipe[6] // bottom left corner
      tilemap[coordToIndex(21, 8)] = this.cart.font.pipe[8] // bottom right corner

      if (this.dialogTextIx >= this.dialogText.length) {
        const arrowIx = 9 + (Math.floor(this.dialogFrameIx / 10) % 2)
        tilemap[coordToIndex(20, 8)] = this.cart.font.pipe[arrowIx] // arrow
      }

      for (let y = 4; y < 8; y++) {
        for (let x = 4; x < 21; x++) {
          tilemap[coordToIndex(x, y)] = this.cart.font.pipe[4]
        }
      }

      let xx = 4
      let yy = 4
      let text = this.dialogText.substring(0, this.dialogTextIx)

      for (let i = 0; i < text.length; i++) {
        let glyph = text.charCodeAt(i)
        if (xx > 20 || glyph == 10) {
          xx = 4
          yy++
        }
        if (glyph == 10) continue // space
        tilemap[coordToIndex(xx, yy)] =
          glyph > 128
            ? this.cart.tiles[glyph - 128].frames[0]
            : this.cart.font.chars[glyph - 32]
        xx++
      }
    }

    this.#drawToCanvas(tilemap)
  }

  #drawToCanvas(tilemap) {
    const imgData = new ImageData(PIXEL_WIDTH, PIXEL_HEIGHT)
    const pixels = imgData.data

    for (let y = 0; y < PIXEL_HEIGHT; y++) {
      const ty = Math.floor(y / CELL_SIZE)
      const py = y % CELL_SIZE
      for (let x = 0; x < PIXEL_WIDTH; x++) {
        const tx = Math.floor(x / CELL_SIZE)
        const px = x % CELL_SIZE

        const ti = tx + ROOM_WIDTH * ty
        const pi = px + CELL_SIZE * py

        const arr = tilemap[ti]
        const col = arr[pi]

        const [r, g, b, a] = col == 1 ? COLOR_BLACK : COLOR_WHITE

        let ix = x + y * PIXEL_WIDTH
        pixels[ix * 4] = r
        pixels[ix * 4 + 1] = g
        pixels[ix * 4 + 2] = b
        pixels[ix * 4 + 3] = a
      }
    }
    this.ctx2d.putImageData(imgData, 0, 0)
  }
}
