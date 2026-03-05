---
title: Zest Docs
css: highlight
---

# Zest Docs

## core API reference

The runtime library is the core of what makes Zest work. By manually integrating with it, you can customise your game runner in any way you'd like, beyond what the standard configuration options of the Bundler have to offer!

<section class="center">
  <a
    href="{{ site.github.releases_url }}"
    target="_blank"
    class="btn btn-primary"
    >Download</a
  >
  <a
    href="{{ site.github.issues_url }}"
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

> **Skip directly to:** \
> [Initialise](#initialising-zest) • [Attach Keyboard](#gameattachkeyboardbindings-target) • [Event Target](#eventtarget) • [PulpScript Access](#pulpscript-methods) • [Usage Examples](#basic-example) • [Plugins](#plugins)

## Runtime API

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

Starts the game previously loaded through `Zest.load(data, canvas)`. Calling this function will also try to resume the AudioContext, so you're advised to do this from a user gesture to ensure audio is working.

### game.load()

### game.restart()

### game.stop()

### game.pause()

### game.resume()

### game.pauseResume()

Returns `true` if the game is now paused, or `false` if it's now resumed. You can also use the `game.isPaused` flag to determine the state of the game.

### game.attachKeyboard(bindings?, target?)

A convenience method to automatically attach keyboard bindings to the game, so you don't have to manually listen for input and call `game.pressKey` and `game.releaseKey`. It takes an optional object with overrides to the default key bindings, and an optional target for the listeners (defaults to `window`).

Bindings are provided as a mapping from a [key code](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code) (i.e. a value of `event.code` in keyboard events) to a virtual button, like so:

```js
game.attachKeyboard({
  KeyA: Zest.kButtonA,
  KeyS: Zest.kButtonB,
  KeyD: Zest.kButtonCrank,
})
```

These bindings will be merged with the default control scheme, so in this example the arrow keys are still mapped to the dpad.

> Note that key codes are layout-independent. That means that `KeyA` represents the **physical location** of the A Key on a standard QWERTY keyboard, not the actual letter "A". When using an AZERTY layout, this will map to the Q key, which is located left of S, preserving adjacency.

### game.pressKey(key)

Triggers the press of a button. Possible values for `key` are:

- Zest.kButtonUp
- Zest.kButtonRight
- Zest.kButtonDown
- Zest.kButtonLeft
- Zest.kButtonA
- Zest.kButtonB
- Zest.kButtonCrank

The `kButtonCrank` key is a special "key" that toggles the crank between docked and undocked, provided as a convenience to make input handling simpler. For more grannular control of crank input, use the `dockCrank`, `undockCrank` and `turnCrank` methods.

### game.releaseKey(key)

### game.dockCrank()

### game.undockCrank(aa?)

### game.turnCrank(aa)

## EventTarget

You can attach event listeners to the Zest instance to react to changes in the game, for example you can apply a "paused" style to the canvas element like so:

```js
game.addEventListener('pause', () => {
  canvas.className = 'paused'
})
game.addEventListener('resume', () => {
  canvas.className = ''
})
```

Other events that are emitted are:

- `log`
- `shake`
- `store`
- `config`
- `dock`
- `undock`
- `start`
- `pause`
- `resume`
- `finish`

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

## Plugins

Some special features are made available through optional plugins. For example,
with the _openurl_ plugin active, you can use `log "@open http://example.org"` in PulpScript to
open a new window. Other plugins enable additional input methods, or accessibility features.

A number of plugins is available in the `plugins/` folder, but you can easily make new ones yourself!

```js
Zest.register((game) => {
  game.addEventListener('shake', (e) => {
    console.log(`Shake for ${e.detail.duration} seconds!`)
  })
})
```

In this example, we use `Zest.register` to register a new plugin. The callback function that we pass in will be called when a new `game` instance is created (i.e. when `Game.run` or `Game.load` is called from anywhere). Next, we attach an event listener that logs a message to the console whenever `shake` is used from PulpScript.

Another, slightly larger example:

```js
Zest.register((game) => {
  window.addEventListener('keydown', (e) => {
    if (e.code == 'Space') {
      game.pressKey(Zest.kButtonCrank)
    }
  })

  window.addEventListener('keyup', (e) => {
    if (e.code == 'Space') {
      game.releaseKey(Zest.kButtonCrank)
    }
  })
})
```
