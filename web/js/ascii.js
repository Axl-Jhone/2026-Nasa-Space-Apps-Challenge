// ATLAS: ASCII square space theme. Globes drawn as characters in square cells, and the switch back to the imagery.
// The characters come from the same NASA imagery as the image view: brightness picks the character and the image gives its colour.
// Written with an AI assistant (Claude), directed by the team. See the Method and sources tab.
import { $$ } from './util.js';
import { setPost, refreshAll } from './globe.js';

const RAMP = ' .:-=+*#%@';   // sparse to dense: darker ground gets a lighter character
const CELLS = 46;             // characters across one globe
const FONT = '"IBM Plex Mono", ui-monospace, Consolas, monospace';
let mode = 'ascii';           // 'ascii' or 'image'

/* ---------- character sheet: the shape of every ramp character, drawn once per cell size ---------- */
// Returns one Uint8Array per character: how much ink each pixel of a cell x cell square carries (0 to 255).
const sheets = new Map();
function sheet(cell) {
  if (sheets.has(cell)) return sheets.get(cell);
  const c = document.createElement('canvas'); c.width = RAMP.length * cell; c.height = cell;
  const x = c.getContext('2d', { willReadFrequently: true }); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `600 ${Math.round(cell * 1.25)}px ${FONT}`;
  for (let i = 0; i < RAMP.length; i++) x.fillText(RAMP[i], i * cell + cell / 2, cell / 2 + cell * 0.06);
  const px = x.getImageData(0, 0, c.width, cell).data, out = [];
  for (let k = 0; k < RAMP.length; k++) {
    const ink = new Uint8Array(cell * cell);
    for (let y = 0; y < cell; y++) for (let u = 0; u < cell; u++) ink[y * cell + u] = px[(y * c.width + k * cell + u) * 4 + 3];
    out.push(ink);
  }
  sheets.set(cell, out); return out;
}

/* ---------- one globe: runs after the globe has drawn its image ---------- */
// Everything happens in memory: read the globe's own pixel buffer (g.out), write one finished picture, hand it to the canvas once.
// Reading the canvas back or stamping characters one by one was far slower (3 frames a second while a globe spins).
function paint(g) {
  let a = g.ascii;
  if (!a) { a = g.ascii = { cv: document.createElement('canvas') }; a.cv.setAttribute('aria-hidden', 'true'); g.cv.after(a.cv); }   // above the image, below the pins
  if (mode !== 'ascii') { a.cv.hidden = true; g.cv.style.opacity = ''; return; }
  a.cv.hidden = false; g.cv.style.opacity = '0';                    // the image stays in place as the source, unseen

  const dpr = Math.min(2, devicePixelRatio || 1), w = Math.max(120, Math.round(g.root.clientWidth * dpr));
  const cell = Math.max(5, Math.round(w / CELLS)), n = Math.ceil(w / cell), W = n * cell;
  // a.W remembers the size we set up for. Comparing with the canvas's own width is wrong: a new canvas is 300 wide by default,
  // so a globe that needed exactly 300 was never set up and the pass threw.
  if (a.W !== W) { a.W = W; a.cv.width = a.cv.height = W; a.ctx = a.cv.getContext('2d'); a.img = a.ctx.createImageData(W, W); }
  const out = a.img.data, src = g.out.data, S = g.S, q = S / n, inks = sheet(cell), top = RAMP.length - 1;
  out.fill(0);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    // the cell's colour: the average of four points of the globe image
    let r = 0, gr = 0, b = 0, al = 0;
    for (let v = 0; v < 2; v++) for (let u = 0; u < 2; u++) {
      const px = Math.min(S - 1, ((i + 0.25 + u * 0.5) * q) | 0), py = Math.min(S - 1, ((j + 0.25 + v * 0.5) * q) | 0), t = (py * S + px) * 4;
      r += src[t]; gr += src[t + 1]; b += src[t + 2]; al += src[t + 3];
    }
    if (al < 560) continue;                                           // mostly outside the disc
    r /= 4; gr /= 4; b /= 4;
    const lum = (0.2126 * r + 0.7152 * gr + 0.0722 * b) / 255;
    const ink = inks[Math.min(top, 1 + Math.floor(Math.pow(lum, 0.7) * top))];   // brightness picks the character
    const lift = (0.38 + 0.62 * Math.sqrt(lum)) * 255 / Math.max(r, gr, b, 1);   // keep the hue, lift it so thin strokes read on black
    const R = Math.min(255, r * lift), G = Math.min(255, gr * lift), B = Math.min(255, b * lift);
    for (let y = 0; y < cell; y++) {
      let o = ((j * cell + y) * W + i * cell) * 4, k = y * cell;
      for (let u = 0; u < cell; u++, o += 4, k++) { const v = ink[k]; if (v) { out[o] = R; out[o + 1] = G; out[o + 2] = B; out[o + 3] = v; } }
    }
  }
  a.ctx.putImageData(a.img, 0, 0);
}

/* ---------- the ASCII / image switch in the masthead ---------- */
function setMode(v) {
  mode = v === 'image' ? 'image' : 'ascii';
  try { localStorage.setItem('atlas-view', mode); } catch (e) { /* storage may be blocked */ }
  $$('#viewmode button').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === mode));
  refreshAll();
}

export function initAscii() {
  try { const v = localStorage.getItem('atlas-view'); if (v) mode = v === 'image' ? 'image' : 'ascii'; } catch (e) { /* ignore */ }
  $$('#viewmode button').forEach(b => { b.setAttribute('aria-pressed', b.dataset.view === mode); b.addEventListener('click', () => setMode(b.dataset.view)); });
  setPost(paint);
  let t = 0; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(refreshAll, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { sheets.clear(); refreshAll(); });   // redraw once the typeface has loaded
}
