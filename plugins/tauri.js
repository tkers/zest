const MIN_SCALE = 1
const MAX_SCALE = 5
let scale = 2

/*
Adds useful configurations when running in Tauri:
- Prevent page refresh (F5 or Cmd+R)
- Prevent context menu (right mouse click)
- Enable fullscreen toggle (F11 or Alt+Enter)
- Enable fullscreen exit (Esc)
- Enable window zooming (Ctrl + 1/2/3/...)
*/

/*
Set `withGlobalTauri` to true and add these
permissions to capabilities/default.json:
  - core:window:allow-set-fullscreen
  - core:window:allow-set-size
*/

const getAppWindow = () => window.__TAURI__?.window?.getCurrentWindow()

const toggleFullscreen = async () => {
  const appWindow = getAppWindow()
  const wasFullscreen = await appWindow.isFullscreen()
  appWindow.setFullscreen(!wasFullscreen)
}

// Add some pixels to the height for the title bar in MacOS
// https://github.com/tauri-apps/tauri/issues/15136
const MAC_DY = navigator.platform.startsWith('Mac') ? 32 : 0

const resizeWindow = (width, height) => {
  const appWindow = getAppWindow()
  const { LogicalSize } = window.__TAURI__?.window
  appWindow.setSize(new LogicalSize(width, height + MAC_DY))
}

window.addEventListener('keydown', async (e) => {
  // Prevent refresh with F5 (Windows), Cmd+R (Mac), Ctrl+R (Linux)
  if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key === 'r')) {
    e.preventDefault()
    return
  }

  // Toggle fullscreen with F11 or Alt+Enter
  if (e.key == 'F11' || (e.altKey && e.key == 'Enter')) {
    e.preventDefault()
    toggleFullscreen()
  }

  const decWindowScale = () => setWindowScaleTo(Math.max(MIN_SCALE, scale - 1))
  const incWindowScale = () => setWindowScaleTo(Math.min(MAX_SCALE, scale + 1))
  const setWindowScaleTo = async (s) => {
    const isFullscreen = await getAppWindow()?.isFullscreen()
    if (isFullscreen) return

    e.preventDefault()
    scale = s
    resizeWindow(scale * 400, scale * 240)
  }

  if (e.ctrlKey || e.metaKey) {
    if (e.code == 'Digit1') {
      setWindowScaleTo(1)
    } else if (e.code == 'Digit2') {
      setWindowScaleTo(2)
    } else if (e.code == 'Digit3') {
      setWindowScaleTo(3)
    } else if (e.code == 'Digit4') {
      setWindowScaleTo(4)
    } else if (e.code == 'Digit5') {
      setWindowScaleTo(5)
    } else if (e.code == 'Minus') {
      decWindowScale()
    } else if (e.code == 'Equal') {
      incWindowScale()
    } else if (e.code == 'Digit0') {
      setWindowScaleTo(2)
    }
  }
})

// Fix the initial screen size on Mac
window.addEventListener('load', () => {
  resizeWindow(800, 480)
})

// Prevent showing menu on right click
document.addEventListener('contextmenu', (e) => e.preventDefault())

// Override browser fullscreen behaviour
Zest.toggleFullscreen = toggleFullscreen
