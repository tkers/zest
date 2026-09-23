import test from './test.js'
import data from '../_demo/paco-lily.json' with { type: 'json' }

const { play, tap, wait, snapshot, done } = test(data)

play()

await tap(BTN_RIGHT)
await tap(BTN_RIGHT)
await tap(BTN_RIGHT)

await tap(BTN_DOWN)
await tap(BTN_DOWN)
await tap(BTN_DOWN)
await tap(BTN_DOWN)
await tap(BTN_DOWN)
await tap(BTN_DOWN)

await wait(1) // wait for room transition
snapshot('paco-lily-pond')

done()
