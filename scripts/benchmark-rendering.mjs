#!/usr/bin/env node

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import puppeteer from 'puppeteer';
import { createServer } from 'vite';

const defaultThemes = ['light-gold-1', 'light-gold-2', 'dark-gold-1', 'dark-gold-2'];
const defaultModes = [
  { name: 'health', healthPointsVisible: true, abilityPointsVisible: false },
  { name: 'health+ability', healthPointsVisible: true, abilityPointsVisible: true },
];
const traceCategories = [
  'devtools.timeline',
  'blink.user_timing',
  'disabled-by-default-devtools.timeline.frame',
];
const traceDurationEvents = {
  FunctionCall: 'scriptMs',
  EvaluateScript: 'scriptMs',
  EventDispatch: 'scriptMs',
  TimerFire: 'scriptMs',
  FireAnimationFrame: 'scriptMs',
  UpdateLayoutTree: 'styleMs',
  RecalculateStyles: 'styleMs',
  Layout: 'layoutMs',
  Paint: 'paintMs',
  CompositeLayers: 'compositeMs',
  DrawFrame: 'drawFrameMs',
};

const args = parseArgs(process.argv.slice(2));
const iterations = numberArg(args.iterations, 80);
const samples = numberArg(args.samples, 5);
const warmups = numberArg(args.warmups, 1, 0);
const viewportWidth = numberArg(args.width, 900);
const viewportHeight = numberArg(args.height, 920);
const themes = listArg(args.themes, defaultThemes);
const modes = listArg(args.modes, defaultModes.map(mode => mode.name))
  .map(modeName => defaultModes.find(mode => mode.name === modeName))
  .filter(Boolean);
const label = args.label || 'current';
const verbose = args.verbose === true || args.verbose === 'true';
const websiteRoot = process.cwd();
const vueRuntimePath = path.resolve(websiteRoot, 'node_modules/vue/dist/vue.esm-bundler.js');
const boardPackageRoot = path.resolve(websiteRoot, 'node_modules/vue3-nichessboard');
const boardBundlePath = path.resolve(boardPackageRoot, 'dist/vue3-nichessboard.js');
const boardStylePath = path.resolve(boardPackageRoot, 'dist/style.css');

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'nichess-render-bench-'));

let server;
let browser;

try {
  await writeBenchmarkApp(tempRoot);
  server = await createServer({
    root: tempRoot,
    logLevel: 'silent',
    server: { host: '127.0.0.1', port: 0 },
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    },
    resolve: {
      alias: [
        { find: /^vue3-nichessboard\/style\.css$/, replacement: boardStylePath },
        { find: /^vue3-nichessboard$/, replacement: boardBundlePath },
        { find: /^vue$/, replacement: vueRuntimePath },
      ],
    },
    optimizeDeps: {
      include: ['vue', 'vue3-nichessboard'],
    },
  });
  await server.listen();

  const address = server.httpServer.address();
  const baseUrl = `http://127.0.0.1:${address.port}/`;

  browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--no-sandbox',
    ],
  });

  const page = await browser.newPage();
  if (verbose) page.on('console', message => console.error(`[browser:${message.type()}] ${message.text()}`));
  page.on('pageerror', error => console.error(`[browser:error] ${error.stack || error.message}`));
  page.on('requestfailed', request =>
    console.error(`[browser:requestfailed] ${request.url()} ${request.failure()?.errorText || ''}`)
  );
  await page.setViewport({ width: viewportWidth, height: viewportHeight, deviceScaleFactor: 1 });
  await page.goto(baseUrl, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__nichessRenderBench?.ready === true);

  const results = [];
  for (const theme of themes) {
    for (const mode of modes) {
      const result = await runCase(page, { theme, mode, iterations, samples, warmups });
      results.push(result);
      printCase(result);
    }
  }

  printSummary({ label, iterations, samples, warmups, viewportWidth, viewportHeight, results });
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
  await fs.rm(tempRoot, { recursive: true, force: true });
}

