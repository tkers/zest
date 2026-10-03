import test from './test.js'
import data from './wait-goto-skip.json' with { type: 'json' }

const { skip, play, expect, tap, wait, snapshot, done } = test(data)

skip()

play()
expect('Enter start')

await tap(BTN_A)
await wait(2)
expect('Exit start')
expect('Enter alpha')
expect('Exit alpha')
expect('Enter bravo')

await tap(BTN_A)
await wait(2)
expect('Exit bravo')
expect('Enter alpha')
snapshot('wait-goto-skip-1') // does not go back into bravo!

await tap(BTN_A)
await wait(2)
expect('Exit alpha')
expect('Enter bravo')
snapshot('wait-goto-skip-2') // ignores first goto alpha

done()
