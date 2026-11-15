// Decoration only: the star background (drawn by code), and the opening figure of Atlas holding the sky (a public-domain
// photograph of the Farnese Atlas turned into characters), whose characters rearrange into the name. Neither is data. Both stand still when the user asks for reduced motion.
import { reduced } from './util.js';
import { ATLAS_ART } from './atlas-art.js';

const RAMP = ' .:-=+*#%@';
const COLS = ATLAS_ART[0].length, ROWS = ATLAS_ART.length;

/* ---------- sky: stars, a band of galaxy and one small spiral, drawn by code in the site's three colours ---------- */
// Decoration, not data and not a picture of the real sky. The same sky is built once from a fixed seed, in window-relative
// units, then drawn either as points and glows (Image) or as characters (ASCII), following the lower-left switch.
// It is still: drawn once, and again only when the window or the switch changes.
const LAV = '168,139,255', DEEP = '112,34,252', SUN = '253,176,50', WHITE = '239,238,245';
function buildSky() {
  let s = 20261115; const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  const gauss = () => { let t = 0; for (let i = 0; i < 6; i++) t += rnd(); return (t - 3) / 0.707; };   // roughly normal, sd 1
  const pts = [];
  // field stars: mostly faint, a few bright; one in twelve is sunrise orange
  for (let i = 0; i < 900; i++) { const m = Math.pow(rnd(), 2.2); pts.push({ x: rnd(), y: rnd(), m, c: rnd() < 0.08 ? SUN : rnd() < 0.5 ? LAV : WHITE, k: 'star' }); }
  // the band: a diagonal river of faint stars, densest along its middle
  for (let i = 0; i < 4200; i++) { const t = rnd() * 1.3 - 0.15, d = gauss() * 0.065; pts.push({ x: t + d * 0.55, y: 0.92 - t * 0.84 + d, m: 0.25 + 0.5 * rnd() * Math.exp(-d * d / 0.012), c: rnd() < 0.05 ? SUN : LAV, k: 'band' }); }
  // a small spiral galaxy, two arms, seen at a tilt
  const gx = 0.84, gy = 0.2;
  for (let i = 0; i < 1500; i++) {
    const arm = i % 2, r = Math.pow(rnd(), 0.7) * 0.085, th = arm * Math.PI + r * 46 + gauss() * (0.25 + r * 2.2), X = r * Math.cos(th), Y = r * Math.sin(th) * 0.5, co = Math.cos(-0.5), si = Math.sin(-0.5);
    pts.push({ x: gx + X * co - Y * si, y: gy + (X * si + Y * co), m: 0.3 + 0.7 * Math.exp(-r / 0.03) * rnd() + 0.2 * rnd(), c: r < 0.012 ? SUN : LAV, k: 'gal', sq: true });
  }
  return { pts, gx, gy };
}

