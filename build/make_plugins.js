import { readFileSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'
import * as Terser from 'terser'

const plugins = [
  {
    name: 'Touch',
    file: 'touch.js',
    info: 'Enables touch controls for mobile',
    enabled: true,
  },
  {
    name: 'Gamepad',
    file: 'gamepad.js',
    info: 'Enables gamepad support (including crank with right analog stick)',
    enabled: true,
  },
  {
    name: 'Seamless Borders',
    file: 'seamless.js',
    info: "Matches the screen borders to the game's color palette",
    enabled: true,
  },
  {
    name: 'Integer Scaling',
    file: 'intscale.js',
    info: 'Forces integer scaling to avoid distorted pixels',
  },
  {
    name: 'A/B Keys',
    file: 'ab.js',
    info: 'Adds extra (layout-dependent) key bindings for the A and B buttons',
  },
  {
    name: 'Mousewheel Crank',
    file: 'mousewheel.js',
    info: 'Enables using the mousewheel to crank',
  },
  {
    name: 'Open URL',
    file: 'openurl.js',
    info: 'Allows opening popups by logging "@open {url}"',
  },
  {
    name: 'Tauri',
    file: 'tauri.js',
    info: 'Configures keyboard shortcuts for running with Tauri',
  },
]

const resolvePath = (fname) => resolve(import.meta.dirname, fname)
const read = (fname) => readFileSync(resolvePath(fname), 'utf8')
const minifyJs = (js) => Terser.minify(js).then((res) => res.code)

const pluginList = Promise.all(
  plugins.map(async (plugin) => {
    const body = read(join('../plugins', plugin.file))
    return minifyJs(body).then((src) => ({ ...plugin, src }))
  })
)

pluginList.then((list) => {
  writeFileSync(
    resolvePath('../assets/mjs/bundlerPlugins.js'),
    `export const plugins = ${JSON.stringify(list)}`
  )
})
