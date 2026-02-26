# 🍋 Zest

> A web runtime for [Pulp](https://play.date/pulp/about) games

Zest is a new way to play and distribute games made with Pulp. It allows
developers to port over their games to HTML5, which lets you run your game
directly from the browser, or bundle it into a downloadable desktop or mobile
app!

## Getting started

There's generally 2 ways to use Zest:

1. Use a bundler to wrap your game automatically (easy)
2. Use the core runtime library directly (advanced)

The first option does not require any coding, but customisation is of course
more limited. Additional settings may become available in the future, though
development on the core runtime will take priority at this stage.

The second option entails importing the library into your own HTML/JS project,
and using the API reference below to load and run your game:

## Core API

### Initialising Zest

There are 2 static constructors available to initialise Zest and get your game
in a playable state. Both require your game `data` as input. This is essentially
the `data.json` that Pulp exports, but be aware that browsers can't load JSON
files directly; You can either use `fetch()` to load the game, or prefix your
data file with e.g. `const gameData = {...}` to make it a valid JS file.

### Zest.load(data, canvas)

The static method `Zest.load` loads your game and renders the _card_ screen,
allowing you to call `.play()` to start it. This is generally the better
approach because browsers require a user gesture (keyboard press or mouse click)
for WebAudio to work.

### Zest.run(data, canvas)

The static method `Zest.run` loads your game and immediately starts it. This is
essentially the _autoplay_ route, but WebAudio might not be enabled when doing
this from a browser.

Both of these constructors return the `game` instance referred to below.

### game.play()

### game.load()

### game.restart()

### game.stop()

### game.pauseResume()

### game.attachKeyboard(bindings?)

### game.pressKey(key)

### game.releaseKey(key)

### game.dockCrank()

### game.undockCrank(aa?)

### game.turnCrank(aa, ra)

## PulpScript Methods

Apart from the functionality documented above, Zest exposes most of the
PulpScript functions as methods to your game instance. For example `game.toss()`
and `game.dump()` would work as you'd expect. Note that these functions are not
yet finalised and might change in the future.

## Basic example

```js
// assuming 'gameData' is set to the contents of data.json
window.addEventListener('load', () => {
  const canvas = document.getElementByTagName('canvas')[0]
  const game = Zest.run(gameData, canvas)
  game.attachKeyboard()
})
```

## Advanced example

```js
window.addEventListener('load', () => {
  const canvas = document.getElementByTagName('canvas')[0]
  fetch('mygame/data.json')
    .then((res) => res.json())
    .then((data) => {
      const game = Zest.load(data, canvas)
      game.attachKeyboard({ z: Zest.kButtonB, x: Zest.kButtonA })
      canvas.addEventListener('click', () => game.play())
    })
})
```

## Special PulpScript extensions

Some extensions to the runtime make it easier to maintain a single Pulp game
while still being able to use some Zest features:

Use `event.zest == 1` to detect if the game is currently running in Zest.

Set `config.colorWhite = "#ffffff"` and `config.colorBlack = "#000000"` to
control the color palette.

Some special features are made available through optional plugins. For example,
with the _openurl_ plugin active, you can use `log "@open http://example.org"`
to open a new window. Check out the `plugins/` folder for more ways to extend
the runner.

---

Made with ❤ in Amsterdam. If you like this project,
[buy me a coffee](https://ko-fi.com/tkers), maybe?

[Zest](https://tkers.dev/zest) is an independent, unofficial runtime and is not
affiliated with, endorsed by, or supported by Panic Inc.
