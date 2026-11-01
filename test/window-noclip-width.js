import test from './test.js'
import data from './window-noclip-width.json' with { type: 'json' }

const { play, snapshot, done } = test(data)

play()
snapshot('window-noclip-width')
done()
