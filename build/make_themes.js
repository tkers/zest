import { readFileSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'
import CleanCSS from 'clean-css'

const themes = [
  { name: 'Yellow', file: 'yellow.css', type: 'Classic' },
  { name: 'Purple', file: 'purple.css', type: 'Classic' },
  { name: 'Aqua', file: 'aqua.css', type: 'Classic' },
  { name: 'Pink', file: 'pink.css', type: 'Classic' },
  { name: 'Glass', file: 'glass.css', type: 'Classic' },
  {
    name: 'Pacific',
    file: 'pacific.css',
    type: 'Editions',
  },
  {
    name: 'Cosmic',
    file: 'cosmic.css',
    type: 'Editions',
  },
  {
    name: 'Neapolitan',
    file: 'neapolitan.css',
    type: 'Editions',
  },
  {
    name: 'Mocha',
    file: 'mocha.css',
    type: 'Editions',
  },
  { name: 'Café', file: 'cafe.css', type: 'Editions' },
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
