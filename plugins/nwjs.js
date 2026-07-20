/*
This replaces the "Fullscreen" option for "Exit game"
in the system menu. This is mainly intended for Steam Deck
builds, where toggling fullscreen is not really needed
(and NW.JS has some issues with the default toggle behaviour)
and a way to quit the game might be more desired instead.
*/

Zest.register((game) => {
  const exitAction = () => nw.App.quit()
  game.systemMenuOptions[1] = { label: 'Exit Game', action: exitAction }
})
