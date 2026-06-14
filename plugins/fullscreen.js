Zest.register((game) => {
  const toggleFullscreen = (elem) =>
    document.fullscreenElement
      ? document.exitFullscreen?.()
      : elem?.requestFullscreen({ keyboardLock: 'browser' })

  //   document.addEventListener('fullscreenchange', () => {
  //     const val = document.fullscreenElement ? 'Y' : 'N'
  //     game.systemMenuOptions[1].label = `Fullscreen: ${val}`
  //   })

  game.systemMenuOptions[1] = game.systemMenuOptions[1] = {
    label: 'Fullscreen',
    action: () => toggleFullscreen(document.documentElement),
  }
})
