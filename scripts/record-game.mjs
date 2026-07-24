#!/usr/bin/env node
//
// Record a nichess game replay as a high-quality video at any resolution.
//
// Prerequisites:
//   - ffmpeg installed and on PATH
//   - Dev server running (npm run dev)
//
// Usage:
//   node scripts/record-game.mjs -m scripts/sample_moves.txt --fps 60 -s 1080 --scale 1 --letterbox 1920x1080 -o replay.mp4
//
// The moves file format is the same as the game viewer:
//   1.e2 -> e4
//   2.d7 -> d6
//   3.g1 -> f3

import puppeteer from 'puppeteer';
import { execSync, execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(PROJECT_ROOT, 'src', 'assets');

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function printUsage() {
  console.log(`
Usage: node scripts/record-game.mjs [options]

Required:
  -m, --moves <file>        Path to moves file

Options:
  -o, --output <file>       Output video file          (default: recording.mp4)
  -s, --size <px>           Board size in CSS pixels    (default: 800)
  --scale <n>               Device scale factor         (default: 1, use 2 for 2x)
                            Output pixels = size * scale (e.g. 800 * 2 = 1600px)
  --fps <n>                 Output frame rate           (default: 30)
  --animation-duration <ms> Visible move animation time (default: 400)
  --delay <ms>              Time between moves          (default: 1000)
  --start-delay <ms>        Hold on starting position   (default: 1000)
  --end-delay <ms>          Hold on final position      (default: 2000)
  --orientation <color>     Board orientation            (default: white)
  --letterbox <WxH>         Pad board to WxH with black bars (e.g. 1920x1080)
  --no-sound                Omit sound effects
  --dev-server <url>        Dev server URL              (default: http://localhost:3000)
  -h, --help                Show this help

Examples:
  # Basic recording
  node scripts/record-game.mjs -m moves.txt -o replay.mp4

  # 1600x1600 output (800 CSS px * scale 2)
  node scripts/record-game.mjs -m moves.txt -s 800 --scale 2

  # 1080p output with black bars (board 1080x1080, padded to 1920x1080)
  node scripts/record-game.mjs -m moves.txt -s 1080 --letterbox 1920x1080

  # Fast playback, 60fps, black's perspective
  node scripts/record-game.mjs -m moves.txt --delay 500 --fps 60 --orientation black
`);
}

function parseArgs() {
  const argv = process.argv.slice(2);
  const opts = {
    moves: null,
    output: 'recording.mp4',
    size: 800,
    scale: 1,
    fps: 30,
    animationDuration: 400,
    moveDelay: 1000,
    startDelay: 1000,
    endDelay: 2000,
    orientation: 'white',
    letterbox: null,   // { w, h } if --letterbox was supplied
    sound: true,
    devServer: 'http://localhost:3000',
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case '-m': case '--moves':       opts.moves = next(); break;
      case '-o': case '--output':      opts.output = next(); break;
      case '-s': case '--size':        opts.size = parseInt(next()); break;
      case '--scale':                  opts.scale = parseFloat(next()); break;
      case '--fps':                    opts.fps = parseInt(next()); break;
      case '--animation-duration':     opts.animationDuration = parseInt(next()); break;
      case '--delay':                  opts.moveDelay = parseInt(next()); break;
      case '--start-delay':            opts.startDelay = parseInt(next()); break;
      case '--end-delay':              opts.endDelay = parseInt(next()); break;
      case '--orientation':            opts.orientation = next(); break;
      case '--letterbox': {
        const raw = next();
        const m = raw.match(/^(\d+)[xX](\d+)$/);
        if (!m) { console.error(`Error: --letterbox must be WxH (e.g. 1920x1080), got: ${raw}`); process.exit(1); }
        opts.letterbox = { w: parseInt(m[1]), h: parseInt(m[2]) };
        break;
      }
      case '--no-sound':               opts.sound = false; break;
      case '--dev-server':             opts.devServer = next(); break;
      case '-h': case '--help':        printUsage(); process.exit(0);
    }
  }

  if (!opts.moves) {
    console.error('Error: --moves is required\n');
    printUsage();
    process.exit(1);
  }

  if (!Number.isFinite(opts.animationDuration) || opts.animationDuration <= 0) {
    console.error('Error: --animation-duration must be a positive number of milliseconds.');
    process.exit(1);
  }

  if (opts.letterbox) {
    const boardPx = opts.size * opts.scale;
    if (boardPx > opts.letterbox.w || boardPx > opts.letterbox.h) {
      console.error(
        `Error: board output size (${boardPx}x${boardPx}) exceeds letterbox ` +
        `dimensions (${opts.letterbox.w}x${opts.letterbox.h}).`
      );
      process.exit(1);
    }
  }

  return opts;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function requireBinary(name) {
  try {
    execSync(`which ${name}`, { stdio: 'ignore' });
  } catch {
    console.error(`Error: "${name}" not found on PATH. Please install it first.`);
    process.exit(1);
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Audio generation
// ---------------------------------------------------------------------------

function buildAudioTrack(moves, opts, tmpDir) {
  const moveSound = path.join(ASSETS_DIR, 'Move.ogg');
  const captureSound = path.join(ASSETS_DIR, 'Capture.ogg');

  if (!fs.existsSync(moveSound) || !fs.existsSync(captureSound)) {
    console.warn('Sound assets not found, skipping audio.');
    return null;
  }

  // Schedule each sound so its end lines up with the end of the visible
  // animation. The sound files have different durations, so determine the
  // duration from the actual asset rather than using one fixed offset.
  const audioDurationMs = new Map();
  for (const sound of [moveSound, captureSound]) {
    try {
      const durationSec = Number(execFileSync(
        'ffprobe',
        ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', sound],
        { encoding: 'utf8' },
      ).trim());
      if (!Number.isFinite(durationSec) || durationSec < 0) throw new Error('invalid duration');
      audioDurationMs.set(sound, Math.ceil(durationSec * 1000));
    } catch {
      console.warn(`Could not determine duration for ${path.basename(sound)}, skipping audio.`);
      return null;
    }
  }

  const audioFile = path.join(tmpDir, 'audio.wav');
  const totalDurationSec =
    opts.startDelay / 1000 +
    (moves.length - 1) * (opts.moveDelay / 1000) +
    opts.endDelay / 1000;

  // Build ffmpeg filter_complex — one delayed copy of the appropriate sound per move.
  const inputs = [];
  const filterLines = [];
  const padLabels = [];

  for (let i = 0; i < moves.length; i++) {
    const src = moves[i].attack ? captureSound : moveSound;
    inputs.push('-i', src);
    const moveWindowMs = i === moves.length - 1 ? opts.endDelay : opts.moveDelay;
    const animationDurationMs = Math.min(opts.animationDuration, moveWindowMs);
    const animationEndMs = opts.startDelay + i * opts.moveDelay + animationDurationMs;
    const delayMs = Math.max(0, animationEndMs - audioDurationMs.get(src));
    filterLines.push(`[${i}]adelay=${delayMs}|${delayMs}[a${i}]`);
    padLabels.push(`[a${i}]`);
  }

  let filterComplex;
  if (moves.length === 1) {
    filterComplex = filterLines[0].replace(`[a0]`, `[mixed]`);
  } else {
    filterComplex =
      filterLines.join('; ') +
      `; ${padLabels.join('')}amix=inputs=${moves.length}:normalize=0:duration=longest[mixed]`;
  }
  // amix ends after the final sound effect; pad it so `-shortest` does not
  // truncate the video's requested final-position hold.
  filterComplex += `; [mixed]apad=whole_dur=${totalDurationSec}[out]`;

  const filterFile = path.join(tmpDir, 'audio_filter.txt');
  fs.writeFileSync(filterFile, filterComplex);

  const args = [
    'ffmpeg', '-y',
    ...inputs,
    '-filter_complex_script', filterFile,
    '-map', '[out]',
    '-t', String(totalDurationSec),
    '-ac', '2',
    audioFile,
  ];

  try {
    execSync(args.join(' '), { stdio: 'pipe', cwd: tmpDir });
    return audioFile;
  } catch (e) {
    console.warn('Audio generation failed, proceeding without audio.');
    console.warn(e.stderr?.toString().slice(0, 300));
    return null;
  }
}

// ---------------------------------------------------------------------------
// Video encoding
// ---------------------------------------------------------------------------

function encodeVideo(frames, audioFile, opts, tmpDir) {
  const concatFile = path.join(tmpDir, 'concat.txt');
  let content = '';
  for (const { file, frameCount } of frames) {
    // The concat demuxer gives still images a 1/25 time base by default, so
    // sub-40 ms `duration` values are rounded before the output frame rate is
    // applied. At 30/60/120 fps that drops animation frames and duplicates
    // others, which makes motion visibly stutter. Repeat each image once per
    // intended output frame and force the input timestamps to the requested
    // CFR instead.
    for (let i = 0; i < frameCount; i++) {
      content += `file '${file}'\n`;
    }
  }
  fs.writeFileSync(concatFile, content);

  const outputPath = path.resolve(opts.output);

  const args = [
    'ffmpeg', '-y',
    '-r', String(opts.fps),
    '-f', 'concat', '-safe', '0', '-i', concatFile,
  ];

  if (audioFile) {
    args.push('-i', audioFile);
  }

  // Build the video filter chain.
  // DevTools screencast frames use CSS-pixel dimensions and ignore the page's
  // device scale factor, so explicitly scale them to the requested output size.
  // Force BT.709 matrix during the RGB→YUV conversion (swscale default for
  // sub-HD content is BT.601, which mismatches the BT.709 decode in players).
  const boardPx = Math.round(opts.size * opts.scale);
  let vf = `scale=${boardPx}:${boardPx}:flags=lanczos:in_range=full:out_range=limited:out_color_matrix=bt709`;
  if (opts.letterbox) {
    const { w, h } = opts.letterbox;
    if (boardPx > w || boardPx > h) {
      throw new Error(
        `Board frame size (${boardPx}x${boardPx}) exceeds letterbox dimensions ` +
        `(${w}x${h}). Reduce --size or --scale so the board fits.`
      );
    }
    const padX = Math.floor((w - boardPx) / 2);
    const padY = Math.floor((h - boardPx) / 2);
    vf += `,pad=${w}:${h}:${padX}:${padY}:black`;
  }

  args.push(
    '-vf', vf,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-colorspace', 'bt709',
    '-color_primaries', 'bt709',
    '-color_trc', 'bt709',
    '-r', String(opts.fps),
    '-movflags', '+faststart',
  );

  if (audioFile) {
    args.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
  }

  args.push(outputPath);

  // Use execFileSync (not execSync) so args are passed directly to ffmpeg
  // without shell interpretation — needed because the pad filter expression
  // contains parentheses that /bin/sh would misparse.
  execFileSync(args[0], args.slice(1), { stdio: 'pipe' });
  return outputPath;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const opts = parseArgs();
  requireBinary('ffmpeg');

  if (!fs.existsSync(opts.moves)) {
    console.error(`Moves file not found: ${opts.moves}`);
    process.exit(1);
  }
  const movesText = fs.readFileSync(opts.moves, 'utf-8').trim();
  console.log(`Loaded moves from ${opts.moves}`);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nichess-rec-'));
  let browser;

  try {
    // ------------------------------------------------------------------
    // Launch browser
    // ------------------------------------------------------------------
    const vpWidth = opts.size;
    const vpHeight = opts.size;

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--force-color-profile=srgb'],
    });

    const page = await browser.newPage();
    const cdp = await page.createCDPSession();
    await page.setViewport({
      width: vpWidth,
      height: vpHeight,
      deviceScaleFactor: opts.scale,
    });

    // Suppress actual audio playback in the page
    await page.evaluateOnNewDocument(() => {
      const _Audio = window.Audio;
      window.Audio = class extends _Audio {
        play() { return Promise.resolve(); }
      };
    });

    // ------------------------------------------------------------------
    // Navigate & wait for board
    // ------------------------------------------------------------------
    const url = `${opts.devServer}/gameviewer`;
    console.log(`Opening ${url} ...`);

    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
    } catch {
      console.error(
        `Could not reach ${opts.devServer}. Is the dev server running?\n` +
        `  Start it with:  npm run dev`
      );
      process.exit(1);
    }

    await page.waitForSelector('cg-board', { timeout: 10000 });
    await page.waitForFunction(() => !!window.__gameRecorder, { timeout: 10000 });
    await sleep(300);

    console.log('Board ready');

    // ------------------------------------------------------------------
    // Load moves & set orientation
    // ------------------------------------------------------------------
    const moves = await page.evaluate((text) => {
      return window.__gameRecorder.loadMoves(text);
    }, movesText);

    if (!moves || moves.length === 0) {
      console.error('No moves loaded. Check your moves file format.');
      process.exit(1);
    }

    await page.evaluate((color) => {
      window.__gameRecorder.setOrientation(color);
    }, opts.orientation);

    await sleep(200);

    console.log(`${moves.length} moves loaded (orientation: ${opts.orientation})`);

    // ------------------------------------------------------------------
    // Find the board element to screenshot
    // ------------------------------------------------------------------
    const boardEl = await page.$('.main-board');
    if (!boardEl) {
      console.error('Could not find .main-board element');
      process.exit(1);
    }

    // Screencast frames are emitted after Chromium's native rAF/layout/paint
    // lifecycle. This avoids the damage-only screenshots produced when rAF is
    // replaced and invoked synchronously by the recorder.
    await page.setViewport({
      width: opts.size,
      height: opts.size,
      deviceScaleFactor: opts.scale,
    });
    await boardEl.evaluate((el) => {
      Object.assign(el.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vw',
        paddingBottom: '0',
        zIndex: '2147483647',
      });
    });

    let screencastFrames = [];
    cdp.on('Page.screencastFrame', (event) => {
      void cdp.send('Page.screencastFrameAck', { sessionId: event.sessionId }).catch(() => {});
      screencastFrames.push(event);
    });
    await cdp.send('Page.startScreencast', {
      format: 'png',
      everyNthFrame: 1,
    });

    // ------------------------------------------------------------------
    // Capture frames
    // ------------------------------------------------------------------
    const frames = [];
    let frameIdx = 0;
    const composedCaptureFps = 30;

    function capture(data, frameCount = 1) {
      const file = path.join(tmpDir, `f${String(frameIdx).padStart(5, '0')}.png`);
      fs.writeFileSync(file, data, 'base64');
      frames.push({ file, frameCount });
      frameIdx++;
    }

    // Starting position
    process.stdout.write('Capturing: start');
    const startingFrame = await boardEl.screenshot({ encoding: 'base64' });
    capture(startingFrame, Math.max(1, Math.round(opts.startDelay * opts.fps / 1000)));

    // Each move
    for (let i = 0; i < moves.length; i++) {
      const isLast = i === moves.length - 1;
      const totalMoveTimeMs = isLast ? opts.endDelay : opts.moveDelay;
      const outputAnimationMs = Math.min(opts.animationDuration, totalMoveTimeMs);
      const animFrameCount = Math.max(
        1,
        Math.round(outputAnimationMs * opts.fps / 1000),
      );

      // Capture the same easing curve in slow motion so every requested output
      // frame has its own fully composed source position. The slow capture time
      // never leaks into the encoded timeline.
      const captureAnimationMs = Math.max(
        outputAnimationMs,
        Math.ceil(animFrameCount * 1000 / composedCaptureFps) + 100,
      );
      await page.evaluate((duration) => {
        window.__gameRecorder.setAnimationDuration(duration);
      }, captureAnimationMs);

      screencastFrames = [];
      await page.keyboard.press('ArrowRight');
      await sleep(captureAnimationMs + 100);

      if (screencastFrames.length === 0) {
        throw new Error(`Chromium did not produce frames for move ${i + 1}.`);
      }

      // Screencast alternates a fully composed display frame with a damage
      // update. Damage frames omit unchanged layers and were the source of the
      // visible flicker/stutter in the old recorder. Keep the composed frames
      // and append an explicit final-position screenshot after animation ends.
      const composedFrames = screencastFrames.filter((_, index) => index % 2 === 0);
      const finalFrame = await boardEl.screenshot({ encoding: 'base64' });
      composedFrames.push({ data: finalFrame });

      // Resample the native display frames onto the requested output rate.
      // Values above the browser's display rate duplicate source frames; 60
      // fps is the practical maximum for distinct browser paints.
      for (let frame = 0; frame < animFrameCount; frame++) {
        const sourceIndex = animFrameCount === 1
          ? composedFrames.length - 1
          : Math.round(frame * (composedFrames.length - 1) / (animFrameCount - 1));
        capture(composedFrames[sourceIndex].data);
      }

      // Repeat the final animation frame for the rest of this move's allotted
      // time. --delay is the total time per move (animation + hold).
      const totalMoveFrames = Math.max(1, Math.round(totalMoveTimeMs * opts.fps / 1000));

      if (animFrameCount > 0) {
        frames[frames.length - 1].frameCount = Math.max(
          1,
          totalMoveFrames - (animFrameCount - 1),
        );
      } else {
        // No animation frames captured (animation disabled?) — just hold
        await capture(totalMoveFrames);
      }

      process.stdout.write(`\rCapturing: move ${i + 1}/${moves.length} (${animFrameCount} anim frames)`);
    }

    console.log('\nCapture complete');

    // ------------------------------------------------------------------
    // Build audio
    // ------------------------------------------------------------------
    let audioFile = null;
    if (opts.sound) {
      process.stdout.write('Generating audio... ');
      audioFile = buildAudioTrack(moves, opts, tmpDir);
      console.log(audioFile ? 'done' : 'skipped');
    }

    // ------------------------------------------------------------------
    // Encode video
    // ------------------------------------------------------------------
    process.stdout.write('Encoding video... ');
    const outputPath = encodeVideo(frames, audioFile, opts, tmpDir);
    console.log('done');
    console.log(`\nSaved to ${outputPath}`);

  } finally {
    if (browser) await browser.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch(err => {
  console.error('Fatal:', err.message || err);
  process.exit(1);
});
