import test from './test.js'
import data from './menu-overflow.json' with { type: 'json' }

const { play, snapshot, done } = test(data)

play()
// await wait(5)
snapshot('menu-overflow')
done()