export function initSky() {
  const c = document.createElement('canvas'); c.id = 'sky'; c.setAttribute('aria-hidden', 'true'); document.body.prepend(c);
  const sky = buildSky();
  const mode = () => { try { const v = localStorage.getItem('atlas-view'); if (v) return v === 'image' ? 'image' : 'ascii'; } catch (e) { /* storage may be blocked */ } const b = document.querySelector('#viewmode [aria-pressed="true"]'); return b ? b.dataset.view : 'ascii'; };
  const draw = () => {
    const d = Math.min(devicePixelRatio || 1, 2), w = innerWidth, h = innerHeight, unit = Math.min(w, h);
    c.width = w * d; c.height = h * d; const g = c.getContext('2d'); g.scale(d, d);
    // the spiral keeps its shape on any window: its offsets are scaled by the shorter side
    const px = p => (p.k === 'gal' ? sky.gx * w + (p.x - sky.gx) * unit * 1.6 : p.x * w), py = p => (p.k === 'gal' ? sky.gy * h + (p.y - sky.gy) * unit * 1.6 : p.y * h);
    if (mode() === 'ascii') {
      // characters: each cell shows how much starlight falls in it; single bright stars get their own mark
      const cell = 14, cols = Math.ceil(w / cell), rows = Math.ceil(h / cell), dens = new Float32Array(cols * rows), warm = new Float32Array(cols * rows);
      g.font = `500 ${cell}px "IBM Plex Mono", ui-monospace, Consolas, monospace`; g.textAlign = 'center'; g.textBaseline = 'middle';
      const singles = [];
      for (const p of sky.pts) {
        const x = px(p), y = py(p); if (x < 0 || y < 0 || x >= w || y >= h) continue;
        if (p.k === 'star') { if (p.m > 0.4) singles.push([x, y, p]); continue; }
        const i = ((y / cell) | 0) * cols + ((x / cell) | 0); dens[i] += p.m; if (p.c === SUN) warm[i] += p.m;
      }
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const v = dens[j * cols + i]; if (v < 0.9) continue;
        const t = Math.min(1, v / 5.5), ch = RAMP[1 + Math.min(RAMP.length - 2, Math.floor(t * (RAMP.length - 1)))];
        g.fillStyle = `rgba(${warm[j * cols + i] > v * 0.45 ? SUN : LAV},${(0.1 + 0.5 * t).toFixed(2)})`;
        g.fillText(ch, i * cell + cell / 2, j * cell + cell / 2);
      }
      for (const [x, y, p] of singles) {
        g.fillStyle = `rgba(${p.c},${(0.15 + 0.6 * p.m).toFixed(2)})`;
        g.fillText(p.m > 0.8 ? '*' : p.m > 0.6 ? '+' : '.', Math.floor(x / cell) * cell + cell / 2, Math.floor(y / cell) * cell + cell / 2);
      }
      return;
    }
    // image: soft lavender light under the band and the spiral, then the points
    g.save(); g.translate(w * 0.5, h * 0.5); g.rotate(Math.atan2(-0.84 * h, w)); const bw = unit * 0.2, lg = g.createLinearGradient(0, -bw, 0, bw);
    lg.addColorStop(0, `rgba(${DEEP},0)`); lg.addColorStop(0.5, `rgba(${DEEP},0.16)`); lg.addColorStop(1, `rgba(${DEEP},0)`); g.fillStyle = lg; g.fillRect(-w * 1.2, -bw, w * 2.4, bw * 2); g.restore();
    const rg = g.createRadialGradient(sky.gx * w, sky.gy * h, 0, sky.gx * w, sky.gy * h, unit * 0.17);
    rg.addColorStop(0, `rgba(${SUN},0.22)`); rg.addColorStop(0.18, `rgba(${DEEP},0.2)`); rg.addColorStop(1, `rgba(${DEEP},0)`); g.fillStyle = rg; g.fillRect(0, 0, w, h);
    for (const p of sky.pts) {
      const x = px(p), y = py(p); if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const big = p.k === 'star' && p.m > 0.6;
      g.fillStyle = `rgba(${p.c},${(p.k === 'star' ? 0.25 + 0.75 * p.m : 0.12 + 0.5 * p.m).toFixed(2)})`;
      g.fillRect(Math.round(x), Math.round(y), big ? 2 : 1, big ? 2 : 1);                         // square stars, to match the square theme
      if (p.k === 'star' && p.m > 0.85) { g.fillStyle = `rgba(${p.c},0.35)`; g.fillRect(Math.round(x) - 2, Math.round(y), 6, 1); g.fillRect(Math.round(x), Math.round(y) - 2, 1, 6); }   // a small cross on the brightest
    }
  };
  draw(); let t = 0; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(draw, 150); });
  const sw = document.querySelector('#viewmode'); if (sw) sw.addEventListener('click', () => setTimeout(draw, 0));   // follows the ASCII / Image switch
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
}

/* ---------- the two pictures, as grids of characters ---------- */
function blank() { return Array.from({ length: ROWS }, () => new Array(COLS).fill(' ')); }
function put(g, row, col, text) { for (let i = 0; i < text.length; i++) if (text[i] !== ' ' && g[row] && col + i >= 0 && col + i < COLS) g[row][col + i] = text[i]; }

// The figure: the Farnese Atlas, from a public-domain photograph turned into characters by pipeline/atlas_art.py
const atlasGrid = () => ATLAS_ART.map(line => [...line]);

