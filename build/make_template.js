import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import CleanCSS from 'clean-css'
import * as Terser from 'terser'

const resolvePath = (fname) => resolve(import.meta.dirname, fname)
const read = (fname) => readFileSync(resolvePath(fname), 'utf8')
const minifyCss = (css) => new CleanCSS().minify(css).styles
const minifyJs = (js) => Terser.minify(js).then((res) => res.code)

const html = read('../bundler_template/index.html')
const css = read('../bundler_template/style.css')
const js = [
  '../bundler_template/main.js',
  '../core/zest.js',
  '../core/audio.js',
  '../plugins/touch.js',
  '../plugins/gamepad.js',
]
  .map(read)
  .join('\n')

minifyJs(js).then((minjs) => {
  const compiled = html
    .replace(/^\s+/gm, '')
    .replace(/\n/g, '')
    .replace('{{INLINE_CSS}}', minifyCss(css))
    .replace('{{INLINE_JS}}', minjs)

  const outFile = resolvePath('../assets/mjs/bundlerTemplate.js')
  writeFileSync(outFile, `export const template = ${JSON.stringify(compiled)}`)
  console.log(`Created template at ${outFile}`)
})
