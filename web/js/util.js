// Small helpers shared by the modules.
export const DEG = Math.PI / 180, TAU = Math.PI * 2;
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const tok = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
export const hex = h => { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
export const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const fmtLL = (lat, lon) => `${Math.abs(lat).toFixed(3)}° ${lat < 0 ? 'S' : 'N'}, ${Math.abs(lon).toFixed(3)}° ${lon < 0 ? 'W' : 'E'}`;

export function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function makeNoise(seed) {
  const r = mulberry(seed), G = 64, g = new Float32Array(G * G); for (let i = 0; i < g.length; i++) g[i] = r();
  const at = (x, y) => g[((y % G + G) % G) * G + ((x % G + G) % G)];
  return (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1); return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy; };
}
export function fbm(n, x, y, oct) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { s += a * n(x * f, y * f); a *= 0.5; f *= 2; } return s; }
