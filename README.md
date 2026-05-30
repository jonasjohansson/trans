# matte

A standalone **WebGPU matte-video builder**. It generates black/white animated
mattes (and optional A→B image transitions) for use as luma/track mattes in
After Effects — built for the ELVERKET "Det Mörka Ljuset" installation
(Lars Lerin watercolours).

Live: **matte.jonasjohansson.se** · Deployed as static files on GitHub Pages.

## Run locally

Plain static files using **native ES modules** — no build step, no bundler.
Serve the folder over `http://localhost` (WebGPU needs a secure context; a plain
`file://` or http-to-IP will not expose WebGPU):

```
python3 -m http.server 8123
# open http://localhost:8123/index.html  (Chrome/Edge 113+, Safari 18+)
```

Deps (`tweakpane`, `mp4-muxer`) load at runtime from esm.sh via the importmap in
`index.html`. Deploy = push to `main` → GitHub Pages serves the files.

## File layout

| file | role |
|---|---|
| `index.html` | entry point + importmap + the `<script>` tags |
| `main.js` | engine: WebGPU device, render loop, uniform packing, sources/library, paint/points, recording orchestration, the hidden Tweakpane registry, and the `window.__engine` API |
| `shader.js` | the three WGSL shader strings (display / advection-sim / init) — pure data |
| `ui.js` | the visible custom UI (controls · sources · canvas · modes · settings); drives the engine via `window.__engine` |
| `style.css` / `ui.css` | engine styles / custom-UI styles |
| `idb.js` | IndexedDB persistence (kv store + image library) — pure, reusable |
| `recorder.js` | WebCodecs codec selection — pure |
| `output.js` | File System Access "save here" folder; owns the dir handle |
| `util.js` | pure helpers (`fitInfo`, `hexToRgb`) |
| `thumbs/` | baked mode-thumbnail PNGs (`m00.png`…`m47.png`) |

The split is ongoing — the engine is being broken into more modules (state, core,
subsystems) around shared singletons; see the notes below.

## Architecture notes (read before refactoring)

- **The shared singletons.** `device`, `ctx`, `canvas`, the `state` object, and
  `bindGroup` are referenced across the engine. As the file is split, these live
  in small foundation modules (e.g. `state.js`, `core.js`) and are imported where
  needed — that's the native-ESM way to share one live reference across files.

- **The UBO ↔ shader contract.** `shader.js` declares `struct Params {…}` and
  `main.js`'s `writeUniforms()` packs the uniform buffer by byte offset. The two
  must stay in lockstep — add/reorder a uniform → update both (and `UBO_SIZE` if
  it grows). The 3 `struct Params` copies in shader.js are NOT byte-identical
  (sim/init are reduced variants) — do not blindly "dedupe" them. To add a flag
  without growing the UBO, reuse a u32 with a sentinel (e.g. `originCount==255`
  means "paint-origin").

- **Tweakpane is hidden, not removed.** It lives off-screen (`#side`) as a
  side-effect registry — notably the folder-based `randomizeMode` path. The
  visible UI is `ui.js`. Don't delete the Tweakpane setup.

- **`window.__engine`** is the bridge: `ui.js` only talks to the engine through
  it. Add new UI behaviour as an `__engine` method, not by reaching into globals.

## Modes

48 modes (0–47): transition modes (reveal / watercolor / painterly / light&burn)
plus 14 ambient looping fields (33–47: bokeh, ripples, glare, streaks, aurora,
godrays, clouds, caustics, embers, mist, rain, snow, marble, ink-blooms).
Photo-edge modes that "looked digital" live in a de-emphasised **Archive** group.
