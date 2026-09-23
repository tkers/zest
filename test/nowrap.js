import test from './test.js'
import data from './nowrap.json' with { type: 'json' }

const { play, ignore, snapshot, done } = test(data)

ignore()
play()
snapshot('nowrap')
done()
