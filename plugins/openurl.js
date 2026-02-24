Zest.register((game) => {
  game.addEventListener('log', (e) => {
    const { message } = e.detail
    if (message.startsWith('@open ')) {
      const url = message.slice(6)
      window.open(url)
    }
  })
})
