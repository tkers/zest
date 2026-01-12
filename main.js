window.addEventListener('load', () => {
  Zest.run(gameData)

  const btn = document.getElementById('btn-snap')
  btn.addEventListener('click', () => {
    const ts = Date.now()
    btn.download = `zest-snap-${ts}.png`
    btn.href = document.getElementById('lcd').toDataURL()
  })

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
