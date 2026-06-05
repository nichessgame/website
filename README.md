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

## Board display settings

User-facing board display settings live in `src/stores/app.js` and are persisted in
local storage. The health point text theme is stored under
`nichess-health-text-theme` and can be changed from the board settings button shown
next to each chessboard.

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
