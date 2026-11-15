// Decoration only: the star background (drawn by code), and the opening figure of Atlas holding the sky (a public-domain
// photograph of the Farnese Atlas turned into characters), whose characters rearrange into the name. Neither is data. Both stand still when the user asks for reduced motion.
import { reduced } from './util.js';
import { ATLAS_ART } from './atlas-art.js';

const RAMP = ' .:-=+*#%@';
const COLS = ATLAS_ART[0].length, ROWS = ATLAS_ART.length;

/* ---------- star background: one still canvas behind the page, redrawn only when the window changes size ---------- */
export function initSky() {
  const c = document.createElement('canvas'); c.id = 'sky'; c.setAttribute('aria-hidden', 'true'); document.body.prepend(c);
  const draw = () => {
    const d = Math.min(devicePixelRatio || 1, 2), w = innerWidth, h = innerHeight;
    c.width = w * d; c.height = h * d; const g = c.getContext('2d'); g.scale(d, d);
    let s = 20261115; const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;   // fixed seed: the same sky on every visit
    const n = Math.round(w * h / 5200);
    for (let i = 0; i < n; i++) {
      const x = rnd() * w, y = rnd() * h, m = rnd(), big = m > 0.985;
      g.fillStyle = `rgba(${m > 0.9 ? '255,236,200' : '205,216,240'},${(0.12 + m * m * 0.5).toFixed(2)})`;
      g.fillRect(Math.round(x), Math.round(y), big ? 2 : 1, big ? 2 : 1);                       // square stars, to match the square theme
    }
  };
  draw(); let t = 0; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(draw, 150); });
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
  el.innerHTML = '<pre aria-hidden="true"></pre><span>press any key to skip</span>';
  document.body.append(el);
  const pre = el.firstChild, A = atlasGrid(), B = nameGrid();
  const when = A.map(row => row.map(() => Math.random()));           // each character changes at its own moment
  const T = { draw: 650, hold: 1000, morph: 900, rest: 650, fade: 350 };
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