function nameGrid() {
  const L = { A: [' ### ', '#   #', '#####', '#   #', '#   #'], T: ['#####', '  #  ', '  #  ', '  #  ', '  #  '], L: ['#    ', '#    ', '#    ', '#    ', '#####'], S: [' ####', '#    ', ' ### ', '    #', '#### '] };
  const K = 2, g = blank(), word = 'ATLAS', gap = 2, w = word.length * 5 * K + (word.length - 1) * gap, x0 = Math.round((COLS - w) / 2), y0 = Math.round((ROWS - 5 * K) / 2);   // each cell of a letter is drawn K by K
  [...word].forEach((ch, k) => L[ch].forEach((line, j) => { const wide = [...line].map(c => c.repeat(K)).join(''); for (let r = 0; r < K; r++) put(g, y0 + j * K + r, x0 + k * (5 * K + gap), wide); }));
  return g;
}

/* ---------- opening: Atlas, then the characters rearrange into ATLAS, then the page ---------- */
export function playIntro() {
  let seen = false; try { seen = sessionStorage.getItem('atlas-intro') === '1'; sessionStorage.setItem('atlas-intro', '1'); } catch (e) { /* storage may be blocked */ }
  const deep = location.hash && location.hash !== '#worlds';        // someone following a link to a page is not made to wait
  if (reduced || seen || deep) return;
  const el = document.createElement('div'); el.className = 'intro'; el.setAttribute('role', 'img'); el.setAttribute('aria-label', 'Atlas holding the sky, then the name ATLAS');
  el.innerHTML = '<pre aria-hidden="true"></pre><span>tap or press any key to skip</span>';
  document.body.append(el);
  const pre = el.firstChild, A = atlasGrid(), B = nameGrid();
  const when = A.map(row => row.map(() => Math.random()));           // each character changes at its own moment
  const T = { draw: 500, hold: 750, morph: 800, rest: 500, fade: 300 };
  const t0 = performance.now(); let raf = 0, over = false;
  const end = () => {
    if (over) return; over = true; cancelAnimationFrame(raf);
    el.classList.add('out'); setTimeout(() => el.remove(), T.fade);
    removeEventListener('keydown', end); el.removeEventListener('pointerdown', end);
  };
  const frame = now => {
    const t = now - t0; let out = '';
    if (t < T.draw + T.hold) {                                       // the figure is drawn from the top down
      const rows = Math.min(ROWS, Math.ceil(t / T.draw * ROWS));
      for (let j = 0; j < ROWS; j++) out += (j < rows ? A[j].join('') : '') + '\n';
    } else {
      const p = Math.min(1, (t - T.draw - T.hold) / T.morph);
      for (let j = 0; j < ROWS; j++) { for (let i = 0; i < COLS; i++) {
        const a = A[j][i], b = B[j][i], w = when[j][i] * 0.8;
        out += a === b ? a : p < w ? a : p < w + 0.2 ? RAMP[1 + ((Math.random() * (RAMP.length - 1)) | 0)] : b;
      } out += '\n'; }
      if (p >= 1 && !el.classList.contains('named')) el.classList.add('named');
    }
    pre.textContent = out;
    if (t > T.draw + T.hold + T.morph + T.rest) return end();
    raf = requestAnimationFrame(frame);
  };
  addEventListener('keydown', end); el.addEventListener('pointerdown', end);
  raf = requestAnimationFrame(frame);
  setTimeout(end, 6000);                                             // never left on screen if the tab was in the background
}

/* ---------- hover: a label breaks into ASCII and settles back, left to right ---------- */
// Decoration. The real text stays in aria-label, so a screen reader never hears the scrambled characters.
export function initScramble(selector) {
  if (reduced) return;
  for (const el of document.querySelectorAll(selector)) {
    const text = el.textContent; el.setAttribute('aria-label', text);
    let raf = 0;
    const run = () => {
      cancelAnimationFrame(raf); const t0 = performance.now(), dur = 260 + text.length * 22;
      const frame = now => {
        const p = (now - t0) / dur, settled = Math.floor(p * text.length * 1.25);
        el.textContent = [...text].map((ch, i) => (ch === ' ' || i < settled ? ch : RAMP[2 + ((Math.random() * (RAMP.length - 2)) | 0)])).join('');
        if (p < 1) raf = requestAnimationFrame(frame); else el.textContent = text;
      };
      raf = requestAnimationFrame(frame);
    };
    el.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') run(); });
    el.addEventListener('focus', run);
  }
}
