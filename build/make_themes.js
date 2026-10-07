import { readFileSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'
import CleanCSS from 'clean-css'

const themes = [
  { name: 'Yellow', file: 'yellow.css', type: 'Classic' },
  { name: 'Purple', file: 'purple.css', type: 'Classic' },
  { name: 'Aqua', file: 'aqua.css', type: 'Classic' },
  { name: 'Pink', file: 'pink.css', type: 'Classic' },
  { name: 'Café', file: 'cafe.css', type: 'Special' },
]

const resolvePath = (fname) => resolve(import.meta.dirname, fname)
const read = (fname) => readFileSync(resolvePath(fname), 'utf8')
const minifyCss = (css) => new CleanCSS().minify(css).styles

const themeList = themes.map((theme) => ({
  ...theme,
  css: minifyCss(read(join('../bundler_themes', theme.file))),
}))

writeFileSync(
  resolvePath('../assets/mjs/bundlerThemes.js'),
  `/* auto-generated code; DO NOT EDIT */
export const themes = ${JSON.stringify(themeList)}`
)
