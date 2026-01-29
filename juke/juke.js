const dropzone = document.getElementById('dropzone')
const droplabel = document.getElementById('drop-label')
const inData = document.getElementById('data-in')
const listOut = document.getElementById('playlist')

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

const getDuration = (song) => {
  const duration = (song.ticks / 4) * (60 / song.bpm)
  const minutes = Math.floor(duration / 60)
  const seconds = Math.ceil(duration % 60)
    .toString()
    .padStart(2, '0')
  return `${minutes}:${seconds}`
}

function handleProjectDataLoaded(e) {
  rawGameData = e.target.result
  const data = JSON.parse(rawGameData)
  cardViewer.load(data)
  dropzone.className = 'loaded'

  const allButtons = []
  data.songs.filter(Boolean).forEach((song, ix) => {
    const songBtn = document.createElement('a')
    allButtons.push(songBtn)
    songBtn.innerText = `${ix + 1}. ${song.name} (${getDuration(song)})`
    songBtn.addEventListener('click', (e) => {
      e.preventDefault()
      allButtons.forEach((btn) => (btn.className = ''))
      songBtn.className = 'playing'
      ZestAudio.enable()
      ZestAudio.playSong(song, true)
    })
    listOut.appendChild(songBtn)
    listOut.appendChild(document.createElement('br'))
  })
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
