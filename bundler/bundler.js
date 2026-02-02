let rawGameData = null

const dropzone = document.getElementById('dropzone')
const droplabel = document.getElementById('drop-label')
const inData = document.getElementById('data-in')
const wrapColor = document.getElementById('color-wrap')
const inColor = document.getElementById('color-in')
const inTitle = document.getElementById('title-in')
const downloadLink = document.getElementById('download-link')

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

function handleProjectDataLoaded(e) {
  const data = JSON.parse(e.target.result)
  rawGameData = JSON.stringify(Zest.minify(data))

  cardViewer.load(data)
  inTitle.value = data.name
  dropzone.className = 'loaded'
  dropzone.style = `background-color: ${inColor.value}`
  downloadLink.className = ''
}

inData.addEventListener('change', (e) => {
  const file = e.target.files[0]
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

  const src = zest_template
    .replace('#808080', inColor.value)
    .replace('{{TITLE}}', inTitle.value)
    .replace('{{GAME}}', rawGameData)

  const blob = new Blob([src], { type: 'text/html' })
  const url = URL.createObjectURL(blob)

  downloadLink.download = `${inTitle.value}.html`
  downloadLink.href = url

  // URL.revokeObjectURL(url)
})
