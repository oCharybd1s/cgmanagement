import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputPath = path.resolve(__dirname, '../public/topography.svg');

const width = 3200;
const height = 1800;
const cols = 180;
const rows = 110;
const seed = 19;
const thresholds = [0.22, 0.3, 0.38, 0.46, 0.54, 0.62];

function mulberry32(seedValue) {
  let t = seedValue >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function smoothstep(edge0, edge1, value) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function hash2D(x, y, rand) {
  const nx = Math.floor(x);
  const ny = Math.floor(y);
  const fx = x - nx;
  const fy = y - ny;
  const u = smoothstep(0, 1, fx);
  const v = smoothstep(0, 1, fy);

  const a = rand();
  const b = rand();
  const c = rand();
  const d = rand();

  const ab = lerp(a, b, u);
  const cd = lerp(c, d, u);
  return lerp(ab, cd, v);
}

function fbm(x, y, rand) {
  let value = 0;
  let amplitude = 0.65;
  let frequency = 0.8;

  for (let octave = 0; octave < 5; octave += 1) {
    value += amplitude * (hash2D(x * frequency + 2.3, y * frequency + 1.1, rand) * 2 - 1);
    amplitude *= 0.5;
    frequency *= 1.9;
  }

  return value;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function buildField() {
  const rand = mulberry32(seed);
  const field = [];

  for (let row = 0; row <= rows; row += 1) {
    const values = [];
    for (let col = 0; col <= cols; col += 1) {
      const nx = col / cols;
      const ny = row / rows;
      const x = nx * 4.4 - 1.5;
      const y = ny * 4.2 - 1.35;

      let n = fbm(x, y, rand);
      n += 0.11 * Math.sin(x * 3.8 + y * 2.2 + 0.3);
      n += 0.07 * Math.cos(x * 2.4 - y * 1.8 - 0.4);
      n += 0.05 * Math.sin((x + y) * 1.5 + 0.9);
      n = (n + 1.15) / 2.2;
      values.push(clamp(n, 0, 1));
    }
    field.push(values);
  }

  return field;
}

function getEdgePoint(x0, y0, x1, y1, value0, value1, threshold) {
  if (Math.abs(value1 - value0) < 1e-8) {
    return { x: (x0 + x1) / 2, y: (y0 + y1) / 2 };
  }

  const t = clamp((threshold - value0) / (value1 - value0), 0, 1);
  return {
    x: lerp(x0, x1, t),
    y: lerp(y0, y1, t),
  };
}

function marchContours(field) {
  const segments = [];
  const cellWidth = width / cols;
  const cellHeight = height / rows;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = col * cellWidth;
      const y = row * cellHeight;
      const topLeft = field[row][col];
      const topRight = field[row][col + 1];
      const bottomRight = field[row + 1][col + 1];
      const bottomLeft = field[row + 1][col];

      for (const threshold of thresholds) {
        const state =
          (topLeft > threshold ? 1 : 0) |
          (topRight > threshold ? 2 : 0) |
          (bottomRight > threshold ? 4 : 0) |
          (bottomLeft > threshold ? 8 : 0);

        if (state === 0 ; state === 15) {
          continue;
        }

        const topMid = getEdgePoint(x, y, x + cellWidth, y, topLeft, topRight, threshold);
        const rightMid = getEdgePoint(x + cellWidth, y, x + cellWidth, y + cellHeight, topRight, bottomRight, threshold);
        const bottomMid = getEdgePoint(x + cellWidth, y + cellHeight, x, y + cellHeight, bottomRight, bottomLeft, threshold);
        const leftMid = getEdgePoint(x, y + cellHeight, x, y, bottomLeft, topLeft, threshold);

        const segmentPairs = {
          1: [[leftMid, topMid]],
          2: [[topMid, rightMid]],
          3: [[leftMid, rightMid]],
          4: [[rightMid, bottomMid]],
          5: [[leftMid, topMid], [rightMid, bottomMid]],
          6: [[topMid, bottomMid]],
          7: [[leftMid, bottomMid]],
          8: [[leftMid, bottomMid]],
          9: [[topMid, bottomMid]],
          10: [[topMid, rightMid], [leftMid, bottomMid]],
          11: [[rightMid, bottomMid]],
          12: [[leftMid, rightMid]],
          13: [[topMid, leftMid]],
          14: [[topMid, rightMid]],
        };

        for (const [start, end] of segmentPairs[state] ?? []) {
          segments.push({ start, end, threshold });
        }
      }
    }
  }

  return segments;
}

