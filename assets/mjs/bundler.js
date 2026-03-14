import { template } from './bundlerTemplate.js'

const deepCopy = (x) => JSON.parse(JSON.stringify(x))
function minify(original) {
  const gameData = deepCopy(original)
  delete gameData.editor
  gameData.scripts.forEach((script) => {
    delete script?.data?.__comments
    delete script?.data?.__srcOrder
  })
  return gameData
}

export function estimateSize(gameData) {
  return template.length + JSON.stringify(minify(gameData)).length
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

export function bundle({ autoplay, color, title, meta, keymap, gameData }) {
  const vAutoplay = autoplay ? 'clicked' : ''
  const vColor = color ?? '#808080'
  const vTitle = title ?? 'Zest game'
  const vMetatags = meta ?? ''
  const vKeymap = JSON.stringify(keyboard_mappers[keymap] ?? {})
  const vGame = JSON.stringify(gameData ? minify(gameData) : {})

  return template
    .replace('{{AUTOPLAY}}', vAutoplay)
    .replace('{{COLOR}}', vColor)
    .replace('{{TITLE}}', vTitle)
    .replace('{{META_TAGS}}', vMetatags)
    .replace('{{KEYMAP}}', vKeymap)
    .replace('{{GAME}}', vGame)
}
