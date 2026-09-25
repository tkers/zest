import test from './test.js'
import data from './ask-max-width.json' with { type: 'json' }

const { play, wait, tap, snapshot, done } = test(data)

play()
await wait(5)
await tap(BTN_DOWN)
snapshot('ask-max-width')
done()
