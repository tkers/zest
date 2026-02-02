window.addEventListener('load', () => {
  const main = document.getElementsByTagName('main')[0]
  const lcd = document.getElementById('lcd')

  // load and start the game
  const game = Zest.load(gameData, lcd)

  const clickStart = () => {
    main.removeEventListener('click', clickStart)
    main.className = 'clicked'
    ZestAudio.enable()
    game.play()
  }
  main.addEventListener('click', clickStart)

  game.attachKeyboard()
  if (typeof attachTouchGestures != 'undefined') {
    attachTouchGestures(lcd)
  }
})
