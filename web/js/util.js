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
