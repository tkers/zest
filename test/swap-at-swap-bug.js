import test from './test.js'
import data from './swap-at-swap-bug.json' with { type: 'json' }

const { play, skip, snapshot, done } = test(data)

skip()

play() // on sim/device this actually crashes!
snapshot('swap-at-swap-bug')
done()
