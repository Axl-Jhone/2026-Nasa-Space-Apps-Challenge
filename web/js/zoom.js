// Zoom view: from the globes down to two maps, one per world, at one shared scale.
// Live pictures come from NASA GIBS and USGS Astrogeology (data/maplayers.json). Under them sits a saved copy of the
// same pictures (data/maps, written by pipeline/prerender_maps.py), so the view still works with no network.
// Each map has its own flat grid in metres, so a kilometre is the same number of pixels on both. Same maths as the script.
/* global L */
import { $, esc, reduced, fmtLL } from './util.js';

let CFG = null, IDX = null, maps = [], syncing = false, token = 0, leafletP = null, pending = null;
// The map library (150 kB) is fetched only when the zoom view is first opened, not with the page.
function leaflet() {
  return leafletP || (leafletP = new Promise((ok, bad) => {
    if (window.L) return ok();
    const c = document.createElement('link'); c.rel = 'stylesheet'; c.href = 'vendor/leaflet/leaflet.css'; document.head.prepend(c);
    const s = document.createElement('script'); s.src = 'vendor/leaflet/leaflet.js'; s.onload = ok; s.onerror = () => { leafletP = null; bad(new Error('map library')); }; document.head.append(s);
  }));
}
const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
const getJson = u => fetch(u, { cache: 'no-cache' }).then(r => (r.ok ? r.json() : null)).catch(() => null);
const isPolar = (body, lat) => body === 'moon' && lat < -60;

// A flat grid in metres around one place. Ordinary places: a local grid, true to scale at the place.
// Moon south of 60° S: polar stereographic about the pole, the grid the USGS south-pole mosaic is served on.
function grid(body, lat0, lon0) {
  const R = CFG.radius_m[body], polar = isPolar(body, lat0), c = Math.cos(rad(lat0));
  const project = ll => {
    if (polar) { const t = 2 * R * Math.tan(rad(90 + ll.lat) / 2); return L.point(t * Math.sin(rad(ll.lng)), t * Math.cos(rad(ll.lng))); }
    let d = ll.lng - lon0; d = ((d + 540) % 360) - 180;
    return L.point(R * c * rad(d), R * rad(ll.lat - lat0));
  };
  const unproject = p => {
    if (polar) return L.latLng(deg(2 * Math.atan(Math.hypot(p.x, p.y) / (2 * R))) - 90, deg(Math.atan2(p.x, p.y)));
    return L.latLng(lat0 + deg(p.y / R), lon0 + deg(p.x / (R * c)));
  };
  // what a service wants for a box given in metres on this grid
  const bbox = (layer, b) => layer.srs === 'm' ? b : [lon0 + deg(b[0] / (R * c)), lat0 + deg(b[1] / R), lon0 + deg(b[2] / (R * c)), lat0 + deg(b[3] / R)];
  const crs = L.extend({}, L.CRS.Simple, {
    projection: { project, unproject, bounds: L.bounds([-1e9, -1e9], [1e9, 1e9]) },
    transformation: new L.Transformation(1, 0, -1, 0),
    scale: z => Math.pow(2, z) / CFG.m0, zoom: s => Math.log(s * CFG.m0) / Math.LN2, infinite: true,
  });
  return { crs, bbox, polar, project, unproject, centre: project(L.latLng(lat0, lon0)) };
}

// Live tiles: each 256-pixel tile is one request for its own box
function liveLayer(g, layer) {
  const T = L.TileLayer.extend({
    getTileUrl(c) {
      const t = 256 * CFG.m0 / Math.pow(2, c.z);
      const b = g.bbox(layer, [c.x * t, -(c.y + 1) * t, (c.x + 1) * t, -c.y * t]);
      return layer.url + (layer.transparent ? '&FORMAT=image/png&TRANSPARENT=TRUE' : '') + '&BBOX=' + b.map(v => v.toFixed(6)).join(',') + '&WIDTH=256&HEIGHT=256';
    },
  });
  const minZoom = layer.maxMpp ? Math.ceil(Math.log2(CFG.m0 / layer.maxMpp)) : 0;
  // ask only when the map has settled, and keep one ring of tiles around the view: fewer requests while moving
  return new T('', { tileSize: 256, minZoom, maxZoom: 9, updateWhenZooming: false, updateWhenIdle: true, keepBuffer: 1, className: 'ztile' });
}

