# Website

Hosted at [https://www.nichess.org/](https://www.nichess.org/)

Build instructions:

1. Install [Git LFS](https://git-lfs.com/) and run:

```
git lfs pull
```

2. Clone and compile [nichess-ts](https://github.com/nichessgame/nichess-ts), [nichessground](https://github.com/nichessgame/nichessground) and [vue3-nichessboard](https://github.com/nichessgame/vue3-nichessboard)

3. Install dependencies

```
npm install
npm install path-to-nichess-ts/dist
npm install path-to-nichessground
npm install path-to-vue3-nichessboard
```
Make sure to include the dist part when installing nichess-ts.

4. Build
```
npm run build
```

5. Start dev server
```
npm run dev
```

## Recording games

Start the development server with `npm run dev`, then record a move file with:

```bash
node scripts/record-game.mjs --moves scripts/sample_moves.txt --output replay.mp4
```

The script requires `ffmpeg` and `ffprobe` and uses `/gamerecorder`, a board-only
page with a Puppeteer API. This page is available only in development, has no
navigation links, and is excluded from production routes and bundles.

Move files contain numbered moves such as `1.e2 -> e4`. For tutorials, they may
also contain `SET_POSITION "<encoded Nichess board>"` commands, including illegal
positions. Leading commands set the starting position; commands between moves
replace the board immediately and do not count toward move numbering or timing.
These commands are supported only by the recorder. The public Game Viewer
accepts ordinary legal move histories.

To record all `.txt` files in `scripts/games`, run
`node scripts/record-all-games.mjs`. See `node scripts/record-game.mjs --help` for
resolution, timing, orientation, and sound options.

## Rendering benchmarks

Use the rendering benchmark to compare board point-label performance across
themes and visibility modes:

```bash
node scripts/benchmark-rendering.mjs --iterations=80 --samples=5 --warmups=1 --themes=light-gold-1,light-gold-2,dark-gold-1,dark-gold-2 --modes=health,health+ability
```

Before running or committing changes to the benchmark script, you can check that
Node can parse it:

```bash
node --check scripts/benchmark-rendering.mjs
```

This is a syntax check only. No output means the script parsed successfully; a
syntax error will be printed and the command will exit with a non-zero status.

## Board display settings

User-facing board display settings live in `src/stores/app.js` and are persisted in
local storage. The point text theme is stored under `nichess-points-text-theme`
and can be changed from the board settings button shown next to each chessboard.
The default point text theme is `dark-gold-2`.

Board pages should keep their own board-specific config, make it reactive, and
apply shared display settings with `useBoardDisplaySettings`:

```js
const boardConfig = reactive({
  animation: { enabled: true, duration: 200 },
});

useBoardDisplaySettings(boardConfig);
```

Pass `:reactive-config="true"` to `TheChessboard` so changes made from the shared
board settings component update existing boards without a remount.

Use `BoardSettingsButton` next to each rendered board for user controls that are
global to board display. It owns the health text theme selector and sound toggle,
and emits `flip-board` so each page can keep its own board orientation logic.
