Zest.register((game) => {
  // window.addEventListener('contextmenu', (e) => {
  //   e.preventDefault()
  // })

  ;[
    document.getElementById('btn-u'),
    document.getElementById('btn-r'),
    document.getElementById('btn-d'),
    document.getElementById('btn-l'),
    document.getElementById('btn-a'),
    document.getElementById('btn-b'),
    null,
    document.getElementById('btn-m'),
  ].map((btn, ix) => {
    if (!btn) return
    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault()
    })
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      game.pressKey(ix + 1)
    })
    btn.addEventListener('pointerup', (e) => {
      e.preventDefault()
      game.releaseKey(ix + 1)
    })
  })

  document.body.classList.add('with-virtual')
})
