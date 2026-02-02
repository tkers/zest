const getDroppedFiles = (e) =>
  [...e.dataTransfer.items].filter((item) => item.kind === 'file')

const getDroppedJSON = (e) =>
  getDroppedFiles(e)
    .filter((item) => item.type == 'application/json')
    .map((item) => item.getAsFile())
    .filter((file) => file)?.[0]

window.addEventListener('load', () => {
  const lcd = document.getElementById('lcd')
  const titleLabel = document.getElementById('label-title')
  const authorLabel = document.getElementById('label-author')

  // load and start the demo game
  const game = Zest.load(gameData, lcd)
  let isRunning = false
  const startGame = () => {
    ZestAudio.enable()
    if (!isRunning) {
      isRunning = true
      game.play()
    }
  }
  lcd.addEventListener('click', startGame)
  setTimeout(startGame, 2400)

  // update cartridge info
  titleLabel.innerText = game.meta.name || 'untitled'
  authorLabel.innerText = game.meta.author || 'anonymous'

  game.attachKeyboard({ z: Button.B, x: Button.A })
  attachTouchGestures(lcd)

  game.addEventListener('pause', () => (lcd.className = 'paused'))
  game.addEventListener('resume', () => (lcd.className = ''))
  window.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
      e.preventDefault()
      game.pauseResume()
    }
  })

  Object.entries({
    '#k-u': Button.UP,
    '#k-r': Button.RIGHT,
    '#k-d': Button.DOWN,
    '#k-l': Button.LEFT,
    '#k-a': Button.A,
    '#k-b': Button.B,
  }).forEach(([query, keyCode]) => {
    const btn = document.querySelector(query)
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault()
      game.pressKey(keyCode)
    })
    btn.addEventListener('touchend', () => {
      game.releaseKey(keyCode)
    })
  })

  document.querySelector('#k-m').addEventListener('touchstart', (e) => {
    e.preventDefault()
  })

  // snapshow button
  // const btn = document.getElementById('btn-snap')
  // btn.addEventListener('click', () => {
  //   const ts = Date.now()
  //   btn.download = `zest-snap-${ts}.png`
  //   btn.href = lcd.toDataURL()
  // })

  // theme buttons
  document.getElementById('btn-lemon').addEventListener('click', () => {
    document.body.className = 'lemon'
  })
  document.getElementById('btn-plum').addEventListener('click', () => {
    document.body.className = 'plum'
  })
  document.getElementById('btn-mint').addEventListener('click', () => {
    document.body.className = 'mint'
  })

  // accept dropping files on canvas
  lcd.addEventListener('dragover', (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  })

  lcd.addEventListener('drop', (e) => {
    e.preventDefault()
    const file = getDroppedJSON(e)
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const data = JSON.parse(reader.result)
      game.load(data)
      titleLabel.innerText = game.meta.name || 'untitled'
      authorLabel.innerText = game.meta.author || 'anonymous'
      setTimeout(() => game.play(), 1200)
    }
    reader.onerror = () => {
      console.log('[ERROR] Failed to load dropped file')
    }
    reader.readAsText(file)
  })

  // prevent accidentally dropping files in window
  window.addEventListener('drop', (e) => {
    e.preventDefault()
  })

  window.addEventListener('dragover', (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = lcd.contains(e.target) ? 'copy' : 'none'
  })
})
