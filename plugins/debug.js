Zest.register((game) => {
  window.dump = () => game.dump()
  window.setConfig = (k, v) => game.runExpression(['set', `config.${k}`, v])
  window.setColors = (b, w) => {
    game.runExpression(['set', 'config.colorBlack', b])
    game.runExpression(['set', 'config.colorWhite', w])
  }

  console.log(`[ZEST] Debug functions available:
       - dump()
       - setConfig(key, value)
       - setColors(black, white)
  `)
})
