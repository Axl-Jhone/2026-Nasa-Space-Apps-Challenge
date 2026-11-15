// Quick test: measure the terrain of any place on Earth in the browser and set it beside a Moon or Mars window.
// This is NOT the pipeline. It reads open elevation tiles (Mapzen Terrain Tiles on AWS Open Data), not Copernicus DEM,
// and samples them instead of area-averaging. The measures themselves are the pipeline's, ported line for line from
// pipeline/export_terrain.py (metrics_on_grid) and pipeline/score_terrain.py (similarity). The page labels every
// number from here as a quick test, and offers a check against a pipeline value.

const TILES = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium';
const R = 6371008.8, EDGES = Array.from({ length: 21 }, (_, i) => i * 2), TREND = 5, GENTLE = 8;
const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;

/* ---- tiles: fetched at most four at a time, kept in a small cache, dropped if the user moves on ---- */
const cache = new Map();            // "z/x/y" -> Promise<Float32Array 256*256 heights>
const CACHE_MAX = 96, PARALLEL = 4;
async function decode(blob) {
  const bmp = await createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
  const c = new OffscreenCanvas(256, 256), g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(bmp, 0, 0); const d = g.getImageData(0, 0, 256, 256).data, h = new Float32Array(65536);
  for (let i = 0; i < 65536; i++) h[i] = d[4 * i] * 256 + d[4 * i + 1] + d[4 * i + 2] / 256 - 32768;   // Terrarium encoding
  return h;
}
function tile(z, x, y, signal) {
  const k = `${z}/${x}/${y}`;
  if (cache.has(k)) return cache.get(k);
  const p = fetch(`${TILES}/${k}.png`, { signal }).then(r => { if (!r.ok) throw new Error('elevation tile ' + r.status); return r.blob(); }).then(decode);
  p.catch(() => cache.delete(k));                                  // a failed or cancelled tile is asked for again next time
  cache.set(k, p);
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
  return p;
}
async function inBatches(jobs, onStep) {
  const out = new Array(jobs.length); let next = 0, done = 0;
  await Promise.all(Array.from({ length: Math.min(PARALLEL, jobs.length) }, async () => {
    while (next < jobs.length) { const i = next++; out[i] = await jobs[i](); onStep(++done, jobs.length); }
  }));
  return out;
}

/* ---- a square window in metres around one place, sampled from the tiles ---- */
export async function readWindow(lat0, lon0, windowKm, cellM, { signal, onStep = () => {} } = {}) {
  if (Math.abs(lat0) > 80) throw new Error('The open elevation tiles are not reliable beyond 80° of latitude.');
  const n = Math.round(windowKm * 1000 / cellM), c = Math.cos(rad(lat0));
  const z = Math.max(0, Math.min(12, Math.ceil(Math.log2(156543.03 * c / cellM))));   // tile pixels no coarser than the grid
  const W = 256 * Math.pow(2, z);
  const px = lon => (lon + 180) / 360 * W, py = lat => (1 - Math.log(Math.tan(rad(lat)) + 1 / Math.cos(rad(lat))) / Math.PI) / 2 * W;
  const X = new Float64Array(n), Y = new Float64Array(n);
  for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * cellM; X[i] = px(lon0 + deg(o / (R * c))) - 0.5; Y[i] = py(lat0 - deg(o / R)) - 0.5; }   // row 0 is north
  const tx0 = Math.floor(X[0] / 256), tx1 = Math.floor((X[n - 1] + 1) / 256), ty0 = Math.floor(Y[0] / 256), ty1 = Math.floor((Y[n - 1] + 1) / 256);
  const cols = tx1 - tx0 + 1, rows = ty1 - ty0 + 1, wrap = Math.pow(2, z);
  if (cols * rows > 36) throw new Error('That window needs too many elevation tiles.');
  const jobs = []; for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) jobs.push(() => tile(z, ((tx % wrap) + wrap) % wrap, ty, signal));
  const T = await inBatches(jobs, onStep);
  const at = (gx, gy) => { const tx = Math.floor(gx / 256) - tx0, ty = Math.floor(gy / 256) - ty0; return T[ty * cols + tx][(gy & 255) * 256 + (gx & 255)]; };
  const dem = new Float64Array(n * n);
  for (let j = 0; j < n; j++) { const y = Y[j], y0 = Math.floor(y), fy = y - y0;
    for (let i = 0; i < n; i++) { const x = X[i], x0 = Math.floor(x), fx = x - x0;
      dem[j * n + i] = at(x0, y0) * (1 - fx) * (1 - fy) + at(x0 + 1, y0) * fx * (1 - fy) + at(x0, y0 + 1) * (1 - fx) * fy + at(x0 + 1, y0 + 1) * fx * fy; } }
  return { dem, n, cellM, windowKm, zoom: z, tiles: jobs.length, tilePixelM: 156543.03 * c / Math.pow(2, z) };
}

