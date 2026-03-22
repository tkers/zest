Zest.register((game) => {
  const lcd = game.canvas
  const w = lcd.width
  const h = lcd.height

  function lcdScale() {
    const wScale = Math.floor(window.innerWidth / w)
    const hScale = Math.floor(window.innerHeight / h)
    const scale = Math.max(1, Math.min(wScale, hScale))
    lcd.style.width = `${scale * w}px`
    lcd.style.height = `${scale * h}px`
  }

  window.addEventListener('resize', lcdScale)
  lcdScale()
})
