const deepCopy = (x) => JSON.parse(JSON.stringify(x))
export function minify(original) {
  const gameData = deepCopy(original)
  delete gameData.editor
  gameData?.scripts?.forEach((script) => {
    delete script?.data?.__comments
    delete script?.data?.__srcOrder
  })
  return gameData
}
