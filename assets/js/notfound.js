window.addEventListener('load', () => {
  const game = Zest.run(plData, document.getElementById('lcd'))
  game.goto(7, 3, 'lilypond')
})
