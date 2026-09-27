import test from './test.js'
import data from './goto-dxdy.json' with { type: 'json' }

const { play, tap, wait, expect, snapshot, done } = test(data)

play()
await tap(BTN_RIGHT)
await tap(BTN_RIGHT)
expect('[UPDATE] xy:13,7 / txty:13,7 / dxdy:1,0 / pxpy:13,7')
expect('[UPDATE] xy:14,7 / txty:14,7 / dxdy:1,0 / pxpy:14,7')
await wait(1)
expect('[UPDATE] xy:18,7 / txty:0,0 / dxdy:-1,0 / pxpy:18,7')
snapshot('goto-dxdy')
done()
