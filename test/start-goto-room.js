import test from './test.js'
import data from './start-goto-room.json' with { type: 'json' }

const { play, expect, snapshot, done } = test(data)

play()
snapshot('start-goto-room')
expect('game/enter battle')
expect('battle/enter battle')
expect('player/enter battle')
done()
