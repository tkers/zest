import test from './test.js'
import data from './fill-wrap.json' with { type: 'json' }

const { play, snapshot, done } = test(data)

play()
snapshot('fill-wrap')
done()
