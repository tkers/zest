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

> **Skip directly to:** \
> [Event Target](#eventtarget) • [PulpScript Extensions](#special-pulpscript-extensions) • [Examples](#basic-example) • [Bundler Instructions](#bundler-instructions)

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

## Bundler instructions

Using the Bundler is supposed to be as straighforward as possible, but there's a few quirks to know about.

> Keep in mind that the Bundler is supposed to offer a _simple and basic_ way to turn your Pulp game into a HTML5 game. Even though some customisations are possible, the Bundler will not offer the full flexibility as using the core library directly would.

The Bundler asks you for a few things:

**Source JSON:** Drop in your `data.json` here, i.e. the file that Pulp lets you download through the "Export" button. Zest will compress this file (slightly) by removing all data that is relevant for the editor, but not needed for playing the game. This data will be combined with the Zest runtime library to create a working web version of your game.

**Title:** The title for the exported HTML page, typically not visible when embedded in another page, but you probably want to set this to your game's title.

**Palette:** By default your game will simulate the device appearance, using two shades of grey. You can optionally change the palette by selecting a color here, which will be used to tint your graphics. For more control over the colors your game uses, set the `config.colorBlack` and `config.colorWhite` through PulpScript directly. If you change the palette through PulpScript, leave this option to the default grey tint. (Right clicking the circle will reset the color.)

**Autoplay:** Toggles whether your game will automatically start playing on page load, or display a "Play" icon on top of your launcher card until the player clicks it. While enabling autoplay seems like a good option, most (if not all) browsers will mute audio until the first user interaction (keyboard or mouse click). Only enable this setting if you're okay with your game _starting muted_, or when you intend to package your game in a native app (using tools like Electron or Tauri), where this restriction does not exist.

**Controls:** Pick a preset control scheme for your game. By default, the arrow keys and <kbd>Z</kbd> <kbd>X</kbd> are mapped to the d-pad, B button and A button respectively, while the <kbd>C</kbd> key toggles docking and undocking the crank.

Besides the keyboard controls, the bundler also includes the _Gamepad_ and _Touch_ plugins. This allows your game to be played with a gamepad, or on a touch screen device like a smart phone or tablet.

> Touch controls (experimental) are mapped as follows: Swiping in cardinal directions simulates pressing the d-pad, a single tap maps to the A button, and a tap with 2 fingers maps to the B button. Crank controls are not available.
