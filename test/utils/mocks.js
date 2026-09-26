globalThis.ZestAudio = null

globalThis.ImageData = function (w, h) {
  this.width = w
  this.height = h
  this.data = []
}

globalThis.localStorage = {
  setItem: () => {},
  getItem: () => {},
  deleteItem: () => {},
}