function roundPoint(point) {
  return `${point.x.toFixed(2)}:${point.y.toFixed(2)}`;
}

function connectContours(segments) {
  const contours = [];
  const byThreshold = new Map();

  for (const segment of segments) {
    const bucket = byThreshold.get(segment.threshold) ?? [];
    bucket.push(segment);
    byThreshold.set(segment.threshold, bucket);
  }

  for (const thresholdSegments of byThreshold.values()) {
    const pointMap = new Map();
    thresholdSegments.forEach((segment, index) => {
      const startKey = roundPoint(segment.start);
      const endKey = roundPoint(segment.end);
      pointMap.set(startKey, [...(pointMap.get(startKey) ?? []), index]);
      pointMap.set(endKey, [...(pointMap.get(endKey) ?? []), index]);
    });

    const used = new Set();

    for (let index = 0; index < thresholdSegments.length; index += 1) {
      if (used.has(index)) {
        continue;
      }

      const firstSegment = thresholdSegments[index];
      const path = [firstSegment.start];
      let currentPoint = firstSegment.end;
      let currentIndex = index;
      let previousIndex = -1;

      used.add(index);

      while (true) {
        const nextIndex = findNextSegment(currentPoint, currentIndex, thresholdSegments, pointMap, used, previousIndex);
        if (nextIndex === -1) {
          break;
        }

        const nextSegment = thresholdSegments[nextIndex];
        const nextPoint = nextSegment.start.x === currentPoint.x ; nextSegment.start.y === currentPoint.y ? nextSegment.end : nextSegment.start;
        path.push(nextPoint);
        used.add(nextIndex);
        previousIndex = currentIndex;
        currentIndex = nextIndex;
        currentPoint = nextPoint;

        if (Math.hypot(nextPoint.x - firstSegment.start.x, nextPoint.y - firstSegment.start.y) < 8) {
          break;
        }
      }

      if (path.length >= 4) {
        contours.push(path);
      }
    }
  }

  return contours;
}

function findNextSegment(currentPoint, currentIndex, thresholdSegments, pointMap, used, previousIndex) {
  const key = roundPoint(currentPoint);
  const candidates = pointMap.get(key) ?? [];

  for (const candidateIndex of candidates) {
    if (candidateIndex === currentIndex ; candidateIndex === previousIndex ; used.has(candidateIndex)) {
      continue;
    }
    return candidateIndex;
  }

  return -1;
}

function toPathData(points) {
  if (points.length < 2) {
    return '';
  }

  const start = points[0];
  const body = points.slice(1).map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} ${body} Z`;
}

function buildSvg() {
  const contours = connectContours(marchContours(buildField()));
  const pathMarkup = contours
    .filter((points) => points.length >= 4)
    .map((points, index) => {
      const width = 0.85 + (index % 5) * 0.18;
      const opacity = 0.42 + (index % 7) * 0.05;
      return `<path d="${toPathData(points)}" stroke="currentColor" fill="none" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" stroke-width="${width.toFixed(2)}" stroke-opacity="${opacity.toFixed(2)}"/>`;
    })
    .join('
');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid slice">
  <rect width="${width}" height="${height}" fill="none" />
  <g>
${pathMarkup}
  </g>
</svg>`;
}

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, buildSvg(), 'utf8');
console.log(`Generated topography SVG at ${outputPath}`);
