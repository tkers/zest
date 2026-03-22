Zest.register((game) => {
  // this depends on the specific HTML layout used by the bundler
  const main = document.getElementsByTagName('main')[0]
  if (!main) return

  main.style.backgroundColor = '#312f28'
  game.addEventListener('config', (e) => {
    if (e.detail.key === 'colorBlack') {
      main.style.backgroundColor = e.detail.value
    }
  })
})
