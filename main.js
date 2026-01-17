const getDroppedFiles = (e) =>
  [...e.dataTransfer.items].filter((item) => item.kind === 'file')

const getDroppedJSON = (e) =>
  getDroppedFiles(e)
    .filter((item) => item.type == 'application/json')
    .map((item) => item.getAsFile())
    .filter((file) => file)?.[0]

// prevent accidentally dropping files in window
window.addEventListener('drop', (e) => {
  if (getDroppedFiles(e).length > 0) {
    e.preventDefault()
  }
})

window.addEventListener('dragover', (e) => {
  if (getDroppedFiles(e).length > 0) {
    e.preventDefault()
    if (!lcd.contains(e.target)) {
      e.dataTransfer.dropEffect = 'none'
    }
  }
})

window.addEventListener('load', () => {
  const lcd = document.getElementById('lcd')
  const titleLabel = document.getElementById('label-title')
  const authorLabel = document.getElementById('label-author')

  // load and start the demo game
  const game = Zest.load(gameData, lcd)
  setTimeout(() => game.play(), 1200)

  window.addEventListener('keydown', (e) => {
    if (e.key == 'ArrowUp') game.pressUp()
    if (e.key == 'ArrowDown') game.pressDown()
    if (e.key == 'ArrowLeft') game.pressLeft()
    if (e.key == 'ArrowRight') game.pressRight()
    if (e.key == 'a') game.pressB()
    if (e.key == 's') game.pressA()
    if (e.key == ' ') {
      const isPaused = game.pauseResume()
      lcd.className = isPaused ? 'paused' : ''
    }
  })

  // update cartridge info
  titleLabel.innerText = game.meta.name
  authorLabel.innerText = game.meta.author

  // snapshow button
  const btn = document.getElementById('btn-snap')
  btn.addEventListener('click', () => {
    const ts = Date.now()
    btn.download = `zest-snap-${ts}.png`
    btn.href = lcd.toDataURL()
  })

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
    const files = getDroppedFiles(e)
    if (files.length == 0) return
    e.preventDefault()
    e.dataTransfer.dropEffect = files.some(
      (file) => file.type == 'application/json'
    )
      ? 'copy'
      : 'none'
  })

  lcd.addEventListener('drop', (e) => {
    e.preventDefault()
    const file = getDroppedJSON(e)
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const data = JSON.parse(reader.result)
      game.loadCart(data)
      titleLabel.innerText = game.meta.name
      authorLabel.innerText = game.meta.author
      setTimeout(() => game.play(), 1200)
    }
    reader.onerror = () => {
      console.log('[ERROR] Failed to load dropped file')
    }
    reader.readAsText(file)
  })
})
