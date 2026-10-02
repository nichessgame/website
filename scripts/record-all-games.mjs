#!/usr/bin/env node
//
// Record every .txt game in scripts/games as a 1080x1920 MP4.
//
// Prerequisites:
//   - Dev server running (npm run dev)
//   - ffmpeg and ffprobe installed and on PATH
//
// Usage:
//   node scripts/record-all-games.mjs

import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const gamesDir = path.join(__dirname, 'games');
const recorder = path.join(__dirname, 'record-game.mjs');

const games = fs.readdirSync(gamesDir, { withFileTypes: true })
  .filter(entry => entry.isFile() && entry.name.endsWith('.txt'))
  .map(entry => entry.name)
  .sort();

if (games.length === 0) {
  console.error(`No .txt game files found in ${gamesDir}`);
  process.exit(1);
}

console.log(`Found ${games.length} game${games.length === 1 ? '' : 's'} in ${gamesDir}`);

const failed = [];
for (const game of games) {
  const moves = path.join(gamesDir, game);
  const output = path.join(gamesDir, game.replace(/\.txt$/, '.mp4'));

  console.log(`\n=== ${game} -> ${path.basename(output)} ===`);
  try {
    execFileSync(process.execPath, [
      recorder,
      '--moves', moves,
      '--output', output,
      '--size', '1080',
      '--scale', '1',
      '--fps', '60',
    ], {
      cwd: projectRoot,
      stdio: 'inherit',
    });
  } catch {
    failed.push(game);
    console.error(`Failed to record ${game}`);
  }
}

if (failed.length > 0) {
  console.error(`\n${failed.length} game${failed.length === 1 ? '' : 's'} failed:`);
  for (const game of failed) console.error(`  - ${game}`);
  process.exit(1);
}

console.log(`\nRecorded ${games.length} game${games.length === 1 ? '' : 's'} successfully.`);
