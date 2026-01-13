window.addEventListener('load', () => {
  // load and start the game
  const lcd = document.getElementById('lcd')
  const game = Zest.run(gameData, lcd)

  // display cartridge info
  document.getElementById('label-title').innerText = game.meta.name
  document.getElementById('label-author').innerText = game.meta.author

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
})
