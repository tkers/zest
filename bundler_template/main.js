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

  // register play button
  if (!autoplay) {
    const clickStart = () => {
      main.removeEventListener('click', clickStart)
      main.className = 'clicked'
      game.play()
    }
    main.addEventListener('click', clickStart)
  }

  // attach keyboard
  game.attachKeyboard(ZEST_KEY_MAP)

  // window.addEventListener('contextmenu', (e) => {
  //   e.preventDefault()
  // })

  // attach virtual gamepad
  ;[
    document.getElementById('btn-u'),
    document.getElementById('btn-r'),
    document.getElementById('btn-d'),
    document.getElementById('btn-l'),
    document.getElementById('btn-a'),
    document.getElementById('btn-b'),
    null,
    document.getElementById('btn-m'),
  ].map((btn, ix) => {
    if (!btn) return
    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault()
    })
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      game.pressKey(ix + 1)
    })
    btn.addEventListener('pointerup', (e) => {
      e.preventDefault()
      game.releaseKey(ix + 1)
    })
  })
})
