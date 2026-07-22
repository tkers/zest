Zest.register((game) => {
  window.addEventListener('keydown', (e) => {
    if (e.code != 'Enter' || ZEST_KEY_MAP[e.code]) return
    if (e.repeat || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
    e.preventDefault()
    game.pressKey(Zest.kButtonMenu)
  })

  window.addEventListener('keyup', (e) => {
    if (e.code != 'Enter' || ZEST_KEY_MAP[e.code]) return
    if (e.repeat || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
    e.preventDefault()
    game.releaseKey(Zest.kButtonMenu)
  })
})
