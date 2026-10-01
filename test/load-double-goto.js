import test from './test.js'
import data from './load-double-goto.json' with { type: 'json' }

const { play, skip, expect, snapshot, done } = test(data)

skip()

play()
snapshot('load-double-goto')
expect('game/enter card')
expect('player/enter card')
expect('player/enter battle')
expect('player/enter battle')
expect('player/enter battle')
done()