async function runCase(page, { theme, mode, iterations, samples, warmups }) {
  const measurements = [];

  for (let i = 0; i < warmups; i++) {
    await page.evaluate(
      ({ theme, mode, iterations }) => window.__nichessRenderBench.run({ theme, mode, iterations }),
      { theme, mode, iterations: Math.min(20, iterations) }
    );
  }

  for (let i = 0; i < samples; i++) {
    await page.evaluate(
      ({ theme, mode }) => window.__nichessRenderBench.configure({ theme, mode }),
      { theme, mode }
    );

    await page.tracing.start({ categories: traceCategories });
    const browserMetrics = await page.evaluate(
      ({ theme, mode, iterations }) => window.__nichessRenderBench.run({ theme, mode, iterations }),
      { theme, mode, iterations }
    );
    const traceBuffer = await page.tracing.stop();
    const traceMetrics = traceToMetrics(JSON.parse(Buffer.from(traceBuffer).toString('utf8')));

    measurements.push({
      ...browserMetrics,
      ...traceMetrics,
    });
  }

  return {
    theme,
    mode: mode.name,
    iterations,
    samples,
    metrics: summarizeMeasurements(measurements),
  };
}

function traceToMetrics(trace) {
  const metrics = {
    scriptMs: 0,
    styleMs: 0,
    layoutMs: 0,
    paintMs: 0,
    compositeMs: 0,
    drawFrameMs: 0,
    longFrameCount: 0,
    worstFrameMs: 0,
  };

  for (const event of trace.traceEvents || []) {
    if (event.ph !== 'X') continue;

    const metric = traceDurationEvents[event.name];
    const durationMs = (event.dur || 0) / 1000;
    if (metric) metrics[metric] += durationMs;

    if (event.name === 'DrawFrame') {
      metrics.worstFrameMs = Math.max(metrics.worstFrameMs, durationMs);
      if (durationMs > 16.7) metrics.longFrameCount += 1;
    }
  }

  return metrics;
}

