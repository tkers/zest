Zest.register((game) => {
  const SWIPE_DEADZONE = 16

  let touchDownX = null
  let touchDownY = null
  let touchDownC = -1
  const handleTouchStart = (evt) => {
    const firstTouch = evt.touches[0]
    touchDownX = firstTouch.clientX
    touchDownY = firstTouch.clientY
    touchDownC = evt.touches.length
  }

  const handleTouchEnd = (evt) => {
    if (touchDownX === null || touchDownY === null) {
      return
    }

    const endTouch = evt.changedTouches[0]
    const dx = touchDownX - endTouch.clientX
    const dy = touchDownY - endTouch.clientY
    const wasDouble = touchDownC >= 2

    touchDownX = null
    touchDownY = null
    touchDownC = -1

    if (wasDouble) {
      emulateKeyPress(Button.B)
      return
    }

    const adx = Math.abs(dx)
    const ady = Math.abs(dy)
    if (adx < SWIPE_DEADZONE && ady < SWIPE_DEADZONE) {
      emulateKeyPress(Button.A)
      return
    }

    if (adx > ady) {
      emulateKeyPress(dx > 0 ? Button.LEFT : Button.RIGHT)
    } else {
      emulateKeyPress(dy > 0 ? Button.UP : Button.DOWN)
    }
  }

  const emulateKeyPress = (key) => {
    game.pressKey(key)
    setTimeout(() => game.releaseKey(key), 1)
  }

  game.canvas?.addEventListener('touchstart', handleTouchStart, false)
  game.canvas?.addEventListener('touchend', handleTouchEnd, false)
})
