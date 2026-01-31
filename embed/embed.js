window.addEventListener('load', () => {
  const main = document.getElementsByTagName('main')[0]
  const lcd = document.getElementById('lcd')

  if (typeof attachTouchGestures != 'undefined') {
    attachTouchGestures(lcd)
  }

  // load and start the game
  const game = Zest.load(gameData, lcd)

  const clickStart = () => {
    main.removeEventListener('click', clickStart)
    main.className = 'clicked'
    ZestAudio.enable()
    game.play()
  }
  main.addEventListener('click', clickStart)

  // setup key bindings
  window.addEventListener('keydown', (e) => {
    if (e.key.startsWith('Arrow')) {
      e.preventDefault()
    }

    if (e.repeat) return

    if (e.key == 'ArrowUp') game.pressKey(Button.UP)
    if (e.key == 'ArrowDown') game.pressKey(Button.DOWN)
    if (e.key == 'ArrowLeft') game.pressKey(Button.LEFT)
    if (e.key == 'ArrowRight') game.pressKey(Button.RIGHT)
    if (e.key == 'a') game.pressKey(Button.B)
    if (e.key == 's') game.pressKey(Button.A)
  })

  window.addEventListener('keyup', (e) => {
    if (e.key == 'ArrowUp') game.releaseKey(Button.UP)
    if (e.key == 'ArrowDown') game.releaseKey(Button.DOWN)
    if (e.key == 'ArrowLeft') game.releaseKey(Button.LEFT)
    if (e.key == 'ArrowRight') game.releaseKey(Button.RIGHT)
    if (e.key == 'a') game.releaseKey(Button.B)
    if (e.key == 's') game.releaseKey(Button.A)
  })
})
