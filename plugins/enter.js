Zest.register((game) => {
  window.addEventListener('keydown', (e) => {
    if (e.code != 'Enter' || ZEST_KEY_MAP[e.code]) return
    e.preventDefault()
    game.pressKey(Zest.kButtonMenu)
  })

  window.addEventListener('keyup', (e) => {
    if (e.code != 'Enter' || ZEST_KEY_MAP[e.code]) return
    e.preventDefault()
    game.releaseKey(Zest.kButtonMenu)
  })
})