function summarizeMeasurements(measurements) {
  const keys = Object.keys(measurements[0]);
  const summary = {};

  for (const key of keys) {
    const values = measurements.map(measurement => measurement[key]);
    summary[key] = {
      median: median(values),
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  return summary;
}

function printCase(result) {
  const { metrics } = result;
  console.log(
    [
      `${result.theme.padEnd(8)} ${result.mode.padEnd(14)}`,
      `total ${formatMs(metrics.totalMs.median)}`,
      `script ${formatMs(metrics.scriptMs.median)}`,
      `style ${formatMs(metrics.styleMs.median)}`,
      `layout ${formatMs(metrics.layoutMs.median)}`,
      `paint ${formatMs(metrics.paintMs.median)}`,
      `composite ${formatMs(metrics.compositeMs.median)}`,
      `longTasks ${metrics.longTaskCount.median}`,
      `longFrames ${metrics.longFrameCount.median}`,
    ].join(' | ')
  );
}

function printSummary({ label, iterations, samples, warmups, viewportWidth, viewportHeight, results }) {
  const payload = {
    label,
    iterations,
    samples,
    warmups,
    viewport: { width: viewportWidth, height: viewportHeight },
    results,
  };

  console.log('\nJSON_RESULT_START');
  console.log(JSON.stringify(payload, null, 2));
  console.log('JSON_RESULT_END');
}

function median(values) {
  const sorted = values.toSorted((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function formatMs(value) {
  return `${value.toFixed(1)}ms`;
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const [rawKey, inlineValue] = arg.slice(2).split('=');
    parsed[rawKey] = inlineValue ?? argv[++i] ?? true;
  }
  return parsed;
}

function numberArg(value, fallback, minimum = 1) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= minimum ? parsed : fallback;
}

function listArg(value, fallback) {
  if (!value) return fallback;
  return String(value)
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

async function writeBenchmarkApp(root) {
  await fs.mkdir(path.join(root, 'src'), { recursive: true });

  await fs.writeFile(
    path.join(root, 'index.html'),
    '<!doctype html><html><head><meta charset="UTF-8" /><title>Nichess render benchmark</title><link rel="stylesheet" href="/style.css" /></head><body><div id="app"></div><script type="module" src="/src/main.js"></script></body></html>'
  );

  await fs.writeFile(
    path.join(root, 'src/main.js'),
    `
import { createApp, nextTick, reactive } from 'vue';
import { TheChessboard } from 'vue3-nichessboard';
import 'vue3-nichessboard/style.css';

const state = reactive({
  config: {
    animation: { enabled: true, duration: 80 },
    healthAndAbilityPointsText: {
      healthPointsVisible: true,
      abilityPointsVisible: true,
      theme: 'dark-gold-2',
    },
    drawable: { enabled: false, visible: false },
    movable: { showDests: false },
    highlight: { lastMove: false, check: false },
  },
});

let boardApi;

window.__nichessRenderBench = {
  ready: false,
  configure,
  run,
};

const app = createApp({
  components: { TheChessboard },
  setup() {
    return { state, onBoardCreated };
  },
  template: '<main><TheChessboard :board-config="state.config" :reactive-config="true" @board-created="onBoardCreated" /></main>',
});

app.mount('#app');

function onBoardCreated(api) {
  boardApi = api;
  window.__nichessRenderBench.ready = true;
}

async function configure({ theme, mode }) {
  state.config.healthAndAbilityPointsText = {
    healthPointsVisible: mode.healthPointsVisible,
    abilityPointsVisible: mode.abilityPointsVisible,
    theme,
  };
  boardApi.resetBoard();
  boardApi.setConfig({ healthAndAbilityPointsText: state.config.healthAndAbilityPointsText });
  await settle();
}

async function run({ theme, mode, iterations }) {
  await configure({ theme, mode });

  const longTasks = [];
  const observer = new PerformanceObserver(list => {
    longTasks.push(...list.getEntries().map(entry => entry.duration));
  });
  observer.observe({ type: 'longtask', buffered: true });

  performance.mark('bench-start');
  for (let i = 0; i < iterations; i++) {
    const move = firstLegalMove();
    boardApi.move(move, false);
    await settle();
    boardApi.undoLastMove();
    await settle();
  }
  performance.mark('bench-end');
  performance.measure('nichess-render-bench', 'bench-start', 'bench-end');
  observer.disconnect();

  const measure = performance.getEntriesByName('nichess-render-bench').at(-1);
  performance.clearMarks();
  performance.clearMeasures();

  return {
    totalMs: measure.duration,
    perCycleMs: measure.duration / iterations,
    longTaskCount: longTasks.length,
    longTaskMs: longTasks.reduce((sum, duration) => sum + duration, 0),
    worstLongTaskMs: longTasks.length ? Math.max(...longTasks) : 0,
  };
}

function firstLegalMove() {
  const moves = boardApi.getPossibleMoves();
  for (const from of Array.from(moves.keys()).sort()) {
    const destinations = moves.get(from);
    if (destinations?.length) return { from, to: Array.from(destinations).sort()[0] };
  }
  throw new Error('No legal move found for benchmark position.');
}

function settle() {
  return new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}
`,
    'utf8'
  );

  await fs.writeFile(
    path.join(root, 'package.json'),
    JSON.stringify({ type: 'module', dependencies: { vue: '*', 'vue3-nichessboard': '*' } }, null, 2)
  );

  await fs.writeFile(
    path.join(root, 'style.css'),
    `
html,
body,
#app {
  margin: 0;
  min-height: 100%;
  background: #242424;
}

main {
  width: 720px;
  max-width: calc(100vw - 32px);
  margin: 16px auto;
}
`,
    'utf8'
  );
}
