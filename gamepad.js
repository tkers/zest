window.addEventListener('gamepadconnected', (e) => {
  const gamepad = e.gamepad
  console.log(`Gamepad ${gamepad.index + 1} connected: ${gamepad.id}`)

  game.addEventListener('shake', (e) => {
    gamepad?.vibrationActuator?.playEffect('dual-rumble', {
      startDelay: 0,
      duration: e.detail.duration * 1000,
      weakMagnitude: 0.5,
      strongMagnitude: 0.5,
    })
  })
})

const ANALOG_TRESHOLD = 0.3
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

const emulateKeyDown = (key) =>
  window.dispatchEvent(new KeyboardEvent('keydown', { key }))

const emulateKeyUp = (key) =>
  window.dispatchEvent(new KeyboardEvent('keyup', { key }))

const prevBtns = {}
const pollButton = (name, button) => {
  const state = button?.pressed
  if (prevBtns[name] == state) return
  prevBtns[name] = state

  if (state) emulateKeyDown(name)
  else emulateKeyUp(name)
}

const prevAxes = {}
const pollStick = (name, state) => {
  if (prevAxes[name] == state) return
  prevAxes[name] = state

  if (state) emulateKeyDown(name)
  else emulateKeyUp(name)
}

function updateGamepadInput() {
  const gamepad = navigator.getGamepads()?.[0]
  if (gamepad) {
    pollButton('a', gamepad.buttons[GamepadButton.B])
    pollButton('s', gamepad.buttons[GamepadButton.A])
    pollButton(' ', gamepad.buttons[GamepadButton.START])

    pollButton('ArrowUp', gamepad.buttons[GamepadButton.UP])
    pollButton('ArrowDown', gamepad.buttons[GamepadButton.DOWN])
    pollButton('ArrowLeft', gamepad.buttons[GamepadButton.LEFT])
    pollButton('ArrowRight', gamepad.buttons[GamepadButton.RIGHT])

    pollStick('ArrowUp', gamepad.axes[1] < -ANALOG_TRESHOLD)
    pollStick('ArrowDown', gamepad.axes[1] > ANALOG_TRESHOLD)
    pollStick('ArrowLeft', gamepad.axes[0] < -ANALOG_TRESHOLD)
    pollStick('ArrowRight', gamepad.axes[0] > ANALOG_TRESHOLD)
  }
  requestAnimationFrame(updateGamepadInput)
}

updateGamepadInput()
