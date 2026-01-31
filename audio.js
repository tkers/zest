const FREQ = [
  16.351597831287414, 17.323914436054505, 18.354047994837977,
  19.445436482630054, 20.601722307054366, 21.826764464562746,
  23.124651419477154, 24.499714748859326, 25.956543598746574, 27.5,
  29.13523509488062, 30.86770632850775, 32.70319566257483, 34.64782887210902,
  36.70809598967594, 38.89087296526011, 41.20344461410874, 43.653528929125486,
  46.24930283895431, 48.999429497718666, 51.91308719749314, 55,
  58.27047018976124, 61.7354126570155, 65.40639132514966, 69.29565774421803,
  73.41619197935188, 77.78174593052022, 82.40688922821748, 87.30705785825097,
  92.49860567790861, 97.99885899543733, 103.82617439498628, 110,
  116.54094037952248, 123.47082531403103, 130.8127826502993, 138.59131548843604,
  146.8323839587038, 155.56349186104043, 164.81377845643496, 174.61411571650194,
  184.99721135581723, 195.99771799087463, 207.65234878997256, 220,
  233.08188075904496, 246.94165062806206, 261.6255653005986, 277.1826309768721,
  293.6647679174076, 311.12698372208087, 329.6275569128699, 349.2282314330039,
  369.99442271163446, 391.99543598174927, 415.3046975799451, 440,
  466.1637615180899, 493.8833012561241, 523.2511306011972, 554.3652619537442,
  587.3295358348151, 622.2539674441618, 659.2551138257398, 698.4564628660078,
  739.9888454232689, 783.9908719634986, 830.6093951598903, 880,
  932.3275230361799, 987.7666025122483, 1046.5022612023945, 1108.7305239074883,
  1174.6590716696303, 1244.5079348883235, 1318.5102276514797,
  1396.9129257320155, 1479.9776908465378, 1567.981743926997, 1661.2187903197805,
  1760, 1864.6550460723597, 1975.533205024496, 2093.004522404789,
  2217.461047814977, 2349.31814333926, 2489.015869776647, 2637.0204553029594,
  2793.825851464031, 2959.9553816930757, 3135.9634878539946, 3322.437580639561,
  3520, 3729.3100921447194, 3951.066410048992, 4186.009044809578,
  4434.922095629954, 4698.63628667852, 4978.031739553294, 5274.040910605919,
  5587.651702928062, 5919.910763386151, 6271.926975707989, 6644.875161279122,
  7040, 7458.620184289437, 7902.132820097988,
]
const freqForNote = (note, oct) => FREQ[note - 1 + oct * 12]

const VOICE_TYPES = ['sine', 'square', 'sawtooth', 'triangle', 'noise']
const parseVoiceType = (ix) => VOICE_TYPES[ix]

const DEFAULT_ENVELOPE = {
  attack: 0.005,
  decay: 0.1,
  sustain: 0.5,
  release: 0.1,
}

let audioCtx
const enableAudio = () => {
  if (!audioCtx) {
    audioCtx = new AudioContext()
    console.log(`[ZestAudio] Created AudioContext (${audioCtx.state})`)
  }
  if (audioCtx.state === 'suspended') {
    console.log('[ZestAudio] Resuming AudioContext...')
    audioCtx.resume().then(() => {
      console.log('[ZestAudio] Active!')
    })
  }
}

const warnNoise = () =>
  console.log("[ZestAudio] Voice type 'noise' not yet supported")

