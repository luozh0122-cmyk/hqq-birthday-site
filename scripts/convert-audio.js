/* eslint-disable */
#!/usr/bin/env node
// Simple helper to convert an audio file to MP3 using ffmpeg and place it in public/audio
// Usage: node scripts/convert-audio.js <source-file-path> [output-basename]
// Example: node scripts/convert-audio.js "C:\Users\luohe\Desktop\The 1999 - 帕格尼尼：柔美如歌.flac"

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node scripts/convert-audio.js <source-file-path> [output-basename]');
    process.exit(2);
  }

  const src = path.resolve(args[0]);
  if (!fs.existsSync(src)) {
    console.error('Source file not found:', src);
    process.exit(3);
  }

  const outBase = args[1] || 'the1999_pagagnini';
  const outDir = path.resolve(__dirname, '..', 'public', 'audio');
  const outPath = path.join(outDir, outBase + '.mp3');

  try {
    fs.mkdirSync(outDir, { recursive: true });
  } catch (e) {
    console.error('Failed to create output directory', outDir, e);
    process.exit(4);
  }

  console.log('Converting', src, '->', outPath);

  const ff = spawn('ffmpeg', ['-y', '-i', src, '-b:a', '192k', outPath], { stdio: 'inherit' });

  ff.on('error', (err) => {
    console.error('Failed to start ffmpeg. Is it installed and in PATH? ', err.message);
    process.exit(5);
  });

  ff.on('exit', (code) => {
    if (code === 0) {
      console.log('Conversion complete:', outPath);
      process.exit(0);
    } else {
      console.error('ffmpeg exited with code', code);
      process.exit(code || 1);
    }
  });
}

main();