/* ---- the pipeline's measures ---- */
function percentile(sorted, p) { const k = (sorted.length - 1) * p / 100, f = Math.floor(k), c = Math.min(f + 1, sorted.length - 1); return sorted[f] + (sorted[c] - sorted[f]) * (k - f); }   // numpy's default (linear)

export function measure({ dem, n, cellM }) {
  const N = n * n, slope = new Float64Array(N), rough = new Float64Array(N);
  // slope: numpy.gradient (central differences, one-sided at the edges)
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const k = j * n + i;
    const gx = i === 0 ? dem[k + 1] - dem[k] : i === n - 1 ? dem[k] - dem[k - 1] : (dem[k + 1] - dem[k - 1]) / 2;
    const gy = j === 0 ? dem[k + n] - dem[k] : j === n - 1 ? dem[k] - dem[k - n] : (dem[k + n] - dem[k - n]) / 2;
    slope[k] = deg(Math.atan(Math.hypot(gx, gy) / cellM));
  }
  // roughness: height minus its 5 x 5 moving average, edges padded with the nearest value
  const pad = TREND >> 1, cl = v => (v < 0 ? 0 : v >= n ? n - 1 : v);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    let s = 0; for (let b = -pad; b <= pad; b++) for (let a = -pad; a <= pad; a++) s += dem[cl(j + b) * n + cl(i + a)];
    rough[j * n + i] = dem[j * n + i] - s / (TREND * TREND);
  }
  // Still water is stored perfectly flat. Those cells are left out, as the pipeline leaves out its lake mask.
  const ok = []; for (let k = 0; k < N; k++) if (!(slope[k] < 1e-9 && Math.abs(rough[k]) < 1e-9)) ok.push(k);
  if (ok.length < 100) throw new Error('This window is almost all flat water or sea surface.');
  const sl = Float64Array.from(ok, k => slope[k]).sort(), h = Float64Array.from(ok, k => dem[k]).sort();
  let m = 0; for (const k of ok) m += rough[k]; m /= ok.length; let v = 0; for (const k of ok) v += (rough[k] - m) ** 2;
  const frac = new Array(EDGES.length - 1).fill(0); let gentle = 0;
  for (const s of sl) { frac[Math.min(frac.length - 1, Math.floor(Math.min(s, 40 - 1e-9) / 2))]++; if (s < GENTLE) gentle++; }
  return { metrics: { relief_p5_p95_m: percentile(h, 95) - percentile(h, 5), median_slope_deg: percentile(sl, 50), p95_slope_deg: percentile(sl, 95),
    roughness_m: Math.sqrt(v / ok.length), gentle_share: gentle / sl.length, masked_share: 1 - ok.length / N },
    slope_hist: { edges_deg: EDGES, frac: frac.map(x => x / sl.length) } };
}

// pipeline/score_terrain.py: plain average of slope-histogram overlap, relief ratio and roughness ratio
export function similarity(a, b) {
  const ratio = k => { const x = a.metrics[k], y = b.metrics[k], hi = Math.max(x, y); return hi > 0 ? 100 * Math.min(x, y) / hi : 100; };
  const slopes = 100 * a.slope_hist.frac.reduce((s, x, i) => s + Math.min(x, b.slope_hist.frac[i]), 0);
  const parts = { slopes, relief: ratio('relief_p5_p95_m'), roughness: ratio('roughness_m') };
  return { score: Math.round((parts.slopes + parts.relief + parts.roughness) / 3), parts };
}
