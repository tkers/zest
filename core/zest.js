'use strict'

/*! Copyright (c) 2026 Tijn Kersjes - MIT License */

window.Zest = (function () {
  const FPS = 20
  const CELL_SIZE = 8
  const ROOM_WIDTH = 25
  const ROOM_HEIGHT = 15
  const PIXEL_WIDTH = 200
  const PIXEL_HEIGHT = 120
  const FRAME_DURATION = 1 / FPS

  // device appearance
  const COLOR_BLACK = '#312f28' // '#000'
  const COLOR_WHITE = '#b1afa8' // '#fff'

  const BLACK_FRAME = Array(ROOM_WIDTH * ROOM_HEIGHT).fill(1)

  const EdgeDirection = { UP: 0, RIGHT: 1, DOWN: 2, LEFT: 3 }
  const TileTypes = { 0: 'world', 1: 'player', 2: 'sprite', 3: 'item' }
  const PipeIndex = {
    PROMPT: 9,
    PROMPT_DOWN: 10,
    CURSOR: 11,
    CURSOR_INACTIVE: 12,
    PAGES: 13,
  }

  const kButtonUp = 1
  const kButtonRight = 2
  const kButtonDown = 3
  const kButtonLeft = 4
  const kButtonA = 5
  const kButtonB = 6
  const kButtonCrank = 7

  const clamp = (lo, x, hi) => Math.min(Math.max(lo, x), hi)
  const wrap = (x, len) => (x + len) % len

  const makeWindowRect = (rect = {}) => {
    const x = clamp(0, rect.x ?? 3, ROOM_WIDTH - 1)
    const y = clamp(0, rect.y ?? 3, ROOM_HEIGHT - 1)
    const w = clamp(0, rect.w ?? 17, ROOM_WIDTH - 2 - x)
    const h = clamp(0, rect.h ?? 4, ROOM_HEIGHT - 2 - y)
    return [x, y, w, h]
  }

  function warn(message) {
    console.warn(`[WARN] ${message}`)
  }
  function fail(message) {
    console.error(`[FAIL] ${message}`)
  }

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
    clear() {
      this.isPressed = false
      this.justPressed = false
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
  const isDefined = (x) => typeof x !== 'undefined' && x !== null
  const fixAngleDeg = (a) => {
    if (a > 180) return a - 360
    else if (a < -180) return a + 360
    else return a
  }

  const chunkify = (elements, chunkSize) => {
    const res = []
    for (let i = 0; i < elements.length; i += chunkSize) {
      res.push(elements.slice(i, i + chunkSize))
    }
    return res
  }

  const hexToRgba = (col) => {
    let hex = col[0] == '#' ? col.slice(1) : col
    if (hex.length == 3) {
      const [r, g, b] = hex.split('')
      hex = `${r}${r}${g}${g}${b}${b}`
    }
    if (hex.length != 6) {
      warn('Invalid hex color: ${col}')
      return [0, 0, 0, 255]
    }
    const num = parseInt(hex, 16)
    return [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff, 255]
  }

  const isXY = (obj) => obj && Number.isFinite(obj.x) && Number.isFinite(obj.y)
  const isOption = (x) => x && isDefined(x.label) && isDefined(x.action)

  function wrapText(str, maxWidth, maxLines) {
    const lines = []
    let from = 0

    while (from < str.length) {
      let breakAt = from + maxWidth
      let ff = str.indexOf('\f', from)
      const nl = str.indexOf('\n', from)
      if (nl > -1 && nl < ff) ff = -1

      if (ff >= from && ff <= breakAt) {
        lines.push(str.slice(from, ff))
        const nf = 4 - (lines.length % maxLines) // kind of ugly but it works
        for (let i = 0; i < nf % maxLines; i++) {
          lines.push('')
        }
        from = ff + 1
      } else if (nl >= from && nl <= breakAt) {
        lines.push(str.slice(from, nl))
        from = nl + 1
      } else if (breakAt >= str.length) {
        lines.push(str.slice(from))
        break
      } else {
        let bl = str.lastIndexOf(' ', breakAt)
        const hy = str.lastIndexOf('-', breakAt)
        if (hy > bl) bl = -1

        if (bl > from) {
          lines.push(str.slice(from, bl))
          from = bl + 1
        } else if (hy > from) {
          lines.push(str.slice(from, hy + 1))
          from = hy + 1
        } else {
          lines.push(str.slice(from, breakAt))
          from = breakAt
        }
      }
    }

    if (maxLines) {
      return chunkify(lines, maxLines).map((page) => page.join('\n'))
    } else {
      return lines.join('\n')
    }
  }

  const randomInt = (lo, hi) => {
    if (!isDefined(hi)) {
      hi = lo
      lo = 0
    }
    lo = Math.floor(lo)
    hi = Math.floor(hi)
    const range = Math.abs(hi - lo + 1)
    return Math.floor(Math.random() * range) + Math.min(lo, hi)
  }

  // transform [{ name: n, ... }] -> { n: { ... } }
  const byName = (arr) =>
    Object.fromEntries(arr.filter(Boolean).map((x) => [x.name, x]))
  const filterObject = (obj, cb) =>
    Object.fromEntries(Object.entries(obj).filter(cb))

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
    tiles.filter(Boolean).forEach((tile) => {
      tile.frames = tile.frames?.map((id) => frameData[id]?.data)
    })
  }

  const resolveTileScripts = (tiles, scriptData) => {
    tiles
      .filter((t) => isDefined(t.script))
      .forEach((tile) => {
        tile.script = scriptData[tile.script].data
        // if (tile.script) {
        //   tile.script._scriptParentName = `<TILE> ${tile.name} (${tile.id})`
        // }
      })
  }

  const resolveRoomScripts = (rooms, scriptData) => {
    rooms
      .filter((r) => isDefined(r.script))
      .forEach((room) => {
        room.script = scriptData[room.script].data
        // if (room.script) {
        //   room.script._scriptParentName = `<ROOM> ${room.name} (${room.id})`
        // }
      })
  }

  // 'inline' tiles into rooms for easier access
  const resolveTiles = (rooms, tileData) => {
    rooms.filter(Boolean).forEach((room) => {
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
  class Zest extends EventTarget {
    static run(data, canvas) {
      const game = new Zest(canvas)
      game.run(data)
      return game
    }

    static load(data, canvas) {
      const game = new Zest(canvas)
      game.load(data)
      return game
    }

    static #plugins = []
    static register(plugin) {
      this.#plugins.push(plugin)
    }

    constructor(canvas) {
      super()
      this.canvas = canvas
      this.ctx2d = canvas.getContext('2d')
      this.isRunning = false
      this.isPaused = false
      this.volume = 100
      this.isSystemMenuOpen = false
      this.systemMenuOptions = [
        { label: 'Volume' },
        { label: 'Restart', action: () => this.restart() },
        { label: 'Erase data', action: () => this.toss() },
      ]

      window.dump = () => {
        this.dump()
      }
      Zest.#plugins.forEach((init) => init(this))
    }

    restart() {
      this.#loadCart(this.originalCart)
      this.play()
    }

    run(data) {
      this.#loadCart(data)
      this.play()
    }

    load(data, wrapped) {
      this.#loadCart(data)
      if (wrapped) this.room = this.wrap ?? this.card
      this.render()
    }

    #loadCart(_data) {
      const data = JSON.parse(JSON.stringify(_data))

      if (this.isRunning) {
        this.stop()
      }

      // repairAndCleanup(data)
      console.log(data)

      this.originalCart = _data
      this.cart = data
      this.meta = getMetaInfo(data)
      this.frameIx = 0

      this.dialogFrameIx = 0
      this.dialogActive = false
      this.menuActive = false
      this.menuStack = []
      this.cropArea = [0, 0, 25, 15]
      this.imgData = new ImageData(PIXEL_WIDTH, PIXEL_HEIGHT)

      this.config = {
        sayAdvanceDelay: 0.2,
        textSpeed: 20,
        textSkip: 1,
        inputRepeat: 1,
        inputRepeatDelay: 0.4,
        inputRepeatBetween: 0.2,
        autoAct: 1,
        allowDismissRootMenu: 0,
        follow: 0,
        followCenterX: 12,
        followCenterY: 7,
        followOverflowTile: 'black',
        colorBlack: COLOR_BLACK,
        colorWhite: COLOR_WHITE,
      }

      this.colorBlack = hexToRgba(this.config.colorBlack)
      this.colorWhite = hexToRgba(this.config.colorWhite)

      this.input = {
        [kButtonUp]: new ButtonState(),
        [kButtonRight]: new ButtonState(),
        [kButtonDown]: new ButtonState(),
        [kButtonLeft]: new ButtonState(),
        [kButtonA]: new ButtonState(),
        [kButtonB]: new ButtonState(),
      }
      this.isCrankDocked = true
      this.crankAngle = 0
      this.uiCrankRotated = 0
      this.isIgnored = false
      this.ignoreCount = 0

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

      this.charWidth = data.font.type === 0 ? 0.5 : 1

      this.gameScript = data.scripts[data.script]?.data
      // needs to be a unique refrence to compare to, so NULL breaks things
      this.playerScript = data.player.tile.script ?? {}

      // create a lookup table for room and tile names
      this.namedRooms = byName(data.rooms)
      this.namedTiles = byName(data.tiles)
      this.namedSounds = byName(data.sounds)
      this.namedSongs = byName(data.songs)
      this.backgroundTile =
        this.namedTiles[data.background == 1 ? 'black' : 'white']

      // some sort of context?
      this.globals = {}
      this.frameTimers = {}
      this.playTimers = {}
      this.isInverted = false
      this.isShaking = false
      this.currentSong = null

      // current room to render
      this.player = data.player
      this.player.visual = this.player.tile
      this.room = this.card
      this.roomTransition = null
      this.roomTransitionX = null
      this.roomTransitionY = null
      this.frameOverrides = {}

      this.storeKey = `zest/${this.meta.author}/${this.meta.name}`
      this.storeData = JSON.parse(localStorage.getItem(this.storeKey) ?? '{}')
      this.storeDirty = new Set()

      this.event = {
        px: this.player.x,
        py: this.player.y,
        tx: this.player.x,
        ty: this.player.y,
        player: this.player.tile.name,
        room: null, //this.start.name,
        game: this.meta.name,
        aa: this.crankAngle,
        ra: 0,
        frame: this.frameIx,
        ax: 0,
        ay: 0,
        az: 0,
        orientation: 'standing up',
        zest: 1,
      }
    }

    attachKeyboard(bindings = {}, target = window) {
      const DEFAULT_KEY_BINDINGS = {
        ArrowUp: kButtonUp,
        ArrowDown: kButtonDown,
        ArrowLeft: kButtonLeft,
        ArrowRight: kButtonRight,
        KeyZ: kButtonB,
        KeyX: kButtonA,
        KeyC: kButtonCrank,
      }

      const bound = new Set(Object.values(bindings))
      const missing = Object.fromEntries(
        Object.entries(DEFAULT_KEY_BINDINGS).filter(([k, v]) => !bound.has(v))
      )
      const keymap = { ...missing, ...bindings }

      target.addEventListener('keydown', (e) => {
        const btn = keymap[e.code]
        if (!btn) return
        e.preventDefault()
        if (e.repeat) return
        if (btn === kButtonCrank) {
          if (this.isCrankDocked) {
            this.undockCrank()
          } else {
            this.dockCrank()
          }
        } else {
          this.pressKey(btn)
        }
      })

      target.addEventListener('keyup', (e) => {
        const btn = keymap[e.code]
        if (!btn) return
        e.preventDefault()
        this.releaseKey(btn)
      })
    }

    store(name) {
      if (name) {
        this.storeData[name] = this.globals[name]
        this.storeDirty.add(name)
      } else {
        localStorage.setItem(this.storeKey, JSON.stringify(this.storeData))
        this.#emitEvent('store', {
          key: this.storeKey,
          data: filterObject(this.storeData, ([k]) => this.storeDirty.has(k)),
        })
        this.storeDirty = new Set()
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
      this.storeDirty = new Set()
      localStorage.removeItem(this.storeKey)
    }

    #loop() {
      if (this.isPaused) return

      // keep world suspended while a window is open
      if (!this.menuActive && !this.dialogActive && !this.isSystemMenuOpen) {
        this.#tick()
        this.#updateInput()
        this.#runTimers()
        this.render()
      } else {
        this.#updateInput()

        if (this.dialogActive) {
          this.dialogLock--
          if (this.dialogTextIx < this.dialogText.length) {
            do {
              this.dialogTextIx += this.config.textSpeed / FPS
            } while (
              this.dialogText[this.dialogTextIx]?.trim() == '' &&
              this.dialogTextIx < this.dialogText.length
            )
          } else if (!this.menuActive) {
            this.dialogFrameIx++
          }
        }

        this.render()
      }
    }

    #tick() {
      this.frameIx++
      this.event.frame = this.frameIx

      if (this.frameIx > 1) {
        // skip during initial room transition
        this.runScript(this.gameScript, 'loop')
      }

      if (this.roomTransition) {
        // enter may trigger another goto so clear the vars first!
        const nextRoom = this.roomTransition
        const nextX = this.roomTransitionX
        const nextY = this.roomTransitionY
        this.roomTransition = null
        this.roomTransitionX = null
        this.roomTransitionY = null
        this.#enter(nextRoom, nextX, nextY)
      }
    }

    playCard() {
      if (this.isRunning) {
        warn('Already running')
        return
      }
      this.isRunning = true
      this.loopTimer = setInterval(() => this.#loop(), 1000 / FPS)
    }

    play() {
      // always allow this to capture user gestures
      ZestAudio.enable()

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

      // ENTER starting room in next frame
      this.room = {
        tiles: Array(ROOM_HEIGHT * ROOM_WIDTH).fill(this.namedTiles.black),
      }
      this.roomTransition = this.start

      // START
      this.#changeLoop(this.cart.song)
      this.runScript(this.gameScript, 'start')
      this.#emitEvent('start')

      // loop at 20 FPS (50ms per tick)
      this.loopTimer = setInterval(() => this.#loop(), 1000 / FPS)
      this.#loop()
    }

    stop() {
      if (!this.isRunning) {
        warn('Already stopped')
        return
      }
      this.isRunning = false
      this.isPaused = false
      this.stopMusic()
      clearInterval(this.loopTimer)
      this.loopTimer = null
    }

    pause() {
      if (!this.isRunning || this.isPaused) return
      this.isPaused = true
      this.#clearInput()
      ZestAudio?.pauseSong()
      this.#emitEvent('pause')
    }

    resume() {
      if (!this.isRunning || !this.isPaused) return
      this.isPaused = false
      this.#clearInput()
      ZestAudio?.resumeSong()
      this.#emitEvent('resume')
    }

    pauseResume() {
      if (this.isPaused) {
        this.resume()
      } else {
        this.pause()
      }
      return this.isPaused
    }

    ignore() {
      this.ignoreCount++
      this.isIgnored = true
    }

    listen() {
      this.ignoreCount = Math.max(0, this.ignoreCount - 1)
      this.isIgnored = this.ignoreCount > 0
    }

    getTileAt(x, y) {
      const ix = coordToIndex(x, y)
      return this.room.tiles[ix]
    }

    swapTileAt(x, y, tile) {
      const ix = coordToIndex(x, y)
      delete this.playTimers[ix]
      delete this.frameOverrides[ix]
      this.room.tiles[ix] = tile
    }

    #setFrameAt(x, y, frameIx) {
      const tile = this.getTileAt(x, y)
      if (tile.fps !== 0) return
      const ix = coordToIndex(x, y)
      this.frameOverrides[ix] = clamp(0, frameIx, tile.frames.length - 1)
    }

    #getFrameAt(x, y) {
      const tile = this.getTileAt(x, y)
      const ix = coordToIndex(x, y)
      return (
        this.frameOverrides[ix] ??
        getCurrentFrameIndexForTile(tile, this.frameIx)
      )
    }

    ask(message, options, rect) {
      this.say(
        message,
        () => {
          if (options.length == 0) {
            warn('No options available for ask')
            return
          }
          this.dialogLinkedToMenu = true
          const [sx, sy, sw, sh] = makeWindowRect(rect)
          const w = Math.min(8, Math.max(...options.map((o) => o.label.length)))
          const h = options.length < 6 ? options.length : 4
          const x = sx + sw - w - 2
          const y = sy + sh
          this.menu(options, { x, y, w, h })
        },
        rect
      )
    }

    menu(options, rect = {}) {
      if (options.length == 0) {
        warn('Menu called without any options')
        return
      }

      this.#clearInput()

      const windowSize = [
        rect.x ?? 0,
        rect.y ?? 0,
        rect.w ?? Math.max(...options.map((o) => o.label.length)),
        rect.h ?? options.length,
      ]
      const pages = chunkify(options, windowSize[3])

      this.menuActive = true
      this.menuStack.push({
        windowSize,
        pages,
        cursorIx: 0,
        pageIx: 0,
      })

      this.runScript(this.gameScript, 'change', {
        option: options[0].label,
      })
    }

    #dismissMenu() {
      this.menuStack.pop()
      this.menuActive = this.menuStack.length > 0
    }

    #dismissAllMenus() {
      this.menuStack = []
      this.menuActive = false
      if (this.dialogLinkedToMenu) {
        this.dialogActive = false
      }
    }

    say(message, cb, rect) {
      this.#clearInput()
      this.dialogActive = true
      this.dialogLinkedToMenu = false
      this.dialogWindowSize = makeWindowRect(rect)
      this.dialogPages = wrapText(
        message,
        this.dialogWindowSize[2] / this.charWidth,
        this.dialogWindowSize[3]
      )
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
        if (this.dialogLinkedToMenu) {
          this.dialogActive = true
        }
      }
      return true
    }

    fin(message, pos) {
      this.store()
      this.runScript(this.gameScript, 'finish')
      this.room = {
        tiles: Array(ROOM_HEIGHT * ROOM_WIDTH).fill(this.namedTiles.black),
      }
      this.playTimers = {}
      this.frameOverrides = {}
      this.say(message, () => this.restart(), pos)
      this.#emitEvent('finish')
    }

    #scheduleFrameTimer(cb, frameDelay) {
      const atFrame = this.frameIx + Math.max(1, Math.ceil(frameDelay))
      let list = this.frameTimers[atFrame]
      if (!list) {
        list = []
        this.frameTimers[atFrame] = list
      }
      list.unshift(cb)
    }

    #schedulePlayTimer(ix, opts) {
      this.playTimers[ix] = { tick: 0, frameIx: 0, ...opts }
    }

    #runTimers() {
      Object.entries(this.playTimers).forEach(([k, v]) => {
        if (++v.tick < v.delay) return
        v.tick = 0
        v.frameIx++
        if (v.frameIx >= v.tile.frames.length) {
          delete this.playTimers[k]
          if (v.callback) v.callback()
        } else if (k === 'player') {
          this.player.frameIx = v.frameIx
        } else {
          this.#setFrameAt(v.x, v.y, v.frameIx)
        }
      })

      let list = this.frameTimers[this.frameIx]
      if (!list) return
      list.forEach((cb) => cb())
      delete this.frameTimers[this.frameIx]
    }

    #emitEvent(name, detail) {
      this.dispatchEvent(
        new CustomEvent(name, {
          detail,
        })
      )
    }

    log(message) {
      console.log(`[GAME] ${message}`)
      this.#emitEvent('log', { message })
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
      ZestAudio.playSound(sound)
    }
    bpm(tempo) {
      ZestAudio.setTempo(tempo)
    }
    loopMusic(ref) {
      const song = this.getSong(ref)
      if (this.currentSong == song) return
      ZestAudio.stopSong()
      this.currentSong = song
      ZestAudio.playSong(song, true)
    }
    onceMusic(ref, cb) {
      const song = this.getSong(ref)
      if (this.currentSong == song) return
      ZestAudio.stopSong()
      this.currentSong = song
      ZestAudio.playSong(song, false, () => {
        this.currentSong = null
        cb && cb()
      })
    }
    stopMusic() {
      this.currentSong = null
      ZestAudio.stopSong()
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
            if (name == 'event.px') return this.player.x
            if (name == 'event.py') return this.player.y
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
          const key = parts[1]
          this.config[key] = val
          if (key === 'colorBlack') this.colorBlack = hexToRgba(val)
          if (key === 'colorWhite') this.colorWhite = hexToRgba(val)
          this.#emitEvent('config', { key, value: val })
        } else {
          warn(`Not allowed to set: ${name}`)
        }
      }

      const updateValueOf = (name, update) =>
        setValueOf(name, update(getValueOf(name)))

      const run = (e) => this.runExpression(e, blocks, context)
      const runLater = (e) => {
        this.runExpression(e, blocks, { ...context, ...this.event })
        this.calledDone = false
      }
      const [op, ...args] = expr

      if (op === '_') {
        // ignore, identation maybe?
      } else if (op == '#') {
        // ignore, probably comments
      } else if (op == '#$') {
        // ignore, not sure
      } else if (op === 'block') {
        const body = blocks[args[0]]
        const res = []
        for (let i = 0; i < body.length; i++) {
          if (this.calledDone) return
          res.push(run(body[i]))
        }
        return res.flat()
      } else if (op === 'if') {
        const [condition, iftrue, ...elses] = args
        const res = run(condition)
        if (res) {
          return run(iftrue)
        } else {
          const res = []
          for (let i = 0; i < elses.length; i++) {
            const branch = elses[i]
            if (branch[0] === 'else') {
              res.push(run(branch[1]))
            } else if (branch[0] === 'elseif' && run(branch[1])) {
              res.push(run(branch[2]))
              return res.flat()
            }
          }
          return res.flat()
        }
      } else if (op === 'while') {
        const [condition, body] = args
        const res = []
        while (run(condition)) {
          if (this.calledDone) return
          res.push(run(body))
        }
        return res.flat()
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
        const cb = args[1] && (() => runLater(args[1]))
        const pos = args[2] && run(args[2])
        this.say(msg, cb, pos)
      } else if (op === 'menu') {
        const rect = run(args[0])
        const opts = run(args[1])
        if (Array.isArray(opts)) {
          this.menu(opts.filter(isOption), rect)
        } else {
          warn('Ignored menu call with invalid options block')
        }
      } else if (op === 'ask') {
        const msg = run(args[0])
        const opts = run(args[1])
        const rect = args[2] && run(args[2])
        if (Array.isArray(opts)) {
          this.ask(msg, opts.filter(isOption), rect)
        } else {
          warn('Ignored menu call with invalid options block')
        }
      } else if (op === 'option') {
        return {
          label: run(args[0]),
          action: () => runLater(args[2]),
        }
      } else if (op === 'fin') {
        const msg = run(args[0])
        const pos = args[1] && run(args[1])
        this.fin(msg, pos)
      } else if (op === 'log') {
        this.log?.(run(args[0]))
      } else if (op === 'dump') {
        this.dump(context)
      } else if (op === 'ignore') {
        this.ignore()
      } else if (op === 'listen') {
        this.listen()
      } else if (op === 'type') {
        const who = run(args[0])
        const tile = isXY(who)
          ? this.getTileAt(who.x, who.y)
          : this.getTile(who)
        return TileTypes[tile.type]
      } else if (op === 'solid') {
        const who = run(args[0])
        const tile = isXY(who)
          ? this.getTileAt(who.x, who.y)
          : this.getTile(who)
        return tile.solid ? 1 : 0
      } else if (op === 'id') {
        const who = run(args[0])
        const tile = isXY(who)
          ? this.getTileAt(who.x, who.y)
          : this.getTile(who)
        return tile.id
      } else if (op === 'name') {
        const who = run(args[0])
        const tile = isXY(who)
          ? this.getTileAt(who.x, who.y)
          : this.getTile(who)
        return tile.name
      } else if (op === 'swap') {
        const newTile = this.getTile(run(args[0]))
        const where = args[1] && run(args[1])
        if (isXY(where)) {
          this.swapTileAt(where.x, where.y, newTile)
        } else if (context.self == this.playerScript) {
          delete this.playTimers['player']
          this.player.frameIx = undefined
          this.player.visual = newTile
        } else if (isXY(context)) {
          context.self = newTile?.script
          this.swapTileAt(context.x, context.y, newTile)
        } else {
          fail('Can only call SWAP on a tile instance')
        }
      } else if (op === 'xy') {
        const [x, y] = args
        const xFloat = run(x)
        const yFloat = run(y)
        return { x: xFloat | 0, y: yFloat | 0, xFloat, yFloat }
      } else if (op === 'rect') {
        const [xx, yy, ww, hh] = args
        let xFloat = run(xx)
        let yFloat = run(yy)
        let w = run(ww) | 0
        let h = run(hh) | 0
        if (w < 0) {
          w *= -1
          xFloat -= w
        }
        if (h < 0) {
          h *= -1
          yFloat -= h
        }
        return { x: xFloat | 0, y: yFloat | 0, w, h, xFloat, yFloat }
      } else if (op === 'tell') {
        // parse manually because run() would return the name as string
        const magic = findSpecialGetter(args[0])
        if (magic === 'player') {
          return this.runExpression(args[1], blocks, {
            ...context,
            // x: this.player.x,
            // y: this.player.y,
            tile: this.player.tile.name,
            self: this.playerScript,
          })
        } else if (magic === 'room') {
          return this.runExpression(args[1], blocks, {
            ...context,
            // x: undefined,
            // y: undefined,
            // tile: undefined,
            self: this.room.script,
          })
        } else if (magic === 'game') {
          return this.runExpression(args[1], blocks, {
            ...context,
            // x: undefined,
            // y: undefined,
            // tile: undefined,
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
            tile: tile.name,
            self: tile?.script,
          })
        } else {
          const tile = this.getTile(who)
          return this.runExpression(args[1], blocks, {
            ...context,
            // x: undefined,
            // y: undefined,
            tile: tile.name,
            self: tile?.script,
          })
        }
      } else if (op === 'call') {
        const name = run(args[0])
        if (context.self == this.playerScript) {
          this.#runPlayerScript(name, context)
        } else {
          this.runScript(context.self, name, context)
        }
      } else if (op === 'emit') {
        this.emit(run(args[0]), context)
      } else if (op === 'act') {
        this.act()
      } else if (op === 'mimic') {
        const who = run(args[0])
        const tile = this.getTile(who)
        if (tile.script) {
          this.runScript(tile.script, context.name, {
            ...context,
            self: tile.script,
          })
        } else if (context.name === 'interact') {
          this.#noscriptInteract(tile, context)
        } else if (context.name === 'collect') {
          this.#noscriptCollect(tile, context)
        }
      } else if (op === 'goto') {
        const { x, y } = run(args[0])
        this.goto(x, y, args[1] && run(args[1]))
        if (!args[1]) {
          context.px = x
          context.py = y
        }
      } else if (op === 'wait') {
        const delay = run(args[0]) * FPS
        this.#scheduleFrameTimer(() => runLater(args[1]), delay)
      } else if (op === 'bpm') {
        this.bpm(run(args[0]))
      } else if (op === 'loop') {
        this.loopMusic(run(args[0]))
      } else if (op === 'once') {
        this.onceMusic(run(args[0]), () => runLater(args[1]))
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
      } else if (op === 'hide') {
        this.isHidden = true
      } else if (op === 'window') {
        const { xFloat: x, yFloat: y, w, h } = run(args[0])
        this.#renderWindow(x, y, w, h)
      } else if (op === 'label') {
        const text = run(args[0])
        const pos = run(args[1])
        this.#renderText(text, pos.xFloat, pos.yFloat, pos.w, pos.h)
      } else if (op === 'draw') {
        const who = run(args[0])
        const tile = this.getTile(who)
        const where = run(args[1])
        this.#renderTile(tile, where.xFloat, where.yFloat)
      } else if (op === 'fill') {
        const col = run(args[0])
        const { x, y, w, h } = run(args[1])
        this.#fill(col, x, y, w, h)
      } else if (op === 'crop') {
        const { x, y, w, h } = run(args[0])
        // const cLeft = clamp(0, x, ROOM_WIDTH)
        // const cTop = clamp(0, x, ROOM_HEIGHT)
        // const cRight = clamp(0, cLeft + w, ROOM_WIDTH)
        // const cBottom = clamp(0, cTop + h, ROOM_HEIGHT)
        this.cropArea = [x, y, x + w - 1, y + h - 1]
      } else if (op === 'invert') {
        this.isInverted = !this.isInverted
        return this.isInverted ? 1 : 0
      } else if (op === 'shake') {
        const frames = Math.ceil(run(args[0]) * FPS)
        this.isShaking = true
        this.#scheduleFrameTimer(() => {
          this.isShaking = false
          if (args[1]) runLater(args[1])
        }, frames)
        this.#emitEvent('shake', { duration: frames / FPS })
      } else if (op === 'frame') {
        let frameIx
        if (isDefined(args[0])) {
          frameIx = run(args[0])
          if (isXY(frameIx)) {
            // frame x,y
            return this.#getFrameAt(frameIx.x, frameIx.y)
          }
        }
        if (isDefined(frameIx)) {
          // frame ix
          const frameIx = run(args[0])
          if (context.self == this.playerScript) {
            this.player.frameIx = clamp(
              0,
              frameIx,
              this.player.visual.frames.length - 1
            )
          } else if (isXY(context)) {
            this.#setFrameAt(context.x, context.y, frameIx)
          } else {
            fail('Can only set FRAME on a tile instance')
          }
        } else {
          // frame <no arg>
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
      } else if (op === 'play') {
        const tile = this.getTile(run(args[0]))
        const callback = args[1] && (() => runLater(args[1]))

        const fpsOriginal = tile.fpsOriginal ?? tile.fps
        const delay = FPS / fpsOriginal
        tile.fpsOriginal = fpsOriginal
        tile.fps = 0

        if (context.self == this.playerScript) {
          this.player.visual = tile
          this.player.frameIx = 0
          this.#schedulePlayTimer('player', { tile, delay, callback })
        } else if (isXY(context)) {
          this.swapTileAt(context.x, context.y, tile)
          context.self = tile?.script
          this.#setFrameAt(context.x, context.y, 0)
          this.#schedulePlayTimer(coordToIndex(context.x, context.y), {
            tile,
            delay,
            x: context.x,
            y: context.y,
            callback,
          })
        } else {
          fail('Can only call PLAY on a tile instance')
          return
        }
      } else if (op === 'random') {
        return randomInt(run(args[0]), args[1] && run(args[1]))
      } else if (op === 'sine') {
        return Math.sin(run(args[0]))
      } else if (op === 'cosine') {
        return Math.cos(run(args[0]))
      } else if (op === 'tangent') {
        return Math.tan(run(args[0]))
      } else if (op === 'radians') {
        return (run(args[0]) * Math.PI) / 180
      } else if (op === 'degrees') {
        return (run(args[0]) * 180) / Math.PI
      } else if (op === 'inc') {
        return updateValueOf(args[0], (x) => x + 1)
      } else if (op === 'dec') {
        return updateValueOf(args[0], (x) => x - 1)
      } else if (op === 'add') {
        return updateValueOf(args[0], (x) => x + run(args[1]))
      } else if (op === 'sub') {
        return updateValueOf(args[0], (x) => x - run(args[1]))
      } else if (op === 'mul') {
        return updateValueOf(args[0], (x) => x * run(args[1]))
      } else if (op === 'div') {
        return updateValueOf(args[0], (x) => x / run(args[1]))
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
        fail(`Unknown expression type: ${op}`)
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

    emit(name, context = {}) {
      const { self, ...ctx } = context
      this.runScript(this.gameScript, name, ctx)
      this.runScript(this.room.script, name, ctx)
      this.#runPlayerScript(name, ctx)
      this.room.tiles.slice().forEach((tile, ix) => {
        const [x, y] = indexToCoord(ix)
        this.runScript(tile.script, name, {
          ...ctx,
          x,
          y,
          tile: tile.name,
        })
      })
    }

    // basically emit but player runs AFTER tiles
    // used for 'enter' and 'exit'
    #emitInternally(name) {
      this.runScript(this.gameScript, name)
      this.runScript(this.room.script, name)
      this.room.tiles.slice().forEach((tile, ix) => {
        const [x, y] = indexToCoord(ix)
        this.runScript(tile.script, name, {
          x,
          y,
          tile: tile.name,
        })
      })
      this.#runPlayerScript(name)
    }

    act() {
      const { px, py, dx, dy } = this.event
      const tx = px + dx
      const ty = py + dy
      const target = this.getTileAt(tx, ty)
      if (target) {
        this.#interact(target, tx, ty)
      }
    }

    #interact(target, x, y) {
      const ctx = { tile: target.name, x, y }
      if (target.script) {
        this.runScript(target.script, 'interact', ctx)
      } else {
        this.#noscriptInteract(target, ctx)
      }
    }

    #noscriptInteract(target, ctx) {
      if (isDefined(target.sound)) {
        this.playSound(target.sound)
      }
      if (target.says) {
        const message = this.runExpression(target.says, null, {
          ...this.event,
          ...ctx,
        })
        this.say(message)
      }
    }

    #collect(target, x, y) {
      const ctx = { tile: target.name, x, y }
      if (target.script) {
        this.runScript(target.script, 'collect', ctx)
      } else {
        this.#noscriptCollect(target, ctx)
      }
    }

    #noscriptCollect(target, ctx) {
      const keyName = `${target.name}s`
      const counter = this.globals[keyName] ?? 0
      this.globals[keyName] = counter + 1
      this.room.tiles[coordToIndex(ctx.x, ctx.y)] = this.backgroundTile
      if (isDefined(target.sound)) {
        this.playSound(target.sound)
      }
      if (target.says) {
        const message = this.runExpression(target.says, null, {
          ...this.event,
          ...ctx,
        })
        this.say(message)
      }
    }

    #enter(room, x, y) {
      this.room = room
      this.playTimers = {}
      this.frameOverrides = {}

      this.player.room = this.room.id
      this.event.room = this.room.name

      if (isDefined(x) && isDefined(y)) {
        this.player.x = x
        this.player.y = y
        this.event = {
          ...this.event,
          px: x,
          py: y,
          tx: x,
          ty: y,
        }
      }

      // ENTER event
      this.#changeLoop(this.room.song)
      this.#emitInternally('enter')
    }

    goto(x, y, room) {
      if (isDefined(room)) {
        // EXIT event
        this.#emitInternally('exit')

        this.store()
        this.roomTransition = this.getRoom(room)
        this.roomTransitionX = x
        this.roomTransitionY = y
      } else {
        this.event.px = x
        this.event.py = y
        const ctx = {
          ...this.event,
          tx: x,
          ty: y,
          dx: x - this.player.x,
          dy: y - this.player.y,
        }
        this.player.x = x
        this.player.y = y
        this.#runPlayerScript('update', ctx)
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

      this.event = { ...this.event, dx, dy, tx, ty }

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
          this.#interact(target, tx, ty)
        }
      } else if (target.type == 3) {
        this.#collect(target, tx, ty)
      } else if (!canMove) {
        shouldBump = true // unless there is an exit edge
      }

      this.event.tx = this.player.x + dx
      this.event.ty = this.player.y + dy

      // exit on solid world tile should trigger, but sprite should block
      if (target.type == 2) {
        return
      }

      // check for exits
      for (let i = 0; i < this.room.exits.length; i++) {
        const exit = this.room.exits[i]
        if (isDefined(exit.edge)) {
          if (exit.edge == EdgeDirection.UP) {
            if (prevY == exit.y && dy < 0) {
              this.goto(prevX, exit.ty, exit.room)
              break
            }
          } else if (exit.edge == EdgeDirection.RIGHT) {
            if (prevX == exit.x && dx > 0) {
              this.goto(exit.tx, prevY, exit.room)
              break
            }
          } else if (exit.edge == EdgeDirection.DOWN) {
            if (prevY == exit.y && dy > 0) {
              this.goto(prevX, exit.ty, exit.room)
              break
            }
          } else if (exit.edge == EdgeDirection.LEFT) {
            if (prevX == exit.x && dx < 0) {
              this.goto(exit.tx, prevY, exit.room)
              break
            }
          }
        } else if (tx == exit.x && ty == exit.y) {
          if (exit.fin) {
            this.#changeLoop(exit.song)
            this.fin(exit.fin)
            break
          } else {
            this.goto(exit.tx, exit.ty, exit.room)
            break
          }
        }
      }

      if (shouldBump && !this.roomTransition) {
        this.#runPlayerScript('bump')
      }
    }

    pressKey(key) {
      ZestAudio.enable()
      if (key in this.input) {
        this.input[key].press()
      }
    }
    releaseKey(key) {
      if (key in this.input) {
        this.input[key].release()
      }
    }
    dockCrank() {
      if (this.isCrankDocked) return
      this.isCrankDocked = true
      this.event.aa = 0
      this.event.ra = 0
      this.#runPlayerScript('dock')
      this.#emitEvent('dock')
    }
    undockCrank(aa = 0) {
      if (!this.isCrankDocked) return
      this.isCrankDocked = false
      this.event.aa = aa
      this.event.ra = 0
      this.crankAngle = aa
      this.uiCrankRotated = 0
      this.#runPlayerScript('undock')
      this.#emitEvent('undock')
    }
    turnCrank(aa) {
      if (this.isCrankDocked) return
      this.crankAngle = aa
    }
    // turnCrankBy(ra) {
    //   this.crankAngle += ra
    // }

    openSystemMenu() {
      if (this.isSystemMenuOpen) return
      this.isSystemMenuOpen = true
      this.systemCursorIx = 0
      ZestAudio.pauseSong()
    }

    closeSystemMenu() {
      if (!this.isSystemMenuOpen) return
      this.isSystemMenuOpen = false
      ZestAudio.resumeSong()
    }

    #clearInput() {
      this.input[kButtonUp].clear()
      this.input[kButtonRight].clear()
      this.input[kButtonDown].clear()
      this.input[kButtonLeft].clear()
      this.input[kButtonA].clear()
      this.input[kButtonB].clear()
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
        this.input[kButtonUp].check(
          inputRepeat,
          inputRepeatDelay,
          inputRepeatBetween
        )
      ) {
        dy--
        anythingPressed = true
      }
      if (
        this.input[kButtonDown].check(
          inputRepeat,
          inputRepeatDelay,
          inputRepeatBetween
        )
      ) {
        dy++
        anythingPressed = true
      }
      if (
        this.input[kButtonRight].check(
          inputRepeat,
          inputRepeatDelay,
          inputRepeatBetween
        )
      ) {
        dx++
        anythingPressed = true
      }
      if (
        this.input[kButtonLeft].check(
          inputRepeat,
          inputRepeatDelay,
          inputRepeatBetween
        )
      ) {
        dx--
        anythingPressed = true
      }

      if (this.input[kButtonA].check(0)) {
        anythingPressed = true
        confirmPressed = true
      }
      if (this.input[kButtonB].check(0)) {
        anythingPressed = true
        cancelPressed = true
      }

      if (!this.isRunning || this.isPaused) return

      const aa = this.crankAngle
      this.event.ra = fixAngleDeg(aa - this.event.aa)
      this.event.aa = aa

      if (!this.isCrankDocked) {
        if (this.menuActive || this.isSystemMenuOpen) {
          this.uiCrankRotated += this.event.ra
          if (this.uiCrankRotated >= 90) {
            this.uiCrankRotated -= 90
            dy = 1
            anythingPressed = true
          } else if (this.uiCrankRotated <= -90) {
            this.uiCrankRotated += 90
            dy = -1
            anythingPressed = true
          }
        } else if (this.dialogActive) {
          this.uiCrankRotated += this.event.ra
          if (Math.abs(this.uiCrankRotated) >= 180) {
            this.uiCrankRotated -= 180 * Math.sign(this.uiCrankRotated)
            confirmPressed = true
            anythingPressed = true
          }
        } else if (this.event.ra !== 0) {
          this.#runPlayerScript('crank')
        }
      }

      if (!anythingPressed) return

      if (this.isSystemMenuOpen) {
        this.#handleSystemMenuInput(dx, dy, confirmPressed, cancelPressed)
        this.#clearInput()
        return
      }

      if (this.menuActive) {
        this.#handleMenuInput(dx, dy, confirmPressed, cancelPressed)
        this.#clearInput()
        return
      }

      if (this.advanceSay()) return

      if (this.isIgnored) return

      if (confirmPressed) {
        this.#runPlayerScript('confirm')
      }
      if (cancelPressed) {
        this.#runPlayerScript('cancel')
      }
      if (dx !== 0 || dy !== 0) {
        this.#movePlayer(dx, dy)
      }
    }

    #handleMenuInput(dx, dy, aPress, bPress) {
      const menuDepth = this.menuStack.length
      const menu = this.menuStack[menuDepth - 1]
      const page = menu.pages[menu.pageIx]
      if (aPress) {
        this.runScript(this.gameScript, 'select', {
          option: page[menu.cursorIx].label,
        })
        page[menu.cursorIx].action()
        if (this.menuStack.length == menuDepth) {
          this.#dismissAllMenus()
        }
      } else if (bPress) {
        if (menuDepth > 1 || this.config.allowDismissRootMenu == 1) {
          this.#dismissMenu()
          this.runScript(this.gameScript, 'dismiss')
        } else {
          // @TODO this should only be called for ASK?
          this.runScript(this.gameScript, 'invalid')
        }
      } else if (dx > 0) {
        menu.pageIx = (menu.pageIx + 1) % menu.pages.length
        menu.cursorIx = Math.min(
          menu.cursorIx,
          menu.pages[menu.pageIx].length - 1
        )
      } else if (dx < 0) {
        menu.pageIx = (menu.pageIx - 1 + menu.pages.length) % menu.pages.length
        menu.cursorIx = Math.min(
          menu.cursorIx,
          menu.pages[menu.pageIx].length - 1
        )
      } else if (dy > 0) {
        menu.cursorIx = (menu.cursorIx + 1) % page.length
      } else if (dy < 0) {
        menu.cursorIx = (menu.cursorIx - 1 + page.length) % page.length
      }

      if (dx !== 0 || dy !== 0) {
        this.runScript(this.gameScript, 'change', {
          option: menu.pages[menu.pageIx][menu.cursorIx].label,
        })
      }
    }

    #handleSystemMenuInput(dx, dy, aPress, bPress) {
      if (aPress) {
        const onSelect = this.systemMenuOptions[this.systemCursorIx].action
        if (onSelect) {
          onSelect()
          this.closeSystemMenu()
        }
      } else if (bPress) {
        this.closeSystemMenu()
      } else if (dx != 0) {
        if (this.systemCursorIx === 0) {
          this.volume = clamp(0, this.volume + dx * 10, 100)
          ZestAudio?.setVolume(this.volume / 100)
        }
      } else if (dy > 0) {
        this.systemCursorIx = wrap(
          this.systemCursorIx + 1,
          this.systemMenuOptions.length
        )
      } else if (dy < 0) {
        this.systemCursorIx = wrap(
          this.systemCursorIx - 1,
          this.systemMenuOptions.length
        )
      }
    }

    #fill(col, x, y, w, h) {
      // if (col !== 'white' && col !== 'black') {
      //   warn(`Unknown colour '${col}' passed to fill`)
      //   return
      // }

      const [r, g, b, a] =
        (col == 'white') !== this.isInverted ? this.colorWhite : this.colorBlack
      const right = x + w
      const bottom = y + h

      const data = this.imgData.data
      for (let py = y; py < bottom; py++) {
        for (let px = x; px < right; px++) {
          const pi = 4 * (px + py * PIXEL_WIDTH)
          data[pi] = r
          data[pi + 1] = g
          data[pi + 2] = b
          data[pi + 3] = a
        }
      }
    }

    #renderTile(tile, x, y) {
      return this.#renderFrame(getCurrentFrameForTile(tile, this.frameIx), x, y)
    }

    #renderFrame(frame, x, y, halfWidth = 1) {
      if (!frame) {
        warn('Missing bitmap data in renderFrame')
        return
      }

      const xx = (8 * x) | 0
      const yy = (8 * y) | 0

      const data = this.imgData.data
      const cBlack = this.isInverted ? this.colorWhite : this.colorBlack
      const cWhite = this.isInverted ? this.colorBlack : this.colorWhite

      // assumes 8x8 frames in Array(64)
      for (let i = 0; i < 64; i++) {
        const col = frame[i]
        if (col == 2) continue // transparent
        if (i % 8 >= halfWidth * 8) continue
        const [r, g, b, a] = col == 1 ? cBlack : cWhite

        const px = xx + (i % 8)
        const py = yy + ((i / 8) | 0)
        const pi = 4 * (px + py * PIXEL_WIDTH)

        data[pi] = r
        data[pi + 1] = g
        data[pi + 2] = b
        data[pi + 3] = a
      }
    }

    #renderWindow(x, y, w, h, arrowIx) {
      const left = x
      const right = x + w - 1
      const top = y
      const bottom = y + h - 1

      // top left/right corner
      this.#renderFrame(this.cart.font.pipe[0], left, top)
      this.#renderFrame(this.cart.font.pipe[2], right, top)

      // horizontal border
      for (let xx = left + 1; xx < right; xx++) {
        this.#renderFrame(this.cart.font.pipe[1], xx, top)
        this.#renderFrame(this.cart.font.pipe[7], xx, bottom)
      }

      // vertical border
      for (let yy = top + 1; yy < bottom; yy++) {
        this.#renderFrame(this.cart.font.pipe[3], left, yy)
        this.#renderFrame(this.cart.font.pipe[5], right, yy)
      }

      // bottom left/right corner
      this.#renderFrame(this.cart.font.pipe[6], left, bottom)
      this.#renderFrame(this.cart.font.pipe[8], right, bottom)

      // arrow or pagination glyph
      if (arrowIx) {
        this.#renderFrame(this.cart.font.pipe[arrowIx], right - 1, bottom)
      }

      // background fill
      for (let yy = top + 1; yy < bottom; yy++) {
        for (let xx = left + 1; xx < right; xx++) {
          this.#renderFrame(this.cart.font.pipe[4], xx, yy)
        }
      }
    }

    #renderSayText(x, y, w, h) {
      let xx = x
      let yy = y
      let text = this.dialogText.substring(0, this.dialogTextIx)

      for (let i = 0; i < text.length; i++) {
        let glyph = text.charCodeAt(i)
        if (xx > x + w || glyph == 10) {
          xx = x
          yy++
        }
        if (glyph == 10) continue // ignore nl (prewrapped text)
        const frame =
          (glyph > 128
            ? this.cart.tiles[glyph - 128]?.frames[0]
            : this.cart.font.chars[glyph - 32]) ?? this.cart.font.chars[0]
        this.#renderFrame(frame, xx, yy, this.charWidth)
        xx += this.charWidth
      }
    }

    #renderText(text, x, y, w, h) {
      let xx = x
      let yy = y
      const maxX = isDefined(w) ? x + w : ROOM_WIDTH
      const maxY = isDefined(h) ? y + h : ROOM_HEIGHT

      for (let i = 0; i < text.length; i++) {
        let glyph = text.charCodeAt(i)
        if (glyph == 10) {
          xx = x
          yy++
          if (yy > maxY) return
        }
        if (xx > maxX) continue
        if (glyph == 10 || glyph == 12) continue // skip nl and ff
        const frame =
          (glyph > 128
            ? this.cart.tiles[glyph - 128]?.frames[0]
            : this.cart.font.chars[glyph - 32]) ?? this.cart.font.chars[0]
        this.#renderFrame(frame, xx, yy, this.charWidth)
        xx += this.charWidth
      }
    }

    #renderFrameToImageData(img, frame, x, y) {
      const data = img.data
      const width = img.width

      const black = this.colorBlack
      const white = this.colorWhite

      // assumes 8x8 frames in Array(64)
      for (let i = 0; i < 64; i++) {
        const [r, g, b, a] = frame[i] == 1 ? black : white

        const px = x + (i % 8)
        const py = y + ((i / 8) | 0)
        const pi = 4 * (px + py * width)

        data[pi] = r
        data[pi + 1] = g
        data[pi + 2] = b
        data[pi + 3] = a
      }
    }

    getRoomImageData(room, x = 0, y = 0, w = ROOM_WIDTH, h = ROOM_HEIGHT) {
      if (!room) return
      const black = this.colorBlack
      const white = this.colorWhite
      const img = new ImageData((w * 8) | 0, (h * 8) | 0)
      for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
          const ix = coordToIndex(x + dx, y + dy)
          const frame = room.tiles[ix].frames[0]
          this.#renderFrameToImageData(img, frame, (dx * 8) | 0, (dy * 8) | 0)
        }
      }
      return img
    }

    getCardImageData() {
      return this.getRoomImageData(this.card)
    }

    getWrapImageData() {
      return this.getRoomImageData(this.wrap)
    }

    getIconImageData() {
      return this.getRoomImageData(this.icon, 1, 2, 2, 2)
    }

    render() {
      const inPlayerRoom = this.room.id == this.player.room
      const [cLeft, cTop, cRight, cBottom] = this.cropArea

      let camX = 0
      let camY = 0
      let overflowFrame
      if (this.config.follow === 1 && inPlayerRoom) {
        camX = this.config.followCenterX - this.player.x
        camY = this.config.followCenterY - this.player.y
        overflowFrame = getCurrentFrameForTile(
          this.namedTiles[this.config.followOverflowTile],
          this.frameIx
        )
      }

      // room background
      for (let y = 0; y < ROOM_HEIGHT; y++) {
        for (let x = 0; x < ROOM_WIDTH; x++) {
          let frame
          if (x < cLeft || x > cRight || y < cTop || y > cBottom) {
            frame = BLACK_FRAME
          } else if (
            x < camX ||
            x >= ROOM_WIDTH + camX ||
            y < camY ||
            y >= ROOM_HEIGHT + camY
          ) {
            frame = overflowFrame
          } else {
            const ix = coordToIndex(x - camX, y - camY)
            const tile = this.room.tiles[ix]
            frame =
              tile.frames[
                this.frameOverrides[ix] ??
                  getCurrentFrameIndexForTile(tile, this.frameIx)
              ]
          }
          this.#renderFrame(frame, x, y)
        }
      }

      // display player
      if (this.isRunning && inPlayerRoom) {
        this.isHidden = false
        this.#runPlayerScript('draw')
        if (!this.isHidden) {
          const playerFrame = isDefined(this.player.frameIx)
            ? this.player.visual.frames[this.player.frameIx]
            : getCurrentFrameForTile(this.player.visual, this.frameIx)

          this.#renderFrame(
            playerFrame,
            this.player.x + camX,
            this.player.y + camY
          )
        }
      }

      // draw window
      if (this.dialogActive) {
        const [wx, wy, ww, wh] = this.dialogWindowSize
        const showArrow = this.dialogTextIx >= this.dialogText.length
        const arrowIx =
          PipeIndex.PROMPT + (Math.floor(this.dialogFrameIx / 10) % 2)
        this.#renderWindow(wx, wy, ww + 2, wh + 2, showArrow && arrowIx)
        this.#renderSayText(wx + 1, wy + 1, ww, wh)
      }

      // draw menu (stacking)
      if (this.menuActive) {
        const lastIx = this.menuStack.length - 1
        this.menuStack.forEach((menu, ix) => {
          const [wx, wy, ww, wh] = menu.windowSize
          const showArrow = menu.pages.length > 1
          this.#renderWindow(
            wx,
            wy,
            ww + 3,
            wh + 2,
            showArrow && PipeIndex.PAGES
          )
          const lines = menu.pages[menu.pageIx]
          for (let i = 0; i < lines.length; i++) {
            this.#renderText(
              lines[i].label,
              wx + 2,
              wy + 1 + i,
              ww / this.charWidth
            )
          }
          this.#renderFrame(
            this.cart.font.pipe[
              ix == lastIx ? PipeIndex.CURSOR : PipeIndex.CURSOR_INACTIVE
            ],
            wx + 1,
            wy + 1 + menu.cursorIx
          )
        })
      }

      // draw system menu
      if (this.isSystemMenuOpen) {
        const [wx, wy, ww, wh] = [5, 5, 15, 5]
        this.#renderWindow(wx, wy, ww, wh, false) // PipeIndex.PAGES

        for (let i = 0; i < this.systemMenuOptions.length; i++) {
          let label = this.systemMenuOptions[i].label
          if (i === 0) {
            label += ': ' + this.volume.toString().padStart(3, ' ') + '%'
          }
          this.#renderText(label, wx + 2, wy + 1 + i, ww, 1)
        }

        this.#renderFrame(
          this.cart.font.pipe[PipeIndex.CURSOR],
          wx + 1,
          wy + 1 + this.systemCursorIx
        )
      }

      if (this.ctx2d) {
        this.renderToCanvas(this.imgData)
      }
    }

    renderToCanvas(img) {
      let [shakeX, shakeY] = [0, 0]
      if (this.isShaking && !this.menuActive && !this.dialogActive) {
        ;[shakeX, shakeY] = [randomInt(-2, 2), randomInt(-2, 2)]
      }
      this.ctx2d.clearRect(0, 0, PIXEL_WIDTH, PIXEL_HEIGHT)
      this.ctx2d.putImageData(img, shakeX, shakeY)
    }
  }

  Zest.kButtonUp = kButtonUp
  Zest.kButtonRight = kButtonRight
  Zest.kButtonDown = kButtonDown
  Zest.kButtonLeft = kButtonLeft
  Zest.kButtonA = kButtonA
  Zest.kButtonB = kButtonB
  Zest.kButtonCrank = kButtonCrank

  return Zest
})()