// Saved copy: one picture placed by its corners in metres (works on the polar grid too, where "north-west" means nothing)
let SavedC = null;
const savedClass = () => SavedC || (SavedC = L.ImageOverlay.extend({
  initialize(url, g, b, opts) { this._g = g; this._b = b; L.ImageOverlay.prototype.initialize.call(this, url, L.latLngBounds(g.unproject(L.point(b[0], b[1])), g.unproject(L.point(b[2], b[3]))), opts); },
  _corners() { return [this._g.unproject(L.point(this._b[0], this._b[3])), this._g.unproject(L.point(this._b[2], this._b[1]))]; },
  _reset() {
    const [a, b] = this._corners(), p = this._map.latLngToLayerPoint(a), q = this._map.latLngToLayerPoint(b);
    L.DomUtil.setPosition(this._image, p); this._image.style.width = (q.x - p.x) + 'px'; this._image.style.height = (q.y - p.y) + 'px';
  },
  _animateZoom(e) { L.DomUtil.setTransform(this._image, this._map._latLngToNewLayerPoint(this._corners()[0], e.zoom, e.center), this._map.getZoomScale(e.zoom)); },
}));

function niceKm(mpp) { const want = 110 * mpp / 1000; return [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1].find(k => k <= want) || 1; }

function buildMap(el, body, lat, lon, saved, win) {
  const g = grid(body, lat, lon); let Saved = savedClass();
  const half = g.polar ? 900e3 : 2500e3, c = g.centre;
  const far = [g.unproject(L.point(c.x - half, c.y - half)), g.unproject(L.point(c.x + half, c.y + half))];
  const map = L.map(el, { crs: g.crs, center: [lat, lon], zoom: 3, minZoom: 2, maxZoom: 9, zoomSnap: 1, attributionControl: false, zoomControl: false,
    fadeAnimation: !reduced, zoomAnimation: !reduced, inertia: false });
  map._atlasFar = far;
  L.control.zoom({ position: 'topright' }).addTo(map);
  map.createPane('saved').style.zIndex = 150;                     // under the live tiles (200)
  for (const v of ['wide', 'close']) if (saved && saved.views[v]) new Saved('data/maps/' + saved.views[v].file, g, saved.views[v].b, { pane: 'saved', interactive: false }).addTo(map);
  const key = g.polar ? 'moonpolar' : body, state = { ok: 0, bad: 0, layers: CFG.layers[key] };
  for (const layer of state.layers) liveLayer(g, layer).on('tileload', () => { state.ok++; paintBadge(el, state); }).on('tileerror', () => { state.bad++; paintBadge(el, state); }).addTo(map);
  // the place, and the square we measured where there is one
  L.circleMarker([lat, lon], { radius: 5, color: '#fff', weight: 1.5, fillColor: body === 'earth' ? '#6fb1ff' : body === 'mars' ? '#e0805a' : '#d7dbe4', fillOpacity: 1, interactive: false }).addTo(map);
  if (win) {
    const w = g.project(L.latLng(win.lat, win.lon)), h = win.km * 500;
    L.polygon([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, j]) => g.unproject(L.point(w.x + i * h, w.y + j * h))), { color: '#fff', weight: 1.5, dashArray: '5 4', fill: false, interactive: false }).addTo(map);
  }
  paintBadge(el, state);
  const ro = new ResizeObserver(() => { if (!el.clientWidth || !el.clientHeight) return; map.invalidateSize({ animate: false }); if (pending) { const p = pending; pending = null; p(); } }); ro.observe(el);   // keep the place centred when the layout changes
  return { map, g, state, el, body, lat, lon, ro };
}

