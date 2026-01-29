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

  attachTouchGestures(lcd)

  // load and start the demo game
  const game = Zest.load(gameData, lcd)
  let isRunning = false
  lcd.addEventListener('click', () => {
    ZestAudio.enable()
    if (!isRunning) {
      isRunning = true
      game.play()
    }
  })

  // update cartridge info
  titleLabel.innerText = game.meta.name || 'untitled'
  authorLabel.innerText = game.meta.author || 'anonymous'

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
    if (e.key == ' ') {
      const isPaused = game.pauseResume()
      lcd.className = isPaused ? 'paused' : ''
    }
  })

  window.addEventListener('keyup', (e) => {
    if (e.key == 'ArrowUp') game.releaseKey(Button.UP)
    if (e.key == 'ArrowDown') game.releaseKey(Button.DOWN)
    if (e.key == 'ArrowLeft') game.releaseKey(Button.LEFT)
    if (e.key == 'ArrowRight') game.releaseKey(Button.RIGHT)
    if (e.key == 'a') game.releaseKey(Button.B)
    if (e.key == 's') game.releaseKey(Button.A)
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
