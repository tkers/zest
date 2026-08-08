Zest.register((game) => {
  window.setConfig = (k, v) => game.runExpression(['set', `config.${k}`, v])
  window.setColors = (b, w) => {
    game.runExpression(['set', 'config.colorBlack', b])
    game.runExpression(['set', 'config.colorWhite', w])
  }

  console.log(`[ZEST] Debug functions available:
       - setConfig(key, value)
       - setColors(black, white)
  `)
})
