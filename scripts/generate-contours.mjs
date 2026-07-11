import { createNoise2D } from "simplex-noise";
import { contours } from "d3-contour";
import { line, curveBasisClosed } from "d3-shape";
import { writeFile, mkdir } from "node:fs/promises";

const GRID = 90;
const LEVELS = 9;
const OCTAVES = 3;

function fbm(noise2D, x, y) {
  let amplitude = 1;
  let frequency = 1;
  let sum = 0;
  let max = 0;
  for (let i = 0; i < OCTAVES; i++) {
    sum += amplitude * noise2D(x * frequency, y * frequency);
    max += amplitude;
    amplitude *= 0.52;
    frequency *= 2.15;
  }
  return sum / max;
}

function buildGrid(seedFn) {
  const values = new Array(GRID * GRID);
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const nx = x / GRID;
      const ny = y / GRID;
      values[y * GRID + x] = fbm(seedFn, nx * 1.7, ny * 1.7);
    }
  }
  return values;
}

function ringToPath(ring) {
  const points = ring.map(([x, y]) => [x, y]);
  const generator = line()
    .curve(curveBasisClosed)
    .x((d) => d[0])
    .y((d) => d[1]);
  return generator(points);
}

function buildContourPaths() {
  const noise2D = createNoise2D();
  const values = buildGrid(noise2D);

  const min = Math.min(...values);
  const max = Math.max(...values);
  const thresholds = Array.from({ length: LEVELS }, (_, i) => min + ((i + 0.5) / LEVELS) * (max - min));

  const generator = contours().size([GRID, GRID]).thresholds(thresholds);
  const contourData = generator(values);

  const paths = [];
  contourData.forEach((feature, levelIndex) => {
    feature.coordinates.forEach((polygon) => {
      polygon.forEach((ring) => {
        if (ring.length < 6) return;
        const scaled = ring.map(([x, y]) => [(x / GRID) * 400, (y / GRID) * 400]);
        paths.push({ level: levelIndex, d: ringToPath(scaled) });
      });
    });
  });

  return paths;
}

async function main() {
  const paths = buildContourPaths();

  const libDir = new URL("../lib/", import.meta.url);
  const scriptsDir = new URL("./", import.meta.url);
  await mkdir(libDir, { recursive: true });

  const tsContent = `export type ContourPath = { level: number; d: string };

export const contourViewBox = "0 0 400 400";

export const contourPaths: ContourPath[] = ${JSON.stringify(paths, null, 2)};
`;

  await writeFile(new URL("contour-paths.ts", libDir).pathname, tsContent);
  await writeFile(
    new URL("contour-data.json", scriptsDir).pathname,
    JSON.stringify({ viewBox: "0 0 400 400", paths }, null, 2),
  );
  console.log(`generated ${paths.length} contour paths`);
}

main();
