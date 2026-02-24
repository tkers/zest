if (typeof ZEST_SWITCHER_GAMES === 'undefined') {
  ZEST_SWITCHER_GAMES = {}
}

Zest.register((game) => {
  game.addEventListener('store', (e) => {
    const goto = e.detail?.data?.['gotoPDX']
    if (goto && goto in ZEST_SWITCHER_GAMES) {
      game.run(ZEST_SWITCHER_GAMES[goto])
    }
  })
})
