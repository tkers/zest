import test from './test.js'
import data from './tell-wrap.json' with { type: 'json' }

const { play, snapshot, done } = test(data)

play()
snapshot('tell-wrap')
done()
