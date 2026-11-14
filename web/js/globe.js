// Textured globes drawn on a 2D canvas (ported from the prototype), plus the tile stitching for their textures.
import { DEG, TAU, reduced, $ } from './util.js';

const loadImg = src => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('missing ' + src)); im.src = src; });
// Tiles live in assets/tiles as <body>_<row>_<col>.jpg
export async function stitch(prefix, rows, cols, size) {
  const c = document.createElement('canvas'); c.width = cols * size; c.height = rows * size; const ctx = c.getContext('2d', { willReadFrequently: true }), jobs = [];
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) jobs.push(loadImg(`assets/tiles/${prefix}_${r}_${k}.jpg`).then(im => ctx.drawImage(im, k * size, r * size, size, size)));
  await Promise.all(jobs); return c;
}
// NASA GIBS tiles at this level span 144 degrees each, so the Earth globe is the top-left 1280 x 640 of the 3 x 2 grid.
export async function loadTextures() {
  const [full, moon, mars] = await Promise.all([stitch('earth', 2, 3, 512), stitch('moon', 2, 4, 256), stitch('mars', 2, 4, 256)]);
  const earth = document.createElement('canvas'); earth.width = 1280; earth.height = 640; earth.getContext('2d', { willReadFrequently: true }).drawImage(full, 0, 0);
  return { earth, moon, mars };
}

let globes = [], raf = 0, post = null;   // post: optional pass run after a globe draws (the ASCII view)
export const setPost = fn => { post = fn; refreshAll(); };
export const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
function tick() { raf = 0; let more = false; for (const g of globes) { if (!g.visible()) continue; if (g.step()) more = true; if (g.dirty) { g.render(); g.dirty = false; } if (g.spin && !reduced) { g.lon += 0.12; g.dirty = true; more = true; } } if (more) kick(); }

