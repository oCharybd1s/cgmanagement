import sharp from "sharp";
import toIco from "to-ico";
import { mkdir, writeFile } from "node:fs/promises";

const PRIMARY = "#463676";
const MARK_COLOR = "#ffffff";
const VIEWBOX = 720;
const MARK_PATH =
  "M345.5 106.1c-84.6 7.8-157.4 55.8-194.3 128-18.3 35.8-27.7 69.8-30.6 110.6l-.5 7.3h40.8l.5-5.3c.3-2.8 1-9.9 1.6-15.7 4.9-49 28.3-98.1 62.1-130.6 27.4-26.3 63.3-45.3 98.9-52.3 18.7-3.6 27.2-4.5 47-4.5 34.8 0 62.8 5.9 89.8 18.9 44.2 21.2 72 54.7 90.2 108.5l5.6 16.5 18.9.3c10.4.1 19.5 0 20.2-.2 1.4-.6-.4-7.8-7.7-29.6-17.3-52.4-45.6-90.6-88.5-119.5-20.7-13.9-53.9-25.5-87.2-30.5-16-2.4-50.9-3.4-66.8-1.9m1 71c-43.3 5.6-84.7 28.2-112.4 61.4-19.9 23.9-34.2 53.3-40 82-6 29.8-5.5 63.3 1.4 90.5 17.9 70.9 70.4 122.2 139.6 136.2 10.1 2 14.1 2.3 35.9 2.3 22.7-.1 25.4-.3 37.1-2.8 34.8-7.4 62.1-22.1 83.9-45.4 9.5-10.1 19.9-25.4 26.4-38.7 12.9-26.2 20.6-63.3 20.6-98.9V352H419.6c-65.7 0-119.7.3-119.9.7-.3.5-.3 9.5 0 20l.6 19.3h193.6l-.5 3.7c-1.7 11.9-4.9 26.4-7.5 34.1-14.7 41.6-44.4 67-88.5 75.9-12.8 2.5-44.5 2.5-56.4-.1-24.9-5.4-46.3-16.7-63.4-33.3-22.1-21.7-35-46.7-40.7-79.2-2.9-16.4-2.9-43.9 0-60.5 5.2-29.2 17.6-54.4 36.6-74.5 25.8-27.1 63.1-41.6 102.5-39.8 48 2.2 83.8 23.7 103.1 61.9l3.9 7.8h22.5c12.4 0 22.5-.2 22.5-.5s-1.6-4.6-3.5-9.6c-25.4-65.8-81.4-102.4-155.8-101.8-8.4.1-18.3.6-22.2 1M122 393.4c0 8.7 6.6 38.3 12.3 55.1 22.6 66.4 62.9 113.8 121.7 142.9 31.4 15.6 60.2 23.1 97.9 25.7 52.8 3.5 108.6-9.1 144.8-32.6 36.6-23.9 64.5-57.5 81.6-98.5 6.8-16.3 17.2-49.2 15.9-50.5-.3-.3-9.4-.5-20.3-.5-18 0-19.8.2-20.3 1.7-3.8 13.5-5.6 18.6-9.7 29.1-10.5 26.2-21.1 43.2-38.3 61.1-30.4 31.5-71.4 48.8-123.1 52-77.1 4.8-146.5-28.8-187.5-90.6-16.5-25-28.9-58-33-88.1l-1.3-9.2H122z";

function markSvg({ size, padding, rounded }) {
  const inner = size - padding * 2;
  const scale = inner / VIEWBOX;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <clipPath id="clip">
        <rect width="${size}" height="${size}" rx="${rounded ? size * 0.22 : 0}" />
      </clipPath>
    </defs>
    <g clip-path="url(#clip)">
      <rect width="${size}" height="${size}" fill="${PRIMARY}" />
      <g transform="translate(${padding}, ${padding}) scale(${scale})">
        <path d="${MARK_PATH}" fill="${MARK_COLOR}" />
      </g>
    </g>
  </svg>`;
}

async function renderBuffer(size, options) {
  return sharp(Buffer.from(markSvg({ size, ...options })))
    .png()
    .toBuffer();
}

async function render(path, size, options) {
  const buffer = await renderBuffer(size, options);
  await writeFile(path, buffer);
  console.log(`generated ${path}`);
}

async function renderFavicon(path) {
  const sizes = [16, 32, 48];
  const buffers = await Promise.all(
    sizes.map((size) => renderBuffer(size, { padding: Math.round(size * 0.12), rounded: false }))
  );
  const ico = await toIco(buffers);
  await writeFile(path, ico);
  console.log(`generated ${path}`);
}

async function main() {
  const iconsDir = new URL("../public/icons/", import.meta.url);
  const appDir = new URL("../app/", import.meta.url);
  await mkdir(iconsDir, { recursive: true });

  await render(new URL("icon-192.png", iconsDir).pathname, 192, { padding: 30, rounded: true });
  await render(new URL("icon-512.png", iconsDir).pathname, 512, { padding: 80, rounded: true });
  await render(new URL("icon-maskable-512.png", iconsDir).pathname, 512, { padding: 140, rounded: false });
  await render(new URL("apple-touch-icon.png", iconsDir).pathname, 180, { padding: 26, rounded: false });
  await renderFavicon(new URL("favicon.ico", appDir).pathname);
}

main();
