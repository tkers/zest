const fs = require('fs')
const path = require('path')

const CleanCSS = require('clean-css')
const minifyCss = (css) => new CleanCSS().minify(css).styles

const Terser = require('terser')
const minifyJs = (js) => Terser.minify(js).then((res) => res.code)

const read = (fname) => fs.readFileSync(path.resolve(__dirname, fname), 'utf8')

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

  fs.writeFileSync(
    path.resolve(__dirname, '../assets/mjs/bundlerTemplate.js'),
    `export const template = ${JSON.stringify(compiled)}`
  )
})
