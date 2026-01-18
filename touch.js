let touchDownX = null
let touchDownY = null

const handleTouchStart = (evt) => {
  const firstTouch = evt.touches[0]
  touchDownX = firstTouch.clientX
  touchDownY = firstTouch.clientY
}

const handleTouchMove = (evt) => {
  if (!touchDownX || !touchDownY) {
    return
  }

  const dx = touchDownX - evt.touches[0].clientX
  const dy = touchDownY - evt.touches[0].clientY
  if (Math.abs(dx) > Math.abs(dy)) {
    emulateKeyPress(dx > 0 ? 'ArrowLeft' : 'ArrowRight')
  } else {
    emulateKeyPress(dy > 0 ? 'ArrowUp' : 'ArrowDown')
  }

  touchDownX = null
  touchDownY = null
}

const emulateKeyPress = (key) => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key }))
  setTimeout(() => {
    window.dispatchEvent(new KeyboardEvent('keyup', { key }))
  }, 50)
}

document.addEventListener('touchstart', handleTouchStart, false)
document.addEventListener('touchmove', handleTouchMove, false)
