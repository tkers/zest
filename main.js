window.addEventListener('load', () => {
  Zest.run(gameData)

  const btn = document.getElementById('btn-snap')
  btn.addEventListener('click', () => {
    const ts = Date.now()
    btn.download = `zest-snap-${ts}.png`
    btn.href = document.getElementById('lcd').toDataURL()
  })
})
