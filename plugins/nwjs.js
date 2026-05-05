Zest.register((game) => {
  const resetAction = () => {
    game.toss()
    game.restart()
  }

  const exitAction = () => {
    // nw.App.closeAllWindows()
    nw.App.quit()
  }

  game.systemMenuOptions[1] = { label: 'Reset data', action: resetAction }
  game.systemMenuOptions[2] = { label: 'Exit game', action: exitAction }
})