function paintBadge(el, st) {
  const b = el.parentNode.querySelector('.zbadge'); if (!b) return;
  const live = st.ok > 0, names = st.layers[0].service;
  b.textContent = live ? 'Live · ' + names : st.bad > 0 ? 'Saved copy · the live service did not answer' : 'Saved copy · asking the live service';
  b.classList.toggle('live', live);
}

function paintScale() {
  const m = maps[0]; if (!m) return;
  if (maps.some(o => o.map.getZoom() !== m.map.getZoom())) return;   // never print a scale the two maps do not share
  const mpp = CFG.m0 / Math.pow(2, m.map.getZoom()), km = niceKm(mpp), px = Math.round(km * 1000 / mpp);
  $('#zscale').innerHTML = `<i style="width:${px}px"></i><span>${km} km on both maps · ${mpp >= 1000 ? (mpp / 1000).toFixed(0) + ' km' : mpp.toFixed(0) + ' m'} per pixel</span>`;
}

function destroy() { pending = null; _destroy(); }
function _destroy() { for (const m of maps) { m.ro.disconnect(); m.map.stop(); m.map.off(); m.map.remove(); } maps = []; }

/* Open the zoom view for one site. opts: { pair, windows: {earth:{lat,lon,km}, other:{...}}, onTerrain } */
export async function openZoom(s, opts = {}) {
  const my = ++token, wrap = $('#zoomwrap'), globes = $('.globes');
  try { await leaflet(); } catch (e) { $('#zoommsg').textContent = 'The map library did not load.'; return; }
  if (!CFG) [CFG, IDX] = await Promise.all([getJson('data/maplayers.json'), getJson('data/maps/index.json')]);
  if (my !== token || !CFG) return;
  const first = wrap.hidden;
  if (first && !reduced && !opts.noFly) { globes.classList.add('diving'); await new Promise(r => setTimeout(r, 650)); if (my !== token) return; }
  destroy();
  const world = s.body === 'mars' ? 'Mars' : 'Moon', has = s.tlat != null, sv0 = (IDX && IDX.sites[opts.savedFrom || s.id]) || {}, sv = opts.savedFrom ? { other: sv0.other } : sv0;
  const pane = (side, title, sub, polar) => `<figure class="zmap ${side}">
      <figcaption><b>${esc(title)}</b><span class="mono">${esc(sub)}</span></figcaption>
      <div class="zbox"><div class="zleaf" id="zm-${side}"></div><span class="zbadge"></span>${polar ? '<span class="znote">Polar view: up is toward 0° longitude, not north</span>' : ''}</div></figure>`;
  $('#zmaps').innerHTML = pane('earth', `Earth · ${s.name}`, fmtLL(s.lat, s.lon), false)
    + (has ? pane('other', `${world} · ${s.target}`, fmtLL(s.tlat, s.tlon), isPolar(s.body, s.tlat))
      : `<figure class="zmap other"><figcaption><b>${world} · ${esc(s.target)}</b></figcaption><div class="zbox none"><p>This pairing is with a process, not one place, so there is no second map.</p></div></figure>`);
  const w = opts.windows || {};
  $('#zoommsg').innerHTML = (w.earth ? `The dashed square is the ${w.earth.km} km window we measured on each world. ` : '')
    + `Pictures: ${esc([...new Set([...CFG.layers.earth, ...(has ? CFG.layers[isPolar(s.body, s.tlat) ? 'moonpolar' : s.body] : [])].map(l => l.credit))].join('; '))}.`
    + (IDX ? ` Saved copies fetched ${esc(IDX.fetched)}.` : '')
    + (opts.onPick ? ` <b>Click anywhere on the Earth map to test that place against our measured window${opts.pickName ? ', ' + esc(opts.pickName) : ''}. The second map then switches to that window.</b>` : '');
  const tb = $('#zterrain'); tb.hidden = !opts.pair; tb.onclick = opts.pair ? () => opts.onTerrain(opts.pair) : null;
  globes.hidden = true; wrap.hidden = false; globes.classList.remove('diving');
  document.body.dataset.zoom = 'on';
  maps.push(buildMap($('#zm-earth'), 'earth', s.lat, s.lon, sv.earth, w.earth));
  if (opts.onPick) { $('#zm-earth').classList.add('pick'); maps[0].map.on('click', e => opts.onPick(e.latlng.lat, e.latlng.lng)); }
  if (has) maps.push(buildMap($('#zm-other'), s.body, s.tlat, s.tlon, sv.other, w.other));
  // one zoom level for both, chosen so the measured window (or 80 km) fits the smaller map
  const span = ((w.earth && w.earth.km) || 60) * 1000 * 1.5, px = Math.min(...maps.map(m => Math.min(m.el.clientWidth, m.el.clientHeight))) || 400;
  const z = Math.max(4, Math.min(8, Math.floor(Math.log2(CFG.m0 * px / span))));
  for (const m of maps) {
    if (!m.g.polar) m.map.setMaxBounds(L.latLngBounds(m.map._atlasFar));   // a box of latitudes means nothing around the pole
    if (reduced || opts.noFly) m.map.setView([m.lat, m.lon], z, { animate: false }); else m.map.flyTo([m.lat, m.lon], z, { duration: 2.6, easeLinearity: 0.2 });
  }
  // once the flight is over the two maps are tied to one zoom level, so they always share a scale
  const flown = maps.slice();
  const settle = () => {
    if (my !== token) return;
    for (const m of flown) {
      if (m.map.getZoom() !== z) m.map.setView([m.lat, m.lon], z, { animate: false });
      m.map.on('zoomend', () => { if (syncing) return; syncing = true; for (const o of maps) if (o !== m && o.map.getZoom() !== m.map.getZoom()) o.map.setZoom(m.map.getZoom(), { animate: false }); syncing = false; paintScale(); });
    }
    paintScale();
  };
  // if the view was left mid-flight, the maps are settled when it is shown again, never while hidden
  setTimeout(() => { if (my !== token) return; if (flown[0].el.clientWidth) settle(); else pending = settle; }, reduced || opts.noFly ? 0 : 2900);
  $('#zscale').textContent = '';
}

