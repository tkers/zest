Zest.register((game) => {
  let angle = 0

  window.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault()
      if (game.isCrankDocked) game.undockCrank(angle)
      angle += e.deltaY
      while (angle > 360) angle -= 360
      while (angle < 0) angle += 360
      game.turnCrank(angle)
    },
    { passive: false }
  )

  window.addEventListener('mousedown', (e) => {
    if (e.button === 1) {
      e.preventDefault()
      if (game.isCrankDocked) {
        game.undockCrank(angle)
      } else {
        game.dockCrank()
      }
    }
  })
})
