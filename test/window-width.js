import test from './test.js'
import data from './window-width.json' with { type: 'json' }

const { play, snapshot, done } = test(data)

play()
snapshot('window-width')
done()
