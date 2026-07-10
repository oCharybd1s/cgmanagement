import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const PRIMARY = "#3E3568";
const SPARK = "#E7B24A";
const LINE = "#EDEAF7";

function markSvg({ size, padding, rounded }) {
  const inner = size - padding * 2;
  const c = size / 2;
  const r = inner * 0.34;
  const nodeR = inner * 0.052;
  const centerR = inner * 0.075;

  const points = [
    [c - r * 0.95, c - r * 0.62],
    [c + r * 0.95, c - r * 0.62],
    [c - r * 0.95, c + r * 0.62],
    [c + r * 0.95, c + r * 0.62],
  ];

  const lines = points
    .map(([x, y]) => `<line x1="${c}" y1="${c}" x2="${x}" y2="${y}" stroke="${LINE}" stroke-width="${inner * 0.018}" stroke-linecap="round" opacity="0.85" />`)
    .join("");

  const nodes = points
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${nodeR}" fill="${LINE}" opacity="0.9" />`)
    .join("");

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" rx="${rounded ? size * 0.22 : 0}" fill="${PRIMARY}" />
    ${lines}
    ${nodes}
    <circle cx="${c}" cy="${c}" r="${centerR}" fill="${SPARK}" />
  </svg>`;
}

async function render(path, size, options) {
  await sharp(Buffer.from(markSvg({ size, ...options })))
    .png()
    .toFile(path);
  console.log(`generated ${path}`);
}

async function main() {
  const outDir = new URL("../public/icons/", import.meta.url);
  await mkdir(outDir, { recursive: true });

  await render(new URL("icon-192.png", outDir).pathname, 192, { padding: 24, rounded: true });
  await render(new URL("icon-512.png", outDir).pathname, 512, { padding: 64, rounded: true });
  await render(new URL("icon-maskable-512.png", outDir).pathname, 512, { padding: 110, rounded: false });
  await render(new URL("apple-touch-icon.png", outDir).pathname, 180, { padding: 18, rounded: false });
}

main();
