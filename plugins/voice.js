Zest.register((game) => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition

  const recognition = new SpeechRecognition()
  recognition.lang = 'en-US'
  recognition.continuous = true
  recognition.interimResults = false
  recognition.maxAlternatives = 1

  const phraseToCode = {
    up: Zest.kButtonUp,
    right: Zest.kButtonRight,
    down: Zest.kButtonDown,
    left: Zest.kButtonLeft,
    a: Zest.kButtonA,
    b: Zest.kButtonB,
    menu: Zest.kButtonMenu,
    crank: Zest.kButtonCrank,
    dock: Zest.kButtonCrank,
    undock: Zest.kButtonCrank,
  }

  let prevResult = [null, null]
  recognition.onresult = (e) => {
    let { transcript, confidence } = e.results[e.results.length - 1][0]

    if (transcript === '' && confidence === 0) {
      ;[transcript, confidence] = prevResult
    }
    prevResult = [transcript, confidence]

    if (confidence < 0.75) return

    const code = phraseToCode[transcript.toLowerCase().trim()]
    if (code) {
      game.pressKey(code)
      game.releaseKey(code)
    }
  }

  let voiceStarted = false
  game.canvas?.addEventListener('click', () => {
    if (voiceStarted) return
    recognition.start()
    voiceStarted = true
  })
})
