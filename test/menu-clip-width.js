import test from './test.js'
import data from './menu-clip-width.json' with { type: 'json' }

const { play, snapshot, done } = test(data)

play()
snapshot('menu-clip-width')
done()
