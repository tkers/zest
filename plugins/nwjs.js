Zest.register((game) => {
  const exitAction = () => {
    // nw.App.closeAllWindows()
    nw.App.quit()
  }

  game.systemMenuOptions[2] = { label: 'Exit game', action: exitAction }
})
