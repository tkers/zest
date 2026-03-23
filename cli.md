---
title: Zest CLI
css: highlight
---

# Zest CLI

## command line interface

> **@TODO**
>
> This documentation is not ready yet, check back later!

---

Supports piping stdin and stdout:

```sh
cat data.json | npx github:tkers/zest minify > data.min.json
```

Headless version of the bundler:

```sh
npx github:tkers/zest bundle -a -c "#FF00AA" -p "gamepad.js,touch.js" -o "game.html" data.json
```

Also reads from `zest.conf.json` (flags overwrite config) when present:

```json
{
  "autoplay": true,
  "color": "#FF00AA",
  "plugins": ["gamepad.js", "touch.js"],
  "out": "game.html"
}
```
