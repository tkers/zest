Zest.register((game) => {
  window.addEventListener('keydown', (e) => {
    if (e.code != 'Space' || ZEST_KEY_MAP[e.code]) return
    e.preventDefault()
    game.pressKey(Zest.kButtonA)
  })

  window.addEventListener('keyup', (e) => {
    if (e.code != 'Space' || ZEST_KEY_MAP[e.code]) return
    e.preventDefault()
    game.releaseKey(Zest.kButtonA)
  })
})
