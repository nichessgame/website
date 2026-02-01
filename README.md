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
