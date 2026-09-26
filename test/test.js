import crypto from 'crypto'
const hash = (x) =>
  crypto.createHash('SHA1').update(x).digest('hex').substring(0, 10)

import fs from 'fs'
import path from 'path'
const pathFor = (...x) => path.resolve(import.meta.dirname, ...x)
const readFile = (fname) =>
  fs.existsSync(fname) ? fs.readFileSync(fname, 'utf8') : null
const writeFile = (fname, data) => {
  fs.mkdirSync(path.dirname(fname), { recursive: true })
  fs.writeFileSync(fname, data)
}

import pngjs from './utils/png.js'
const pngFromImageData = (imageData) => {
  const { width, height, data } = imageData
  const png = new pngjs.PNG({ width, height })
  png.data.set(data)
  return pngjs.PNG.sync.write(png)
}

const print = console.log
console.log = () => {}

import color from './utils/color.js'
import './utils/mocks.js'
import '../core/zest.js'

const TIMEOUT_DELAY = 5000
const test = (data) => {
  const zest = Zest.load(data)

  let logCount = 0
  let snapCount = 0

  const timeout = setTimeout(() => zest.stop(), TIMEOUT_DELAY)
  const abort = () => {
    zest.stop()
    clearTimeout(timeout)
  }

  const ok = (msg) => print(`${color.green('[ OK ]')} ${msg}`)
  const warn = (msg) => print(`${color.yellow('[WARN]')} ${msg}`)
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
      // print('\nAll done!')
      ok(
        `${zest.meta.name} (${[
          logCount > 0 && `${logCount} log messages`,
          snapCount > 0 && `${snapCount} snapshots`,
          logCount + snapCount == 0 && 'new',
        ]
          .filter(Boolean)
          .join(',')})`
      )
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
      // ok(message)
      logCount++
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

  const snapshot = (name) => {
    const frames = new Error().stack.split('\n')
    const caller = frames[2].split('/').pop()
    const specName = name ?? hash(caller)
    const fname = pathFor('_snapshots', `${specName}.png`)
    const expectedSnap = readFile(fname)
    const actualSnap = pngFromImageData(zest.imgData)

    // const imgData = JSON.stringify(zest.imgData.data)
    // const actualSnap = `<html>
    //   <canvas id="lcd" width="200" height="120" style="image-rendering:pixelated;width:100%;height:100%;object-fit:contain;"></canvas>
    //   <script type="text/javascript">
    //     const ctx = document.getElementById('lcd').getContext('2d')
    //     const img = ctx.createImageData(200, 120)
    //     img.data.set(${imgData})
    //     ctx.putImageData(img, 0, 0);
    //   </script>
    //   </html>`

    if (!expectedSnap) {
      warn(`Created new snapshot for ${caller}`)
      writeFile(fname, actualSnap)
    } else if (expectedSnap == actualSnap) {
      // ok(`Snapshot ${caller}`)
      snapCount++
    } else {
      const aname = pathFor('_snapshots', `${specName}_actual.png`)
      writeFile(aname, actualSnap)
      fail(`Snapshot mismatch at ${caller}\n       ${aname}`)
    }
  }

  const play = () => {
    // print(`Running spec: ${zest.meta.name} (${zest.meta.author})...`)
    zest.play()
  }

  return {
    tap,
    wait,
    expect,
    snapshot,
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
