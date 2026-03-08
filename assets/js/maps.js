const dropzone = document.getElementById('dropzone')
const droplabel = document.getElementById('drop-label')
const inData = document.getElementById('data-in')
const wrapColor = document.getElementById('color-wrap')
const inColor = document.getElementById('color-in')
const inScale = document.getElementById('scale-in')
const inRoom = document.getElementById('room-in')
const downloadLink = document.getElementById('download-link')

const cardCanvas = document.getElementById('card-view')
const cardViewer = new Zest(cardCanvas)

function handleProjectDataLoaded(e) {
  const data = JSON.parse(e.target.result)

  cardViewer.load(data)

  inRoom.innerHTML = Object.values(cardViewer.namedRooms)
    .map((room) => room.name)
    .toSorted()
    .map((name) =>
      name === cardViewer.start.name
        ? `<option value="" selected>&#9733; ${name}</option>`
        : `<option value="${name}">${name}</option>`
    )
    .join('\n')

  dropzone.className = 'loaded'
  dropzone.style = `background-color: ${inColor.value}`

  downloadLink.className = ''
}

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

function downloadCanvas(canvas, filename) {
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()

    URL.revokeObjectURL(url)
  }, 'image/png')
}

function scaleAndTint(img, scale = 1, tint = '#808080') {
  const canvas = document.createElement('canvas')
  canvas.width = img.width * scale
  canvas.height = img.height * scale

  const ctx = canvas.getContext('2d')
  ctx.fillStyle = tint
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.globalCompositeOperation = 'hard-light'
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(
    img,
    0,
    0,
    img.width,
    img.height,
    0,
    0,
    canvas.width,
    canvas.height
  )

  return canvas
}

inRoom.addEventListener('change', (e) => {
  const room = cardViewer.getRoom(inRoom.value)
  const img = cardViewer.getRoomImageData(room)
  cardViewer.renderToCanvas(img)
})

downloadLink.addEventListener('click', (e) => {
  if (downloadLink.className !== '') {
    e.preventDefault()
    return
  }

  const vRoom = inRoom.value !== '' ? inRoom.value : undefined
  const vScale = inScale.checked ? 2 : 1
  const vTint = inColor.value
  const vFilename = `${cardViewer.meta.name} - worldmap.png`

  const worldmap = cardViewer.getWorldCanvas(vRoom)
  const canvas = scaleAndTint(worldmap, vScale, vTint)
  return downloadCanvas(canvas, vFilename)
})
