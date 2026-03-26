import { template } from './bundlerTemplate.js'
import { plugins } from './bundlerPlugins.js'
import { minify } from './minify.js'

const pluginsByFile = Object.fromEntries(
  plugins.map((plugin) => [plugin.file, plugin.src])
)

const getPluginCode = (pluginFiles = []) =>
  pluginFiles.map((file) => pluginsByFile[file] ?? '').join('\n')

export function estimateSize(gameData, pluginFiles) {
  const pluginCode = getPluginCode(pluginFiles)
  return (
    template.length +
    pluginCode.length +
    JSON.stringify(minify(gameData)).length
  )
}

const kButtonUp = 1
const kButtonRight = 2
const kButtonDown = 3
const kButtonLeft = 4
const kButtonA = 5
const kButtonB = 6
const kButtonCrank = 7

const keyboard_wasd = {
  KeyW: kButtonUp,
  KeyA: kButtonLeft,
  KeyS: kButtonDown,
  KeyD: kButtonRight,
  Comma: kButtonB,
  Period: kButtonA,
  Slash: kButtonCrank,
}

const keyboard_hjkl = {
  KeyH: kButtonLeft,
  KeyJ: kButtonDown,
  KeyK: kButtonUp,
  KeyL: kButtonRight,
}
const keyboard_as = {
  KeyA: kButtonB,
  KeyS: kButtonA,
  KeyD: kButtonCrank,
}

const keyboard_mappers = {
  'arrow-zx': {},
  'arrow-as': keyboard_as,
  'wasd-,.': keyboard_wasd,
  'hjkl-as': { ...keyboard_hjkl, ...keyboard_as },
}

export function bundle({
  autoplay,
  color,
  title,
  meta,
  keymap,
  plugins,
  gameData,
}) {
  const vAutoplay = autoplay ? 'clicked' : ''
  const vColor = color ?? '#808080'
  const vTitle = title ?? 'Zest game'
  const vMetatags = meta ?? ''
  const vKeymap = JSON.stringify(keyboard_mappers[keymap] ?? {})
  const vPlugins = getPluginCode(plugins)
  const vGame = JSON.stringify(gameData ? minify(gameData) : {})

  return template
    .replace('{{AUTOPLAY}}', vAutoplay)
    .replace('{{COLOR}}', vColor)
    .replace('{{TITLE}}', vTitle)
    .replace('{{META_TAGS}}', vMetatags)
    .replace('{{KEYMAP}}', vKeymap)
    .replace('{{PLUGIN_SRC}}', vPlugins)
    .replace('{{GAME}}', vGame)
}
