globalThis.ZestAudio = null

globalThis.ImageData = function (w, h) {
  this.width = w
  this.height = h
  this.data = new Uint8ClampedArray(w * h * 4)
}

globalThis.localStorage = {
  setItem: () => {},
  getItem: () => {},
  deleteItem: () => {},
}