export class Globe {
  // opts: { root, body, pins:[{lat,lon,label,ids,ctx}], gain, S, onPin(ids), spin }
  constructor(o) {
    this.root = o.root; this.cv = $('canvas', this.root); this.body = o.body; this.gain = o.gain; this.spin = !!o.spin;
    this.S = o.S || 400; this.cv.width = this.cv.height = this.S; this.ctx = this.cv.getContext('2d'); this.out = this.ctx.createImageData(this.S, this.S);
    this.lon = 0; this.lat = 0; this.tLon = null; this.tLat = null; this.dirty = true; this.pre();
    this.pins = (o.pins || []).map(p => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'pin ' + (p.ctx ? 'ctx ' : '') + this.body; b.innerHTML = `<span></span>`; $('span', b).textContent = p.label; b.setAttribute('aria-label', p.label);
      if (!p.ctx) b.addEventListener('click', e => { e.stopPropagation(); o.onPin && o.onPin(p.ids); });
      this.root.appendChild(b); return Object.assign({ el: b }, p);
    });
    this.drag(); globes.push(this);
  }
  visible() { return this.root.offsetParent !== null; }
  pre() {
    const S = this.S, R = S / 2, n = S * S; this.px = new Float32Array(n); this.py = new Float32Array(n); this.pz = new Float32Array(n); this.sh = new Float32Array(n); this.al = new Uint8Array(n);
    const sx = -0.58, sy = 0.3, sz = 0.757;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const X = (x + 0.5 - R) / R, Y = (R - y - 0.5) / R, r2 = X * X + Y * Y, i = y * S + x; if (r2 >= 1) continue;
      const Z = Math.sqrt(1 - r2); this.px[i] = X; this.py[i] = Y; this.pz[i] = Z;
      const l = X * sx + Y * sy + Z * sz, t = Math.min(1, Math.max(0, (l + 0.12) / 0.5)), day = t * t * (3 - 2 * t);
      this.sh[i] = (0.14 + 0.86 * day) * (0.7 + 0.3 * Z) * this.gain; this.al[i] = Math.max(1, Math.min(1, (1 - Math.sqrt(r2)) * R) * 255);
    }
  }
  setTexture(c) { this.tw = c.width; this.th = c.height; this.tex = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; this.dirty = true; kick(); }
  render() {
    if (!this.tex) { this.place(); return; }
    const { S, px, py, pz, sh, al, tex, tw, th } = this, d = this.out.data, l0 = this.lon * DEG, c = Math.cos(this.lat * DEG), s = Math.sin(this.lat * DEG);
    for (let i = 0, n = S * S; i < n; i++) {
      const a = al[i], o = i * 4; if (!a) { d[o + 3] = 0; continue; }
      let Y = py[i] * c + pz[i] * s; const Z = -py[i] * s + pz[i] * c; if (Y > 1) Y = 1; else if (Y < -1) Y = -1;
      const lat = Math.asin(Y), lon = l0 + Math.atan2(px[i], Z);
      let u = (lon / TAU + 0.5) % 1; if (u < 0) u += 1; let tx = (u * tw) | 0; if (tx >= tw) tx = tw - 1; let ty = ((0.5 - lat / Math.PI) * th) | 0; if (ty >= th) ty = th - 1;
      const t = (ty * tw + tx) * 4, k = sh[i]; d[o] = tex[t] * k; d[o + 1] = tex[t + 1] * k; d[o + 2] = tex[t + 2] * k; d[o + 3] = a;
    }
    this.ctx.putImageData(this.out, 0, 0); if (post) post(this); this.place();
  }
  place() {
    const c = Math.cos(this.lat * DEG), s = Math.sin(this.lat * DEG);
    for (const p of this.pins) {
      const dl = (p.lon - this.lon) * DEG, cp = Math.cos(p.lat * DEG), X = cp * Math.sin(dl), Y = Math.sin(p.lat * DEG), Z = cp * Math.cos(dl), y = Y * c - Z * s, z = Y * s + Z * c;
      p.el.hidden = z < 0.1; p.el.style.left = (50 + X * 50) + '%'; p.el.style.top = (50 - y * 50) + '%';
    }
  }
  markOn(ids) { for (const p of this.pins) p.el.classList.toggle('on', !!ids && !!p.ids && p.ids.some(i => ids.includes(i))); }
  focus(lat, lon) {
    const tl = Math.max(-55, Math.min(55, lat));
    if (reduced) { this.lat = tl; this.lon = lon; this.tLon = null; this.dirty = true; } else { this.tLat = tl; this.tLon = lon; }
    kick();
  }
  step() {
    if (this.tLon == null) return false;
    const dl = ((this.tLon - this.lon + 540) % 360) - 180, da = this.tLat - this.lat;
    if (Math.abs(dl) < 0.25 && Math.abs(da) < 0.25) { this.lon = this.tLon; this.lat = this.tLat; this.tLon = null; } else { this.lon += dl * 0.13; this.lat += da * 0.13; }
    this.dirty = true; return true;
  }
  drag() {
    let on = false, lx = 0, ly = 0;
    this.root.addEventListener('pointerdown', e => { if (e.target.closest('.pin')) return; on = true; lx = e.clientX; ly = e.clientY; this.tLon = null; this.root.setPointerCapture(e.pointerId); this.root.style.cursor = 'grabbing'; });
    this.root.addEventListener('pointermove', e => { if (!on) return; const k = 110 / this.root.clientWidth; this.lon -= (e.clientX - lx) * k; if (e.pointerType !== 'touch') this.lat = Math.max(-80, Math.min(80, this.lat + (e.clientY - ly) * k)); lx = e.clientX; ly = e.clientY; this.dirty = true; kick(); });
    const end = () => { on = false; this.root.style.cursor = ''; };
    this.root.addEventListener('pointerup', end); this.root.addEventListener('pointercancel', end);
  }
}

// Call after a tab becomes visible so its globes redraw.
export const refreshAll = () => { for (const g of globes) g.dirty = true; kick(); };
