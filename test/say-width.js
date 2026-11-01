import test from './test.js'
import data from './say-width.json' with { type: 'json' }

const { play, wait, snapshot, done } = test(data)

play()
await wait(4)
snapshot('say-width')
done()
