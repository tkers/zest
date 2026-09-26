import { readdirSync, readFileSync } from 'fs'
import { extname, join } from 'path'
import color from './utils/color.js'
import { pack, unpack } from '../assets/mjs/packer.js'

const { dirname } = import.meta
const files = readdirSync(dirname).filter((path) => extname(path) === '.json')

for (const fname of files) {
  const body = readFileSync(join(dirname, fname))
  const data = JSON.parse(body)

  const packedAndUnpackedData = unpack(pack(data))

  if (JSON.stringify(packedAndUnpackedData) !== JSON.stringify(data)) {
    console.log(`${color.red('[FAIL]')} compress ${fname}`)
    process.exit(1)
  }
}

console.log(
  `${color.green('[ OK ]')} lossless frame compression (${files.length} files verified)`
)
