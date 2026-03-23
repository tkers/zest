import { bundle, estimateSize } from './bundler.js'
import { plugins } from './bundlerPlugins.js'

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
const downloadLinkAlt = document.getElementById('download-link-alt')
const fileOut = document.getElementById('file-out')
const pluginsOut = document.getElementById('plugins-out')

pluginsOut.innerHTML = plugins
  .map((plugin) => {
    return `<li class="plugin">
    <div>
      <input type="checkbox" onchange="updateEstimatedSize()" id="plugin-box-${plugin.file}"${plugin.enabled ? ' CHECKED' : ''} />
    </div>
    <div>
      <label for="plugin-box-${plugin.file}">
        <strong>${plugin.name}</strong> <small>+${Math.ceil(plugin.src.length / 100) / 10} KB</small>
      </label>
      <p>${plugin.info}</p>
    </div>
    </li>`
  })
  .join('\n')

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

function createFavicon(img, tint, size = 128) {
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

  return bigCanvas.toDataURL('image/png')
}

function createFaviconTags(img, tint, size) {
  const url = createFavicon(img, tint, size)
  const favicon = `<link rel="icon" href="${url}" />`
  const iosicon = `<link rel="apple-touch-icon" href="${url}" />`
  return `${favicon}${iosicon}`
}

function getSelectedPlugins() {
  return plugins
    .filter(
      (plugin) => document.getElementById(`plugin-box-${plugin.file}`).checked
    )
    .map((plugin) => plugin.file)
}

function updateEstimatedSize() {
  if (!rawGameData) return
  const size = estimateSize(rawGameData, getSelectedPlugins())
  fileOut.innerText = `~${Math.ceil(size / 1000)} KB`
}
window.updateEstimatedSize = updateEstimatedSize

function handleProjectDataLoaded(e) {
  rawGameData = JSON.parse(e.target.result)
  updateEstimatedSize()

  cardViewer.load(rawGameData)
  inTitle.value = rawGameData.name
  dropzone.className = 'loaded'
  dropzone.style = `background-color: ${inColor.value}`
  downloadLink.className = ''

  const iconData = cardViewer.getIconImageData()
  downloadLinkAlt.className = iconData ? 'clicky' : 'clicky disabled'
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

downloadLink.addEventListener('click', (e) => {
  if (!rawGameData) {
    e.preventDefault()
    return
  }

  const iconData = cardViewer.getIconImageData()
  const faviconTags = iconData && createFaviconTags(iconData, inColor.value)

  const selectedPlugins = getSelectedPlugins()

  const src = bundle({
    autoplay: inAutoplay.checked,
    color: inColor.value,
    title: inTitle.value,
    keymap: inControls.value,
    meta: faviconTags,
    plugins: selectedPlugins,
    gameData: rawGameData,
  })

  const blob = new Blob([src], { type: 'text/html' })
  const url = URL.createObjectURL(blob)

  downloadLink.download = `${inTitle.value}.html`
  downloadLink.href = url

  // URL.revokeObjectURL(url)
})

downloadLinkAlt.addEventListener('click', (e) => {
  if (downloadLinkAlt.className !== 'clicky') {
    e.preventDefault()
    return
  }

  const iconData = cardViewer.getIconImageData()
  if (!iconData) return

  downloadLinkAlt.download = `${inTitle.value} icon.png`
  downloadLinkAlt.href = iconData && createFavicon(iconData, inColor.value)
})
