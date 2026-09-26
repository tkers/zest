export const pack = (data) => {
  const bytes2str = (arr) =>
    btoa(arr.map((x) => String.fromCharCode(x)).join(''))

  const encodeFrameData = (data) => {
    const transparency = data.includes(2)
    const bytes = new Array(transparency ? 16 : 8)

    for (let i = 0; i < 64; i++) {
      if (transparency) {
        bytes[i >> 2] |= data[i] << ((i % 4) << 1)
      } else {
        bytes[i >> 3] |= data[i] << (i % 8)
      }
    }

    return bytes2str(bytes)
  }

  const packFrames = (frames) =>
    frames.map((f) => (f ? encodeFrameData(f.data) : 0))

  const packData = (data) => ({
    ...data,
    frames: packFrames(data.frames),
    font: {
      ...data.font,
      pipe: data.font.pipe.map(encodeFrameData),
      chars: data.font.chars.map(encodeFrameData),
    },
  })

  return packData(data)
}

export const unpack = (data) => {
  const str2bytes = (str) => Array.from(atob(str), (c) => c.charCodeAt(0))

  const decodeFrameData = (str) => {
    const transparency = str.length > 12
    const bytes = str2bytes(str)
    const data = new Array(64)

    for (let i = 0; i < 64; i++) {
      if (transparency) {
        data[i] = (bytes[i >> 2] >> ((i % 4) << 1)) % 4
      } else {
        data[i] = (bytes[i >> 3] >> (i % 8)) % 2
      }
    }

    return data
  }

  const unpackFrames = (frames) =>
    frames.map((f, id) => (f === 0 ? false : { id, data: decodeFrameData(f) }))

  const unpackData = (data) => ({
    ...data,
    frames: unpackFrames(data.frames),
    font: {
      ...data.font,
      pipe: data.font.pipe.map(decodeFrameData),
      chars: data.font.chars.map(decodeFrameData),
    },
  })

  return unpackData(data)
}
