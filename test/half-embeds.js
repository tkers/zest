import test from './test.js'
import data from './half-embeds.json' with { type: 'json' }

const { play, wait, snapshot, done } = test(data)

play()
await wait(1)
snapshot('half-embeds')
done()
