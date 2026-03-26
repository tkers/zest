Zest.register((game) => {
  const keymap = {
    a: Zest.kButtonA,
    b: Zest.kButtonB,
  }

  window.addEventListener('keydown', (e) => {
    // key is bound already
    if (ZEST_KEY_MAP[e.code]) return

    const btn = keymap[e.key]
    if (btn) {
      e.preventDefault()
      game.pressKey(btn)
    }
  })

  window.addEventListener('keyup', (e) => {
    // key is bound already
    if (ZEST_KEY_MAP[e.code]) return

    const btn = keymap[e.key]
    if (btn) {
      e.preventDefault()
      game.releaseKey(btn)
    }
  })
})
