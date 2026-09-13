globalThis.ZestAudio = null
globalThis.ImageData = function (w, h) {
  this.width = w
  this.height = h
  this.data = []
}
const noop = () => {}
globalThis.localStorage = {
  setItem: noop,
  getItem: noop,
  deleteItem: noop,
}

const print = console.log
console.log = noop

import '../core/zest.js'

const color = {
  red: (x) => `\x1b[31m${x}\x1b[0m`,
  green: (x) => `\x1b[32m${x}\x1b[0m`,
  magenta: (x) => `\x1b[35m${x}\x1b[0m`,
  cyan: (x) => `\x1b[36m${x}\x1b[0m`,
}

// const fname = '../_demo/paco-lily.json'
// const { default: data } = await import(fname, { with: { type: 'json' } })

const TIMEOUT_DELAY = 5000
const test = (data) => {
  const zest = Zest.load(data)

  // zest.config.allowBackgroundAnimation = 1

  const timeout = setTimeout(() => zest.stop(), TIMEOUT_DELAY)
  const abort = () => {
    zest.stop()
    clearTimeout(timeout)
  }

  const ok = (msg) => print(`${color.green('[ OK ]')} ${msg}`)
  const fail = (msg) => {
    print(`${color.red('[FAIL]')} ${msg}`)
    abort()
    process.exit(1)
  }

  const messages = []
  const expectations = []
  const expect = async (x) =>
    new Promise((resolve) => {
      expectations.push([x.trim(), resolve])
      compareLogMessages()
    })

  let isListening = true
  const ignore = () => {
    isListening = false
  }
  const listen = () => {
    isListening = true
  }

  const done = () => {
    if (expectations.length > 0) {
      fail(
        `Ended early, expected ${expectations.length} more log message${expectations.length > 1 ? 's' : ''}!\n${expectations.map((m, i) => `${i + 1}. ${color.magenta(m[0])}`).join('\n')}`
      )
    } else if (messages.length > 0) {
      fail(
        `Received ${messages.length} extra log message${messages.length > 1 ? 's' : ''}!\n${messages.map((m, i) => `${i + 1}. ${color.cyan(m)}`).join('\n')}`
      )
    } else {
      print('\nAll done!')
      abort()
      process.exit(0)
    }
  }

  const compareLogMessages = () => {
    if (expectations.length === 0 || messages.length === 0) return

    const message = messages.shift()
    const [expected, resolve] = expectations.shift()
    if (message !== expected) {
      fail(
        `Mismatch in log message!\nExpected: ${color.magenta(expected)}\n  Actual: ${color.cyan(message)}`
      )
    } else {
      ok(message)
    }
    resolve()
  }

  zest.addEventListener('log', (e) => {
    if (!isListening) return
    const message = e.detail.message.trim()
    messages.push(message)

    compareLogMessages()
  })

  const tap = async (key) => {
    zest.pressKey(key)
    zest.releaseKey(key)
    return new Promise((resolve) => {
      setTimeout(resolve, 50) // 1000ms / 20fps
    })
  }

  const wait = async (frames = 1) => {
    return new Promise((resolve) => {
      setTimeout(resolve, frames * 50) // 1000ms / 20fps
    })
  }

  const play = () => {
    print(`Running spec: ${zest.meta.name} (${zest.meta.author})...`)
    zest.play()
  }

  return {
    tap,
    wait,
    expect,
    done,
    play,
    restart: () => zest.restart(),
    listen,
    ignore,
  }
}

globalThis.BTN_UP = Zest.kButtonUp
globalThis.BTN_DOWN = Zest.kButtonDown
globalThis.BTN_LEFT = Zest.kButtonLeft
globalThis.BTN_RIGHT = Zest.kButtonRight
globalThis.BTN_A = Zest.kButtonA
globalThis.BTN_B = Zest.kButtonB

export default test
