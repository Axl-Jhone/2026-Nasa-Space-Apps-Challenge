// Terrain fields: loading real exports, shading and drawing. Nothing here generates terrain.
// The drawing code is the prototype's painter's-algorithm renderer, generalised to any grid size.
import { DEG, tok, hex, mix } from './util.js';

/* ---------- loading ---------- */
// A real export is data/terrain/<id>.json (see web/README.md). If it is absent or invalid the caller gets a
// "missing" marker with the reason, and draws a message. No placeholder terrain is ever made up in its place.
const missing = (kind, id, why) => ({ kind, missing: true, why, meta: { id } });
export async function loadField(id, kind) {
  let res;
  try { res = await fetch(`data/terrain/${id}.json`, { cache: 'no-cache' }); } catch (e) { return missing(kind, id, 'the file could not be fetched'); }
  if (!res.ok) return missing(kind, id, 'no export yet');
  try { return fromExport(await res.json(), kind); }
  catch (e) { console.warn(`terrain/${id}.json is invalid:`, e); return missing(kind, id, 'the export is invalid: ' + e.message); }
}

function fromExport(j, kind) {
  const n = j.n, len = n * n;
  if (!Number.isInteger(n) || n < 16 || n > 512) throw new Error('n must be an integer from 16 to 512');
  if (!Array.isArray(j.heights_m) || j.heights_m.length !== len) throw new Error(`heights_m must have n*n = ${len} values`);
  if (!(j.window_km > 0)) throw new Error('window_km missing');
  const raw = Float32Array.from(j.heights_m);
  for (let i = 0; i < len; i++) if (!Number.isFinite(raw[i])) throw new Error('heights_m contains a non-number');
  const water = new Uint8Array(len); if (Array.isArray(j.water)) { if (j.water.length !== len) throw new Error('water must have n*n values'); for (let i = 0; i < len; i++) water[i] = j.water[i] ? 1 : 0; }
  // Draw relative to the median of the dry ground, so absolute elevation (m above sea level, or above the lunar sphere) does not move the picture.
  const dry = []; for (let i = 0; i < len; i++) if (!water[i]) dry.push(raw[i]);
  dry.sort((a, b) => a - b); const ref = dry.length ? dry[dry.length >> 1] : 0;
  const h = new Float32Array(len); for (let i = 0; i < len; i++) h[i] = raw[i] - ref;
  return { kind: j.body || kind, n, h, water, windowKm: j.window_km, missing: false, meta: j, ref };   // the export says which world it is
}

/* ---------- shading and drawing ---------- */
export const sunVec = T => { const a = T.az * DEG, e = T.el * DEG; return [Math.cos(e) * Math.sin(a), -Math.cos(e) * Math.cos(a), Math.sin(e)]; };
function shadeCell(f, i, j, sun, ve) {
  const { n, h } = f, dx = f.windowKm * 1000 / (n - 1), i0 = Math.max(0, i - 1), i1 = Math.min(n - 1, i + 1), j0 = Math.max(0, j - 1), j1 = Math.min(n - 1, j + 1);
  const gx = (h[j * n + i1] - h[j * n + i0]) / ((i1 - i0) * dx) * ve, gy = (h[j1 * n + i] - h[j0 * n + i]) / ((j1 - j0) * dx) * ve, m = Math.hypot(gx, gy, 1);
  return Math.max(0, (-gx * sun[0] - gy * sun[1] + sun[2]) / m) * (f.water[j * n + i] ? 0.55 : 1);
}
export function palette(kind) { const lo = hex(tok('--relief-lo')), hi = mix(hex(tok(kind === 'earth' ? '--earth' : kind === 'mars' ? '--mars' : '--moon')), hex(tok('--relief-hi')), 0.5), wa = hex(tok('--water')); return { lo, hi, wa }; }
const colour = (f, k, l, pal) => f.water[k] ? mix(pal.lo, pal.wa, 0.35 + 0.65 * l) : mix(pal.lo, pal.hi, l);

// Cell draw order depends only on grid size and view angle, so cache it while the sun sweeps.
const orderCache = new Map();
function drawOrder(n, view) {
  const key = n + ':' + view; if (orderCache.has(key)) return orderCache.get(key);
  const th = view * DEG, ct = Math.cos(th), st = Math.sin(th), D = new Float32Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) D[j * n + i] = (i / (n - 1) - 0.5) * st + (j / (n - 1) - 0.5) * ct;
  const cells = []; for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) cells.push(j * n + i);
  cells.sort((a, b) => D[a] - D[b]);
  if (orderCache.size > 40) orderCache.clear(); orderCache.set(key, cells); return cells;
}

export function drawTerrain(cv, f, T) {
  const cw = cv.clientWidth, ch = cv.clientHeight; if (!cw || !ch) return;
  const n = f.n, dpr = Math.min(2, devicePixelRatio || 1), W = cv.width = Math.round(cw * dpr), H = cv.height = Math.round(ch * dpr), ctx = cv.getContext('2d');
  const th = T.view * DEG, ct = Math.cos(th), st = Math.sin(th), sp = 0.56, cpz = 0.83, sc = Math.min(W * 0.6, H * 0.8), cx = W / 2, cy = H * 0.56, sun = sunVec(T), pal = palette(f.kind);
  const X = new Float32Array(n * n), Y = new Float32Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const x = i / (n - 1) - 0.5, y = j / (n - 1) - 0.5, z = f.h[j * n + i] / 1000 / f.windowKm * T.ve, xr = x * ct - y * st, yr = x * st + y * ct, k = j * n + i;
    X[k] = cx + xr * sc; Y[k] = cy + yr * sp * sc - z * cpz * sc;
  }
  ctx.clearRect(0, 0, W, H); ctx.lineWidth = 1;
  for (const k of drawOrder(n, T.view)) {
    const i = k % n, j = (k / n) | 0, l = Math.pow(shadeCell(f, i, j, sun, T.ve), 0.85), c = colour(f, k, l, pal), col = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
    ctx.fillStyle = col; ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(X[k], Y[k]); ctx.lineTo(X[k + 1], Y[k + 1]); ctx.lineTo(X[k + n + 1], Y[k + n + 1]); ctx.lineTo(X[k + n], Y[k + n]); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  // scale bar: a quarter of the window, along the unrotated east-west axis
  const bar = sc * 0.25, bx = 14 * dpr, by = H - 16 * dpr; ctx.strokeStyle = tok('--ink'); ctx.fillStyle = tok('--ink'); ctx.lineWidth = 1.5 * dpr;
  ctx.beginPath(); ctx.moveTo(bx, by - 4 * dpr); ctx.lineTo(bx, by); ctx.lineTo(bx + bar, by); ctx.lineTo(bx + bar, by - 4 * dpr); ctx.stroke();
  ctx.font = `${12 * dpr}px "IBM Plex Mono", monospace`; ctx.fillText(`${+(f.windowKm * 0.25).toFixed(1)} km`, bx + bar + 6 * dpr, by + 1 * dpr);
}

export function drawHillshade(cv, f, T) {
  const n = f.n; cv.width = cv.height = n; const ctx = cv.getContext('2d'), im = ctx.createImageData(n, n), sun = sunVec(T), pal = palette(f.kind);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const k = j * n + i, l = Math.pow(shadeCell(f, i, j, sun, T.ve), 0.85), c = colour(f, k, l, pal); im.data[k * 4] = c[0]; im.data[k * 4 + 1] = c[1]; im.data[k * 4 + 2] = c[2]; im.data[k * 4 + 3] = 255; }
  ctx.putImageData(im, 0, 0);
}
