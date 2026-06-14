const dropzone = document.getElementById('dropzone')
const droplabel = document.getElementById('drop-label')
const inData = document.getElementById('data-in')
const inSong = document.getElementById('song-in')
const timeNow = document.getElementById('time-now')
const timeMax = document.getElementById('time-max')
const timeBar = document.getElementById('progress-fill')
const recOut = document.getElementById('rec-out')
const downloadLink = document.getElementById('download-link')
const downloadLinkAlt = document.getElementById('download-link-alt')

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

const humanTime = (duration) => {
  const minutes = Math.floor(duration / 60)
  const seconds = Math.ceil(duration % 60)
    .toString()
    .padStart(2, '0')
  return `${minutes}:${seconds}`
}

const getDuration = (song) => {
  const duration = (song.ticks / 4) * (60 / song.bpm)
  return humanTime(duration)
}

// const startSong = (songIx) => {
//   ZestAudio.enable()
//   selectSong(songIx)
//   ZestAudio.playSong(allSongs[songIx], false, () => {
//     allRows[songIx].className = ''
//     gotoNextSong()
//   })
//   isPlaying = true
//   // btnPlay.innerHTML = '⏹&#xFE0E;'

//   if (barTimer) {
//     clearInterval(barTimer)
//     barTimer = null
//   }

//   const song = allSongs[currentSong]
//   const ti = ZestAudio.getTime()
//   const te = (song.ticks / 4) * (60 / song.bpm)
//   barTimer = setInterval(() => {
//     const td = ZestAudio.getTime() - ti
//     timeNow.innerText = humanTime(td)
//     timeBar.style.width = `${(td * 100) / te}%`
//   }, 1000 / 60)
// }

// const gotoNextSong = () => {
//   if (currentSong >= allSongs.length - 1) {
//     stopMusic()
//     selectSong(0)
//     return
//   }
//   currentSong++
//   if (isPlaying) {
//     startSong(currentSong)
//   } else {
//     selectSong(currentSong)
//   }
// }

// const gotoPrevSong = () => {
//   if (currentSong <= 0) return
//   currentSong--
//   if (isPlaying) {
//     startSong(currentSong)
//   } else {
//     selectSong(currentSong)
//   }
// }

// const stopMusic = () => {
//   isPlaying = false
//   ZestAudio.stopSong()
//   selectSong(currentSong)
//   isPlaying = false
//   btnPlay.innerHTML = '▶&#xFE0E;'
//   if (barTimer) {
//     clearInterval(barTimer)
//     barTimer = null
//   }
// }

let barTimer, initAux, mediaStreamDest
function handleProjectDataLoaded(e) {
  gameData = JSON.parse(e.target.result)
  cardViewer.load(gameData)
  // cardViewer.playCard()
  dropzone.className = 'loaded'
  downloadLink.className = ''
  // downloadLinkAlt.className = 'clicky'

  // console.log(gameData)

  inSong.innerHTML = Object.values(cardViewer.namedSongs)
    .map((song) => song.name)
    .toSorted()
    .map((name) =>
      cardViewer.namedSongs[name].id === gameData.song
        ? `<option value="" selected>&#9733; ${name}</option>`
        : `<option value="${name}">${name}</option>`
    )
    .join('\n')

  const songName = inSong.value
  const song = cardViewer.namedSongs[songName]
  timeMax.innerText = song ? getDuration(song) : '0:00'

  // playlist.className = ''
  // controls.className = ''

  // document.body.style.backgroundImage = `url('${cardCanvas.toDataURL()}')`

  // playlist.innerHTML = ''
  // allRows = []
  // allSongs = gameData?.songs?.filter(Boolean) ?? []
  // allSongs.forEach((song, ix) => {
  //   const trackRow = document.createElement('a')
  //   trackRow.href = '#'
  //   allRows.push(trackRow)
  //   trackRow.innerText = `${ix + 1}. ${song.name}`

  //   const trackMeta = document.createElement('small')
  //   trackMeta.innerText = getDuration(song)
  //   trackRow.appendChild(trackMeta)

  //   trackRow.addEventListener('click', (e) => {
  //     e.preventDefault()
  //     startSong(ix)
  //   })

  //   playlist.appendChild(trackRow)
  // })
  // currentSong = 0
  // stopMusic()
}

// btnNext.addEventListener('click', (e) => {
//   e.preventDefault()
//   gotoNextSong()
// })

// btnPrev.addEventListener('click', (e) => {
//   e.preventDefault()
//   gotoPrevSong()
// })

// btnPlay.addEventListener('click', (e) => {
//   e.preventDefault()
//   if (isPlaying) {
//     stopMusic()
//   } else {
//     startSong(currentSong)
//   }
// })

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

inSong.addEventListener('change', () => {
  const songName = inSong.value
  const song = cardViewer.namedSongs[songName]
  timeMax.innerText = song ? getDuration(song) : '0:00'
})

downloadLink.addEventListener('click', (e) => {
  e.preventDefault()

  const ctx = ZestAudio.enable() ?? new AudioContext()
  let recorder
  if (!initAux) {
    mediaStreamDest = ctx.createMediaStreamDestination()
    ZestAudio.connectAux(mediaStreamDest)
    initAux = true
  }

  const extForMime = (mime) => mime.split(';')[0].split('/')[1]
  // const mimeList = [
  //   'audio/mp3',
  //   'audio/mp4',
  //   'audio/ogg;codecs=opus',
  //   'audio/webm;codecs=opus',
  // ]
  // const mimeType = mimeList.find((x) => MediaRecorder.isTypeSupported(x))
  // recorder = new MediaRecorder(mediaStreamDest.stream, { mimeType })
  recorder = new MediaRecorder(mediaStreamDest.stream)
  recorder.start()

  const songName = inSong.value
  const song = cardViewer.namedSongs[songName]

  // console.log(song)

  timeNow.innerText = '0:00'
  timeBar.style.width = '0'
  timeMax.innerText = song ? getDuration(song) : '0:00'

  cardViewer.stopMusic()
  cardViewer.onceMusic(songName, () => {
    clearInterval(barTimer)
    barTimer = null

    recorder.addEventListener('dataavailable', function (e) {
      const audElem = document.createElement('audio')
      audElem.src = URL.createObjectURL(e.data)
      audElem.controls = true
      recOut.appendChild(audElem)

      const linkElem = document.createElement('a')
      linkElem.href = audElem.src
      linkElem.download = `${songName}.${extForMime(recorder.mimeType)}`
      linkElem.innerHTML = `${songName} (${recorder.mimeType})`
      recOut.appendChild(linkElem)
      linkElem.click()

      recOut.appendChild(document.createElement('br'))

      recorder = null
    })
    recorder.stop()
  })

  if (barTimer) {
    clearInterval(barTimer)
    barTimer = null
  }
  const ti = ZestAudio.getTime()
  const te = (song.ticks / 4) * (60 / song.bpm)
  barTimer = setInterval(() => {
    const td = ZestAudio.getTime() - ti
    timeNow.innerText = humanTime(td)
    timeBar.style.width = `${(td * 100) / te}%`
  }, 1000 / 60)
})
