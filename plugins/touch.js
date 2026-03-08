Zest.register((game) => {
  const SWIPE_DEADZONE = 24

  let touchDownX = null
  let touchDownY = null
  let touchDownC = -1
  let keyDown = null

  const handleTouchStart = (evt) => {
    const firstTouch = evt.touches[0]
    touchDownX = firstTouch.clientX
    touchDownY = firstTouch.clientY
    touchDownC = evt.touches.length
  }

  const handleTouchMove = (evt) => {
    if (touchDownX === null || touchDownY === null) {
      return
    }

    if (touchDownC > 1) return

    const touch = evt.changedTouches[0]
    const touchMoveX = touch.clientX
    const touchMoveY = touch.clientY

    const dx = touchMoveX - touchDownX
    const dy = touchMoveY - touchDownY

    let nextKey
    if (dx > SWIPE_DEADZONE) nextKey = Zest.kButtonRight
    else if (dx < -SWIPE_DEADZONE) nextKey = Zest.kButtonLeft
    else if (dy > SWIPE_DEADZONE) nextKey = Zest.kButtonDown
    else if (dy < -SWIPE_DEADZONE) nextKey = Zest.kButtonUp
    else return

    if (nextKey === keyDown) return

    if (keyDown) {
      game.releaseKey(keyDown)
    }
    game.pressKey(nextKey)
    keyDown = nextKey

    touchDownX = touchMoveX
    touchDownY = touchMoveY
  }

  const handleTouchEnd = (evt) => {
    if (touchDownX === null || touchDownY === null) {
      return
    }

    const prevKey = keyDown
    const wasDouble = touchDownC >= 2

    touchDownX = null
    touchDownY = null
    touchDownC = -1
    keyDown = null

    if (prevKey) {
      game.releaseKey(prevKey)
    } else if (wasDouble) {
      game.pressKey(Zest.kButtonB)
      game.releaseKey(Zest.kButtonB)
    } else {
      game.pressKey(Zest.kButtonA)
      game.releaseKey(Zest.kButtonA)
    }
  }

  game.canvas?.addEventListener('touchstart', handleTouchStart, false)
  game.canvas?.addEventListener('touchmove', handleTouchMove, false)
  game.canvas?.addEventListener('touchend', handleTouchEnd, false)
})
