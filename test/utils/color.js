export default {
  red: (x) => `\x1b[31m${x}\x1b[0m`,
  green: (x) => `\x1b[32m${x}\x1b[0m`,
  yellow: (x) => `\x1b[33m${x}\x1b[0m`,
  magenta: (x) => `\x1b[35m${x}\x1b[0m`,
  cyan: (x) => `\x1b[36m${x}\x1b[0m`,
}
