---
title: Zest Docs
css: highlight
---

# Zest Docs

## core API reference

There's generally 2 ways to use Zest:

1. Use the bundler to convert your game automatically _(easy)_
2. Download and integrate with the core runtime library _(advanced)_

The first option does not require any coding, but customisation is more limited.
The second option entails importing the library into your own HTML/JS project,
and using the API reference below to load and run your game.

<section class="center">
  <a
    href="https://github.com/tkers/zest/releases"
    target="_blank"
    class="btn btn-primary"
    >Download</a
  >
  <a
    href="https://github.com/tkers/zest/issues"
    target="_blank"
    class="btn btn-secondary"
    >Open Issues</a
  >
</section>

After downloading zest.js, you should import the library into your HTML page
like so:

```
<script src="zest.min.js" type="text/javascript"></script>
```

When the script loads, it defines a global `Zest` variable that you can use to
initialise and run your game.

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
      game.attachKeyboard({ KeyZ: Zest.kButtonB, KeyX: Zest.kButtonA })
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
with the _openurl_ plugin active, you can use `log "@open http://example.org"`to
open a new window. Check out the `plugins/` folder for more ways to extend the
runner.
