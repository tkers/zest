window.addEventListener('load', () => {
  const main = document.getElementsByTagName('main')[0]
  const lcd = document.getElementById('lcd')
  const autoplay = main.className == 'clicked'

  // load and start the game
  Zest.prototype.log = null
  const game = autoplay ? Zest.run(gameData, lcd) : Zest.load(gameData, lcd)
  main.addEventListener('click', () => {
    ZestAudio.enable()
  })

  game.addEventListener('config', (e) => {
    if (e.detail.key === 'colorBlack') {
      lcd.style.backgroundColor = e.detail.value
    }
  })

  if (!autoplay) {
    const clickStart = () => {
      main.removeEventListener('click', clickStart)
      main.className = 'clicked'
      game.play()
    }
    main.addEventListener('click', clickStart)
  }

  game.attachKeyboard(ZEST_KEY_MAP)
})
