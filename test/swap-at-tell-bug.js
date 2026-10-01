import test from './test.js'
import data from './swap-at-tell-bug.json' with { type: 'json' }

const { play, skip, snapshot, done } = test(data)

skip()

play()
snapshot('swap-at-tell-bug')
done()
