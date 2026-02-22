ZEST_SWITCHER_GAMES = {
  'ware-wolf-collab': JSON.parse(JSON.stringify(gameData)),
}

Zest.register((game) => {
  game.addEventListener('store', (e) => {
    const goto = e.detail?.data?.['gotoPDX']
    if (goto && goto in ZEST_SWITCHER_GAMES) {
      game.run(ZEST_SWITCHER_GAMES[goto])
    }
  })
})
