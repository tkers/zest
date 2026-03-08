let rawGameData = null

const dropzone = document.getElementById('dropzone')
const droplabel = document.getElementById('drop-label')
const inData = document.getElementById('data-in')
const wrapColor = document.getElementById('color-wrap')
const inColor = document.getElementById('color-in')
const inTitle = document.getElementById('title-in')
const inAutoplay = document.getElementById('autoplay-in')
const inControls = document.getElementById('controls-in')
const downloadLink = document.getElementById('download-link')
const fileOut = document.getElementById('file-out')

const cardCanvas = document.getElementById('card-view')
const cardViewer = new Zest(cardCanvas)

function showDropzoneError(message) {
  droplabel.innerText = message
  droplabel.className = 'error'
}

function handleProjectDataFailed() {
  showDropzoneError('Failed to load file')
}

dropzone.addEventListener('dragover', (e) => {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'copy'
})

dropzone.addEventListener('drop', (e) => {
  e.preventDefault()
  const file = [...e.dataTransfer.items]
    .filter((item) => item.kind === 'file')
    .filter((item) => item.type == 'application/json')
    .map((item) => item.getAsFile())
    .filter((file) => file)?.[0]

  if (!file) {
    showDropzoneError('Invalid Pulp project file')
    return
  }

  const reader = new FileReader()
  reader.onload = handleProjectDataLoaded
  reader.onerror = handleProjectDataFailed
  reader.readAsText(file)
})

dropzone.addEventListener('click', () => {
  inData.click()
})

function createFaviconTags(img, tint, size = 180) {
  const iconCanvas = document.createElement('canvas')
  iconCanvas.width = img.width
  iconCanvas.height = img.height

  const iconCtx = iconCanvas.getContext('2d')
  iconCtx.putImageData(img, 0, 0)

  const bigCanvas = document.createElement('canvas')
  bigCanvas.width = size
  bigCanvas.height = size

  const bigCtx = bigCanvas.getContext('2d')
  if (tint) {
    bigCtx.fillStyle = tint
    bigCtx.fillRect(0, 0, size, size)
    bigCtx.globalCompositeOperation = 'hard-light'
  }
  bigCtx.imageSmoothingEnabled = false
  bigCtx.drawImage(iconCanvas, 0, 0, img.width, img.height, 0, 0, size, size)

  const url = bigCanvas.toDataURL('image/png')

  const favicon = `<link rel="icon" href="${url}" />`
  const iosicon = `<link rel="apple-touch-icon" href="${url}" />`
  return `${favicon}${iosicon}`
}

function handleProjectDataLoaded(e) {
  const data = JSON.parse(e.target.result)
  rawGameData = JSON.stringify(Zest.minify(data))

  const size = rawGameData.length + ZEST_TEMPLATE.length
  fileOut.innerText = `~${Math.ceil(size / 1000)} KB`

  cardViewer.load(data)
  inTitle.value = data.name
  dropzone.className = 'loaded'
  dropzone.style = `background-color: ${inColor.value}`
  downloadLink.className = ''
}

inData.addEventListener('change', (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  if (file.type !== 'application/json') {
    showDropzoneError(`Wrong filetype: ${file.type}`)
    return
  }

  const reader = new FileReader()
  reader.onload = handleProjectDataLoaded
  reader.onerror = handleProjectDataFailed
  reader.readAsText(file)
})

// prevent accidentally dropping files in window
window.addEventListener('drop', (e) => {
  e.preventDefault()
})

window.addEventListener('dragover', (e) => {
  e.preventDefault()
  e.dataTransfer.dropEffect = dropzone.contains(e.target) ? 'copy' : 'none'
})

function setThemeColor(color) {
  const bg = `background-color: ${color}`
  wrapColor.style = bg
  if (dropzone.className == 'loaded') {
    dropzone.style = bg
  }
}
inColor.addEventListener('input', (e) => {
  setThemeColor(e.target.value)
})

wrapColor.style = `background-color: ${inColor.value}`
// wrapColor.addEventListener('click', () => {
//   inColor.click()
// })
wrapColor.addEventListener('contextmenu', (e) => {
  e.preventDefault()
  inColor.value = '#808080'
  setThemeColor(inColor.value)
})

const keyboard_wasd = {
  KeyW: Zest.kButtonUp,
  KeyA: Zest.kButtonLeft,
  KeyS: Zest.kButtonDown,
  KeyD: Zest.kButtonRight,
  Comma: Zest.kButtonB,
  Period: Zest.kButtonA,
  Slash: Zest.kButtonCrank,
}
const keyboard_hjkl = {
  KeyH: Zest.kButtonLeft,
  KeyJ: Zest.kButtonDown,
  KeyK: Zest.kButtonUp,
  KeyL: Zest.kButtonRight,
}
const keyboard_as = {
  KeyA: Zest.kButtonB,
  KeyS: Zest.kButtonA,
  KeyD: Zest.kButtonCrank,
}
const keyboard_mappers = {
  'arrow-zx': {},
  'arrow-as': keyboard_as,
  'wasd-,.': keyboard_wasd,
  'hjkl-as': { ...keyboard_hjkl, ...keyboard_as },
}

downloadLink.addEventListener('click', (e) => {
  if (!rawGameData) {
    e.preventDefault()
    return
  }

  const iconData = cardViewer.getIconImageData()
  const vFavicons = iconData ? createFaviconTags(iconData, inColor.value) : ''

  const vAutoplay = inAutoplay.checked ? 'clicked' : ''
  const vKeymap = JSON.stringify(keyboard_mappers[inControls.value])

  const src = ZEST_TEMPLATE.replace('{{AUTOPLAY}}', vAutoplay)
    .replace('{{COLOR}}', inColor.value)
    .replace('{{TITLE}}', inTitle.value)
    .replace('{{META_TAGS}}', vFavicons)
    .replace('{{KEYMAP}}', vKeymap)
    .replace('{{GAME}}', rawGameData)

  const blob = new Blob([src], { type: 'text/html' })
  const url = URL.createObjectURL(blob)

  downloadLink.download = `${inTitle.value}.html`
  downloadLink.href = url

  // URL.revokeObjectURL(url)
})
