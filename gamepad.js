Zest.register((game) => {
  const ANALOG_TRESHOLD = 0.3
  const DOCK_TRESHOLD = 0.5
  const CRANK_TRESHOLD = 0.02
  const GamepadButton = {
    B: 0,
    A: 1,
    Y: 2,
    X: 3,
    L1: 4,
    R1: 5,
    L2: 6,
    R2: 7,
    SELECT: 8,
    START: 9,
    L3: 10,
    R3: 11,
    UP: 12,
    DOWN: 13,
    LEFT: 14,
    RIGHT: 15,
    HOME: 16,
  }
  const GamepadAxis = {
    LEFT_HORIZONTAL: 0,
    LEFT_VERTICAL: 1,
    RIGHT_HORIZONTAL: 2,
    RIGHT_VERTICAL: 3,
  }

  let gamepad
  window.addEventListener('gamepadconnected', (e) => {
    gamepad = e.gamepad
    console.log(`Gamepad ${gamepad.index + 1} connected: ${gamepad.id}`)
  })

  game.addEventListener('shake', (e) => {
    gamepad?.vibrationActuator?.playEffect('dual-rumble', {
      startDelay: 0,
      duration: e.detail.duration * 1000,
      weakMagnitude: 0.5,
      strongMagnitude: 0.5,
    })
  })

  const prevBtns = {}
  const mapButton = (gpButton, zestButton) => {
    const state = gpButton?.pressed
    if (prevBtns[zestButton] == state) return
    prevBtns[zestButton] = state

    if (state) game.pressKey(zestButton)
    else game.releaseKey(zestButton)
  }

  const prevAxes = {}
  const mapAxis = (gpAxis, zestNeg, zestPos) => {
    const stateNeg = gpAxis < -ANALOG_TRESHOLD
    if (prevAxes[zestNeg] != stateNeg) {
      prevAxes[zestNeg] = stateNeg
      if (stateNeg) game.pressKey(zestNeg)
      else game.releaseKey(zestNeg)
    }
    const statePos = gpAxis > ANALOG_TRESHOLD
    if (prevAxes[zestPos] != statePos) {
      prevAxes[zestPos] = statePos
      if (statePos) game.pressKey(zestPos)
      else game.releaseKey(zestPos)
    }
  }

  const PI_2 = Math.PI * 2
  const normalizeAngle = (angle) => {
    if (angle > Math.PI) return angle - PI_2
    else if (angle < -Math.PI) return angle + PI_2
    else return angle
  }

  const radToDeg = (angle) => (angle * 180) / Math.PI

  let wasDocked = true
  let prevAngle = 0
  const simulateCrank = (x, y) => {
    const r = Math.hypot(x, y)
    if (r < DOCK_TRESHOLD) {
      if (!wasDocked) {
        game.dockCrank()
      }
      wasDocked = true
    } else {
      const absAngle = Math.PI + Math.atan2(y, x)
      if (wasDocked) {
        game.undockCrank(absAngle)
        wasDocked = false
      } else {
        let relAngle = normalizeAngle(absAngle - prevAngle)
        if (Math.abs(relAngle) > CRANK_TRESHOLD) {
          game.turnCrank(radToDeg(absAngle), radToDeg(relAngle))
        }
      }
      prevAngle = absAngle
    }
  }

  function updateGamepadInput() {
    const gamepad = navigator.getGamepads()?.[0]
    if (gamepad) {
      const gpButtons = gamepad.buttons
      const gpAxes = gamepad.axes

      mapButton(gpButtons[GamepadButton.B], Button.B)
      mapButton(gpButtons[GamepadButton.A], Button.A)
      mapButton(gpButtons[GamepadButton.UP], Button.UP)
      mapButton(gpButtons[GamepadButton.DOWN], Button.DOWN)
      mapButton(gpButtons[GamepadButton.LEFT], Button.LEFT)
      mapButton(gpButtons[GamepadButton.RIGHT], Button.RIGHT)

      mapAxis(gpAxes[1], Button.UP, Button.DOWN)
      mapAxis(gpAxes[0], Button.LEFT, Button.RIGHT)

      simulateCrank(gpAxes[2], gpAxes[3])

      const startState = gpButtons[GamepadButton.START]?.pressed
      if (prevBtns['start'] !== startState) {
        prevBtns['start'] = startState
        if (startState) game.pauseResume()
      }
    }
    requestAnimationFrame(updateGamepadInput)
  }

  updateGamepadInput()
})
