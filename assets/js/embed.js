window.addEventListener('load', () => {
  const main = document.getElementsByTagName('main')[0]
  const lcd = document.getElementById('lcd')
  const autoplay = main.className == 'clicked'

  // integer scale the canvas
  const w = lcd.width
  const h = lcd.height
  function lcdScale(canvas) {
    const wScale = Math.floor(window.innerWidth / w)
    const hScale = Math.floor(window.innerHeight / h)
    const scale = Math.max(1, Math.min(wScale, hScale))
    lcd.style.width = `${scale * w}px`
    lcd.style.height = `${scale * h}px`
  }
  window.addEventListener('resize', lcdScale)
  lcdScale()

  // load and start the game
  Zest.prototype.log = null
  const game = autoplay ? Zest.run(gameData, lcd) : Zest.load(gameData, lcd)
  main.addEventListener('click', () => {
    ZestAudio.enable()
  })

  main.style.backgroundColor = game.config.colorBlack
  game.addEventListener('config', (e) => {
    if (e.detail.key === 'colorBlack') {
      main.style.backgroundColor = e.detail.value
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

  game.attachKeyboard()
})
