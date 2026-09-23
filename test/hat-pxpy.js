import test from './test.js'
import data from './hat-pxpy.json' with { type: 'json' }

const { play, tap, snapshot, done } = test(data)

play()
await tap(BTN_RIGHT)
await tap(BTN_RIGHT)
snapshot('hat-pxpy')
done()
