import sharp from "sharp";
import { mkdir, readFile } from "node:fs/promises";

const PRIMARY = "#3E3568";
const LINE = "#EDEAF7";
const CROP = { x: 90, y: 70, size: 230 };

async function loadContours() {
  const raw = await readFile(new URL("./contour-data.json", import.meta.url), "utf-8");
  return JSON.parse(raw);
}

function markSvg({ size, padding, rounded, contours }) {
  const inner = size - padding * 2;
  const scale = inner / CROP.size;

  const linePaths = contours.paths
    .map((path) => `<path d="${path.d}" fill="none" stroke="${LINE}" stroke-width="1.9" stroke-linejoin="round" opacity="0.65" />`)
    .join("");

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <clipPath id="clip">
        <rect width="${size}" height="${size}" rx="${rounded ? size * 0.22 : 0}" />
      </clipPath>
    </defs>
    <g clip-path="url(#clip)">
      <rect width="${size}" height="${size}" fill="${PRIMARY}" />
      <g transform="translate(${padding}, ${padding}) scale(${scale}) translate(${-CROP.x}, ${-CROP.y})">
        ${linePaths}
      </g>
    </g>
  </svg>`;
}

async function render(path, size, options, contours) {
  await sharp(Buffer.from(markSvg({ size, ...options, contours })))
    .png()
    .toFile(path);
  console.log(`generated ${path}`);
}

async function main() {
  const contours = await loadContours();
  const outDir = new URL("../public/icons/", import.meta.url);
  await mkdir(outDir, { recursive: true });

  await render(new URL("icon-192.png", outDir).pathname, 192, { padding: 20, rounded: true }, contours);
  await render(new URL("icon-512.png", outDir).pathname, 512, { padding: 54, rounded: true }, contours);
  await render(new URL("icon-maskable-512.png", outDir).pathname, 512, { padding: 100, rounded: false }, contours);
  await render(new URL("apple-touch-icon.png", outDir).pathname, 180, { padding: 14, rounded: false }, contours);
}

main();
