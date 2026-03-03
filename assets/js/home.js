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
  const game = new Zest(lcd) // Zest.run(gameData, lcd)
  lcd.addEventListener('click', () => ZestAudio.enable())
  lcd.addEventListener('dblclick', () => lcd.parentElement.requestFullscreen())

  setTimeout(() => {
    const btnId = ['btn-lemon', 'btn-plum', 'btn-mint'][
      Math.floor(Math.random() * 3)
    ]
    document.getElementById(btnId).click()
  }, 0)

  game.attachKeyboard({
    KeyZ: Zest.kButtonB,
    KeyX: Zest.kButtonA,
    KeyC: Zest.kButtonCrank,
  })

  game.addEventListener('pause', () => (lcd.className = 'paused'))
  game.addEventListener('resume', () => (lcd.className = ''))
  window.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
      e.preventDefault()
      game.pauseResume()
    } else if (e.key === 'R') {
      e.preventDefault()
      game.restart()
    } else if (e.key === 'F') {
      lcd.parentElement.requestFullscreen()
    }
  })

  // theme buttons
  document.getElementById('btn-lemon').addEventListener('click', () => {
    game.run(dkData)
    titleLabel.innerText = 'Hall of the Dwarf King'
    authorLabel.innerHTML =
      '<a href="https://ledbetter-games.itch.io" target="_blank">Ledbetter Games</a>'
    document.body.className = 'lemon'
  })
  document.getElementById('btn-plum').addEventListener('click', () => {
    game.run(wwData)
    titleLabel.innerText = 'Witch Ware'
    authorLabel.innerHTML =
      '<a href="https://orkn.itch.io" target="_blank">orkn</a> & <a href="https://samplay.itch.io" target="_blank">Samplay</a>'
    document.body.className = 'plum'
  })
  document.getElementById('btn-mint').addEventListener('click', () => {
    game.run(plData)
    titleLabel.innerText = 'Paco & Lily'
    authorLabel.innerHTML =
      '<a href="https://tkers.itch.io" target="_blank">Tijn Kersjes</a>'
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
      game.run(data)
      titleLabel.innerText = game.meta.name || 'untitled'
      authorLabel.innerText = game.meta.author || 'anonymous'
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
