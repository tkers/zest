---
title: Zest Guide
# css: highlight
---

# Zest Guide

## getting started

There's generally 2 ways to use Zest:

1. Use the bundler to convert your game automatically _(easy)_
2. Download and integrate with the core runtime library _(advanced)_

The first option does not require any coding, but customisation is more limited.
The second option entails importing the library into your own HTML/JS project,
and using the <a href="{{ site.baseurl }}/docs">API reference</a> to load and run your game.

> **Skip directly to:** \
> [PulpScript Extensions](#special-pulpscript-extensions) • [Bundler Instructions](#bundler-instructions)

## Special PulpScript extensions

Some extensions to the runtime make it easier to maintain a single Pulp game
while still being able to use some Zest features:

Use `event.zest == 1` to detect if the game is currently running in Zest. This can be useful to change some of your game's default settings, or enabling alternative controls for e.g. the crank.

Set `config.colorBlack` and `config.colorWhite` to control the color palette. You can do this once (e.g. in the `load` event of your Game script), or change the colors multiple times, for example have a unique palette for each room.

To opt-out of simulating the device appearance (the default colors), you can use this to switch to pure black an white:

```
on load do
  config.colorBlack = "#000000"
  config.colorWhite = "#ffffff"
end
```

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
