import test from './test.js'
import data from './load-goto-room.json' with { type: 'json' }

const { play, expect, snapshot, done } = test(data)

play()
snapshot('load-goto-room')
expect('game/enter battle')
expect('battle/enter battle')
expect('player/enter battle')
done()
