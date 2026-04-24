#!/usr/bin/env node
/**
 * Jana PNG icons dari SVG untuk PWA, iOS, Android, dan browser legacy.
 * Jalankan: node scripts/generate-icons.js
 * Keperluan: npm install @resvg/resvg-js --prefix /tmp/icon-gen
 */

const { Resvg } = require('/tmp/icon-gen/node_modules/@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ICONS_DIR = path.join(ROOT, 'icons');

const tasks = [
  { src: 'icon.svg',          out: 'apple-touch-icon.png',   size: 180 },
  { src: 'icon.svg',          out: 'icon-192.png',            size: 192 },
  { src: 'icon.svg',          out: 'icon-512.png',            size: 512 },
  { src: 'icon-maskable.svg', out: 'icon-maskable-512.png',   size: 512 },
  { src: 'icon.svg',          out: 'favicon-32x32.png',       size: 32  },
];

for (const { src, out, size } of tasks) {
  const svgPath = path.join(ICONS_DIR, src);
  const outPath = path.join(ICONS_DIR, out);
  const svg = fs.readFileSync(svgPath, 'utf8');

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  fs.writeFileSync(outPath, pngBuffer);
  console.log(`✓ ${out} (${size}×${size})`);
}

console.log('Selesai. Semua PNG icons dijana.');