export function closeZoom() {
  token++; destroy();
  $('#zoomwrap').hidden = true; $('.globes').hidden = false; delete document.body.dataset.zoom;
}
export const zoomOpen = () => !$('#zoomwrap').hidden;
// Scan results: one square per window on the Earth map, labelled with its score. Clicking a square tests that window.
export function drawScan(cells, km, onPick) {
  const m = maps[0]; if (!m) return;
  if (m.scan) m.scan.remove();
  m.scan = L.layerGroup().addTo(m.map);
  const best = Math.max(...cells.map(c => c.score));
  for (const c of cells) {
    const p = m.g.project(L.latLng(c.lat, c.lon)), h = km * 500;
    const ring = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, j]) => m.g.unproject(L.point(p.x + i * h, p.y + j * h)));
    const top = c.score === best;
    L.polygon(ring, { color: top ? '#f0c060' : '#ffffff', weight: top ? 2.5 : 1, fillColor: '#f0c060', fillOpacity: 0.08 + 0.4 * c.score / 100 })
      .bindTooltip(c.score + '%', { permanent: true, direction: 'center', className: 'ztip' + (top ? ' top' : '') })
      .on('click', e => { L.DomEvent.stopPropagation(e); onPick(c.lat, c.lon); }).addTo(m.scan);
  }
  const z = Math.max(m.map.getMinZoom(), m.map.getZoom() - 1);   // one step back so all nine fit
  for (const o of maps) o.map.setZoom(z, { animate: false });
}
// Leaving the view: stop any flight in progress, so nothing animates on a hidden page
export function pauseZoom() { for (const m of maps) m.map.stop(); }
