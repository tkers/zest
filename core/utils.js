'use strict'
;(function () {
  const deepCopy = (x) => JSON.parse(JSON.stringify(x))

  Zest.minify = function (original) {
    const gameData = deepCopy(original)
    delete gameData.editor
    gameData.scripts.forEach((script) => {
      delete script?.data?.__comments
      delete script?.data?.__srcOrder
    })
    return gameData
  }

  const SCALE_FACTOR = 2
  const imgDataToURL = (img) => {
    const canvas = document.createElement('canvas')
    canvas.width = img.width * SCALE_FACTOR
    canvas.height = img.height * SCALE_FACTOR

    const ctx = canvas.getContext('2d')
    ctx.putImageData(img, 0, 0)

    ctx.imageSmoothingEnabled = false
    ctx.drawImage(
      canvas,
      0,
      0,
      img.width,
      img.height,
      0,
      0,
      canvas.width,
      canvas.height
    )

    return canvas.toDataURL('image/png')
  }

  Zest.prototype.getCardURL = function () {
    return imgDataToURL(this.getCardImageData())
  }

  Zest.prototype.getWrapURL = function () {
    return imgDataToURL(this.getWrapImageData())
  }

  Zest.prototype.getIconURL = function () {
    return imgDataToURL(this.getIconImageData())
  }
})()