const createVoice = (typeIx, envelope = {}) => {
  if (typeIx == 4) {
    // @TODO support Noise
    return { playNote: warnNoise }
  }

  const type = VOICE_TYPES[typeIx]
  const volume = envelope?.volume ?? 1
  const attack = envelope?.attack ?? DEFAULT_ENVELOPE.attack
  const decay = envelope?.decay ?? DEFAULT_ENVELOPE.decay
  const sustain = envelope?.sustain ?? DEFAULT_ENVELOPE.sustain
  const release = envelope?.release ?? DEFAULT_ENVELOPE.release

  let oscNode, gainNode
  const playNote = (note, oct, hold) => {
    if (!audioCtx) return
    const tone = freqForNote(note, oct)

    oscNode = audioCtx.createOscillator()
    oscNode.type = type

    gainNode = audioCtx.createGain()
    gainNode.gain.value = 0
    oscNode.connect(gainNode)
    gainNode.connect(audioCtx.destination)

    const t0 = audioCtx.currentTime
    let ta = t0 + attack
    let td = ta + decay
    const ts = t0 + hold
    const tr = ts + release

    let vmax = volume
    let vsus = vmax * sustain

    if (hold < attack) {
      ta = ts
      vmax *= hold / attack
      td = -1
      vsus = vmax
    } else if (hold < attack + decay) {
      td = ts - attack
      vsus = ((hold - attack) / decay) * (vsus - vmax) + vmax
    }

    oscNode.start()

    oscNode.frequency.setValueAtTime(tone, t0)
    gainNode.gain.setValueAtTime(0, t0)
    gainNode.gain.linearRampToValueAtTime(vmax, ta)
    if (td > 0) {
      gainNode.gain.linearRampToValueAtTime(vsus, td)
      gainNode.gain.setValueAtTime(vsus, td)
    }
    gainNode.gain.setValueAtTime(vsus, ts)
    gainNode.gain.linearRampToValueAtTime(0, tr)
    oscNode.stop(tr)
  }

  const stop = () => {
    gainNode?.gain.cancelScheduledValues(0)
    gainNode?.gain.setValueAtTime(0, 0)
    oscNode?.stop()
  }

  return { playNote, stop }
}

const playSound = (sound) => {
  const voice = createVoice(sound.type, sound.envelope)

  const BPM = sound.bpm ?? 120
  const tickLength = (1 / 4) * (60 / BPM)
  let pos = -1

  // @TODO use audioCtx.currentTime and schedule notes ahead of time
  const nextTick = () => {
    if (++pos >= sound.ticks) return

    const note = sound.notes[pos * 3]
    const oct = sound.notes[pos * 3 + 1]
    const hold = sound.notes[pos * 3 + 2]

    if (note > 0) {
      voice.playNote(note, oct, hold * tickLength)
    }

    setTimeout(nextTick, tickLength * 1000)
  }

  nextTick()
}

const stopSong = () => {
  if (!ZestAudio.__currentSong) return
  ZestAudio.__currentSong.stop = true
  delete ZestAudio.__currentSong
}

const playSong = (song, loop, onEnd) => {
  const voices = [
    createVoice(0, song.voices?.[0]),
    createVoice(1, song.voices?.[1]),
    createVoice(2, song.voices?.[2]),
    createVoice(3, song.voices?.[3]),
    // createVoice(4, song.voices?.[4]), // @TODO implement noise
  ]

  const BPM = song.bpm ?? 120
  const tickLength = (1 / 4) * (60 / BPM)
  let pos = -1

  stopSong()
  const signal = { stop: false }
  ZestAudio.__currentSong = signal

  // @TODO use audioCtx.currentTime and schedule notes ahead of time
  const nextTick = () => {
    if (signal.stop) {
      for (let v = 0; v < voices.length; v++) {
        voices[v].stop()
      }
      return
    }

    if (++pos >= song.ticks) {
      if (loop) {
        pos = song.loopFrom ?? 0
      } else {
        return onEnd && onEnd()
      }
    }

    for (let v = 0; v < voices.length; v++) {
      const note = song.notes[v][pos * 3]
      const oct = song.notes[v][pos * 3 + 1]
      const hold = song.notes[v][pos * 3 + 2]

      if (note > 0) {
        voices[v].playNote(note, oct, hold * tickLength)
      }
    }

    setTimeout(nextTick, tickLength * 1000)
  }

  nextTick()
}

ZestAudio = {
  enable: enableAudio,
  playSound: playSound,
  playSong: playSong,
  stopSong: stopSong,
}
