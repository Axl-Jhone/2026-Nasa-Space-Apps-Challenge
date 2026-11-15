// ATLAS (Earth Analog Atlas): app logic. All content comes from data/sites.json and data/terrain/*.json.
// Written with an AI assistant (Claude), directed by the team. See the Method and sources tab.
import { $, $$, esc, reduced, fmtLL } from './util.js';
import { loadField, drawTerrain, drawHillshade } from './terrain.js';
import { Globe, loadTextures, refreshAll, kick } from './globe.js';
import { renderPair, renderExplore, renderMethod, labelChip, legendHtml, measTableHtml, srcLinks, simHtml } from './pages.js';
import { initAscii } from './ascii.js';
import { openZoom, closeZoom, zoomOpen, pauseZoom, drawScan } from './zoom.js';
import { readWindow, measure, similarity, radialForm } from './quicktest.js';
import { initSky, playIntro, initScramble } from './intro.js';

const TABS = ['worlds', 'explore', 'side-by-side', 'method'];   // side-by-side has no tab of its own: it opens from a pair page
const VIEWS = [...TABS, 'pair'];   // 'pair' is reached as #pair/<site id>, not from the tab bar
const S = { tab: 'worlds', site: null, other: 'moon', side: 'list', filter: 'moon', pair: 'degerlache', mode: '3d', T: { view: 35, az: 300, el: 14, ve: 2 }, ex: { world: 'all', label: 'all' } };
let D, G = {}, TEX = null;
const fields = new Map();           // terrain id -> field (a real export, or a 'missing' marker)
const byId = id => D.sites.find(s => s.id === id);
const pairById = id => D.pairs.find(p => p.id === id);
const count = (s, code) => D.dims.filter(d => s.d[d[0]][0] === code).length;

/* ---------- boot ---------- */
async function boot() {
  initSky(); playIntro(); initScramble('.brand b, nav.tabs button');   // decoration; the data loads behind it
  try { D = await (await fetch('data/sites.json', { cache: 'no-cache' })).json(); }
  catch (e) { $('main').innerHTML = `<p class="err" style="margin:24px">Could not load data/sites.json. Serve the web folder over http (for example: python -m http.server) instead of opening the file directly.</p>`; return; }
  // A pair marked hideIfMissing is listed only once its terrain export exists
  for (const p of D.pairs.filter(x => x.hideIfMissing)) if ((await getField(p.other, p.body || 'moon')).missing) D.pairs = D.pairs.filter(x => x !== p);
  initAscii(); buildGlobes(); bindDock(); bindZoom(); initSize(); buildFilters(); buildSiteList(); buildPairs(); bindSbs();
  $$('nav.tabs button').forEach(b => b.addEventListener('click', () => { location.hash = '#' + b.dataset.tab; }));
  addEventListener('hashchange', route);
  // a plain click on ATLAS goes home; Ctrl-click and middle-click still open a new tab
  $('.brand').addEventListener('click', e => { if (e.button || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return; e.preventDefault(); goHome(); });
  clearSite(); route();   // no site is chosen until the visitor picks one (or a link names one)
  try { TEX = await loadTextures(); for (const k of ['earth', 'moon', 'mars']) { G[k].setTexture(TEX[k]); } }
  catch (e) { console.warn('globe textures missing; showing plain discs', e); }
}

// Shared with the argument pages (pages.js): terrain loading, and the jump to Side by side
let tempP = null;   // the temperature file is read once
const getTemp = () => tempP || (tempP = fetch('data/temperature.json', { cache: 'no-cache' }).then(r => (r.ok ? r.json() : null)).catch(() => null));
let climP = null;
const getClimate = () => climP || (climP = fetch('data/climate.json', { cache: 'no-cache' }).then(r => (r.ok ? r.json() : null)).catch(() => null));
const ctx = { getField: (id, kind) => getField(id, kind), getTemp, getClimate, openSbs: id => { S.pair = id; syncPairs(); location.hash = '#side-by-side'; } };
function route() {
  const h = location.hash.slice(1), ps = h.startsWith('pair/') ? byId(h.slice(5)) : null;
  const t = ps ? 'pair' : TABS.includes(h) ? h : 'worlds';
  if (t !== 'worlds') { stopTour(); pauseZoom(); }                             // the tour belongs to the Three worlds view
  const names = { worlds: 'Three worlds', explore: 'All pairs', method: 'Method and sources', 'side-by-side': 'Side by side', pair: ps ? ps.short : '' };
  document.title = (names[t] ? names[t] + ' · ' : '') + 'ATLAS: Earth Analog Atlas';
  S.tab = t; document.body.dataset.tab = t;   // the stylesheet shows the globe switch only where there are globes
  for (const id of VIEWS) $('#view-' + id).hidden = id !== t;
  $$('nav.tabs button').forEach(b => b.setAttribute('aria-pressed', b.dataset.tab === (t === 'pair' || t === 'side-by-side' ? 'explore' : t)));
  if (t === 'side-by-side') loadPair();
  else if (t === 'pair') {
    selectSite(ps.id); renderPair(D, ps, ctx);
    // back link: the globes, with this site still chosen and its details open
    $('#pback').addEventListener('click', e => { e.preventDefault(); if (zoomOpen()) zoomOut(); selectSite(ps.id, true); location.hash = '#worlds'; scrollTo(0, 0); });
  }
  else if (t === 'explore') renderExplore(D, S.ex, route, ctx);
  else if (t === 'method') renderMethod(D, ctx);
  else refreshAll();
  kick();
  // links that open a view directly: #zoom/<site> and #test/<lat>,<lon>,<moon|mars>
  if (h.startsWith('zoom/') && byId(h.slice(5))) { selectSite(h.slice(5)); zoomTo(byId(h.slice(5))); }
  const tm = h.match(/^test\/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(moon|mars)$/);
  if (tm && Math.abs(+tm[1]) <= 80 && Math.abs(+tm[2]) <= 180) { setOther(tm[3]); quickTest(+tm[1], +tm[2]); }
}
// ATLAS in the header: back to the globes from anywhere, with the tour stopped, the maps closed and the site list showing
function goHome() {
  stopTour();
  if (zoomOpen()) zoomOut();
  clearSite();
  if (location.hash === '#worlds') route(); else location.hash = '#worlds';   // the same hash fires no hashchange
  scrollTo(0, 0); for (const el of [$('#slist'), $('#sdetail'), $('aside.side')]) if (el) el.scrollTop = 0;
}
const setHash = h => { try { history.replaceState(null, '', h); } catch (e) { /* not allowed in this frame */ } };

/* ---------- 1. three worlds ---------- */
// Pin lists for each world.
function makePins() {
  const pinFor = body => { const m = new Map(); for (const s of D.sites) if (s.body === body && s.tlat != null) { const k = s.tlat + ',' + s.tlon; if (!m.has(k)) m.set(k, { lat: s.tlat, lon: s.tlon, label: s.target, ids: [] }); m.get(k).ids.push(s.id); } return [...m.values()]; };
  const earth = D.sites.map(s => ({ lat: s.lat, lon: s.lon, label: s.short, ids: [s.id] }));
  return { earth, moon: pinFor('moon'), mars: pinFor('mars') };
}

function buildGlobes() {
  const P = makePins();
  const onPin = ids => selectSite(ids.includes(S.site) ? S.site : ids[0], true);
  G.earth = new Globe({ root: $('#globe-earth'), body: 'earth', pins: P.earth, gain: 1.2, S: 512, onPin, auto: true });
  G.moon = new Globe({ root: $('#globe-moon'), body: 'moon', pins: P.moon, gain: 1.35, S: 512, onPin, auto: true });
  G.mars = new Globe({ root: $('#globe-mars'), body: 'mars', pins: P.mars, gain: 1.15, S: 512, onPin, auto: true });
  G.moon.lat = -35; G.moon.lon = 20; G.mars.lat = 30; G.mars.lon = 40;
  // an Earth pin takes the colour of the world its site stands in for
  for (const p of G.earth.pins) { const st = byId(p.ids[0]); if (st) p.el.classList.add('to-' + st.body); }
  // Earth is always shown; the toggle picks the second world and selects nothing. A site of the other world is let go.
  $$('#other-toggle button').forEach(b => b.addEventListener('click', () => {
    setOther(b.dataset.b);
    if (S.site && byId(S.site).body !== b.dataset.b && !zoomOpen()) clearSite();
  }));
}

/* True size: the Moon and Mars globes are drawn at their real width next to Earth. The radii are read from
   data/maplayers.json (the same ones the maps use); nothing is typed here. "Equal" draws all three the same, which is easier to read. */
let RAD = null;
async function initSize() {
  const cfg = await fetch('data/maplayers.json', { cache: 'no-cache' }).then(r => (r.ok ? r.json() : null)).catch(() => null);
  if (!cfg || !cfg.radius_m) { $('#sizemode').parentNode.hidden = true; return; }
  RAD = cfg.radius_m;
  let v = 'true'; try { v = localStorage.getItem('atlas-size') || 'true'; } catch (e) { /* storage may be blocked */ }
  $$('#sizemode button').forEach(b => b.addEventListener('click', () => setSize(b.dataset.size)));
  new ResizeObserver(applySize).observe($('#globe-earth'));
  setSize(v);
}
function setSize(v) {
  S.size = v === 'equal' ? 'equal' : 'true';
  try { localStorage.setItem('atlas-size', S.size); } catch (e) { /* ignore */ }
  $$('#sizemode button').forEach(b => b.setAttribute('aria-pressed', b.dataset.size === S.size));
  $('.globes').dataset.size = S.size;
  for (const b of ['moon', 'mars']) $('#sz-' + b).textContent = S.size === 'true' ? ` · ${Math.round(100 * RAD[b] / RAD.earth)}% of Earth's width` : '';
  applySize();
}
function applySize() {
  if (!RAD) return;
  const base = $('#globe-earth').clientWidth;
  for (const b of ['moon', 'mars']) $('#globe-' + b).style.width = S.size === 'true' && base ? Math.round(base * RAD[b] / RAD.earth) + 'px' : '';
  refreshAll();
}

/* The site panel is a sidebar docked on the right. It sits beside the globes, which shrink to make room and stay usable.
   The handle on its inner edge hides or shows it; the choice is remembered. */
function setDock(open) {
  const d = $('#sites-dock'), t = $('#sites-toggle');
  d.classList.toggle('shut', !open);
  t.setAttribute('aria-expanded', open); t.setAttribute('aria-label', open ? 'Hide the site panel' : 'Show the site panel'); t.title = open ? 'Hide' : 'Show sites';
  try { localStorage.setItem('atlas-sites', open ? 'open' : 'shut'); } catch (e) { /* storage may be blocked */ }
}
function bindDock() {
  let open = innerWidth > 1000;                                   // shown by default where there is room for it
  try { const v = localStorage.getItem('atlas-sites'); if (v) open = v === 'open'; } catch (e) { /* ignore */ }
  setDock(open);
  $('#sites-toggle').addEventListener('click', () => setDock($('#sites-dock').classList.contains('shut')));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && S.tab === 'worlds' && S.side === 'detail') showSideList(); });
  new ResizeObserver(() => refreshAll()).observe($('.globes'));    // the globes redraw at their new size as the panel moves
}

function setOther(b) {
  const changed = S.other !== b;
  S.other = b;
  if (changed) { S.filter = b; syncFilters(); buildSiteList(); }   // choosing a world keeps only that world's sites in the list
  $('#fig-moon').hidden = b !== 'moon'; $('#fig-mars').hidden = b !== 'mars';
  $$('#other-toggle button').forEach(x => x.setAttribute('aria-pressed', x.dataset.b === b));
  refreshAll();   // the newly shown globe needs to be drawn
}

function buildFilters() {
  const F = [['all', 'All'], ['moon', 'Moon'], ['mars', 'Mars'], ['hyp', 'Hypotheses']];
  $('#filters').innerHTML = F.map(([k, l]) => `<button class="pill" data-f="${k}" aria-pressed="${S.filter === k}">${l}</button>`).join('');
  $$('#filters .pill').forEach(b => b.addEventListener('click', () => {
    S.filter = b.dataset.f;
    if (S.filter === 'moon' || S.filter === 'mars') setOther(S.filter);   // the Moon / Mars buttons also switch the globe
    syncFilters(); buildSiteList();
  }));
}
const syncFilters = () => $$('#filters .pill').forEach(x => x.setAttribute('aria-pressed', x.dataset.f === S.filter));
function visibleSites() {
  return D.sites.filter(s => S.filter === 'all' || (S.filter === 'moon' && s.body === 'moon') || (S.filter === 'mars' && s.body === 'mars') ||
    (S.filter === 'hyp' && s.label === 'hypothesis'));
}
function buildSiteList() {
  $('#sitelist').innerHTML = visibleSites().map(s => `<li><button class="site" data-id="${s.id}" aria-pressed="${s.id === S.site}" title="${esc(s.labelNote || '')}">
    <span class="r1"><i class="dot earth"></i>${esc(s.short)}<em class="lb-${esc(s.label)}">${esc((D.labels[s.label] || [s.label])[0])}${s.conf ? ' · ' + s.conf.score + '%' : ''}</em></span>
    <span class="r2"><i class="dot ${s.body}"></i>${esc(s.target)}</span>
    <span class="r3">${count(s, 'M')} measured, ${count(s, 'C')} cited</span></button></li>`).join('')
    + (S.filter === 'moon' || S.filter === 'all' ? `<li class="neg"><b>${esc(D.negative.head)}</b>${esc(D.negative.text)}</li>` : '');
  $$('#sitelist .site').forEach(b => b.addEventListener('click', () => selectSite(b.dataset.id, true)));
}

function selectSite(id, open = false) {
  const s = byId(id); if (!s) return; S.site = id;
  $$('#sitelist .site').forEach(b => b.setAttribute('aria-pressed', b.dataset.id === id));
  for (const g of Object.values(G)) g.markOn([id]);
  pinText(s);
  if (s.body === 'moon' || s.body === 'mars') setOther(s.body);   // show the world this site stands in for
  G.earth.focus(s.lat, s.lon);
  const tg = s.body === 'moon' ? G.moon : G.mars; if (s.tlat != null) tg.focus(s.tlat, s.tlon);
  $('#cap-earth').textContent = `${s.name}, ${s.where}`;
  $('#cap-moon').textContent = s.body === 'moon' ? s.target : 'No counterpart selected';
  $('#cap-mars').textContent = s.body === 'mars' ? s.target : 'No counterpart selected';
  syncZoomBtn();
  if (zoomOpen()) zoomTo(s);                                       // already zoomed in: the maps move to the new pair
  if (open) setDock(true);
  if (open || S.side === 'detail') showSideDetail(s);   // pressing a site opens its details; the toggle only updates them if already open
}
// The chosen site's Earth pin carries its full name and place; every other pin keeps its short name
function pinText(s) {
  for (const p of G.earth.pins) p.el.firstChild.textContent = s && p.ids.includes(s.id) ? `${s.name}, ${s.where}` : p.label;
}
// No site chosen: nothing pressed, no pin marked, the list showing, and the captions ask for a pick
function clearSite() {
  S.site = null;
  $$('#sitelist .site').forEach(b => b.setAttribute('aria-pressed', 'false'));
  for (const g of Object.values(G)) g.markOn([]);
  pinText(null);
  for (const k of ['earth', 'moon', 'mars']) $('#cap-' + k).textContent = 'Pick a site';
  showSideList(); syncZoomBtn();
}
// The zoom button needs a site to zoom to; with the maps open it is the way back
function syncZoomBtn() {
  const b = $('#zoom-go'), open = zoomOpen();
  b.disabled = !open && !S.site; b.setAttribute('aria-pressed', open);
  b.textContent = open ? '← Back to the globes' : S.site ? 'Zoom in to both places' : 'Pick a site to zoom in';
}

/* Zoom view: the globes give way to two maps at one scale. The measured windows are outlined where a pair has them. */
async function zoomTo(s) {
  if (S.tab !== 'worlds') return;                                 // maps are never built on a page that is not showing
  const pair = D.pairs.find(p => p.site === s.id), windows = {};
  if (pair) {
    const [e, o] = await Promise.all([getField(pair.earth, 'earth'), getField(pair.other, pair.body || 'moon')]);
    if (!e.missing && !o.missing) { windows.earth = { ...e.meta.centre, km: e.windowKm }; windows.other = { ...o.meta.centre, km: o.windowKm }; }
  }
  $('#zoom-go').textContent = '← Back to the globes'; $('#zoom-go').setAttribute('aria-pressed', 'true');
  $('#ztest').hidden = true; setHash('#zoom/' + s.id);
  openZoom(s, { pair: pair && windows.earth ? pair.id : null, windows, onTerrain: id => ctx.openSbs(id), onPick: (lat, lon) => quickTest(lat, lon), pickName: testTarget().name });
}

/* Quick test: any place on Earth against the measured Moon or Mars window. Labelled everywhere as a quick test, because it
   reads open elevation tiles in the browser and is not the pipeline. The measures are the pipeline's own (js/quicktest.js). */
const testTarget = () => (S.other === 'mars' ? { pair: pairById('jezero'), name: 'Jezero crater, Mars', world: 'Mars', check: 'Lake Salda' } : { pair: pairById('degerlache'), name: 'de Gerlache crater, Moon', world: 'Moon', check: 'Kamestastin' });
let qtAbort = null;
// Climate for the tested place: one request to NASA POWER, the same service and fields as pipeline/earth_climate.py
async function quickClimate(lat, lon, ac) {
  const slot = $('#qtclim'); if (!slot) return;
  try {
    const r = await fetch(`https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=T2M,T2M_MAX,T2M_MIN,WS10M,PRECTOTCORR&community=AG&longitude=${lon.toFixed(3)}&latitude=${lat.toFixed(3)}&format=JSON`, { signal: ac.signal });
    const p = (await r.json()).properties.parameter, v = k => p[k].ANN;
    if (ac.signal.aborted || !slot.isConnected || [v('T2M'), v('WS10M'), v('PRECTOTCORR')].some(x => x == null || x === -999)) return;
    slot.innerHTML = `<p class="fineprint"><b>Climate here</b> (NASA POWER, a long-term value for a grid cell of about 50 km, not a reading at the spot): mean air temperature ${v('T2M').toFixed(1)} °C, extremes ${v('T2M_MIN').toFixed(0)} to ${v('T2M_MAX').toFixed(0)} °C; mean wind ${v('WS10M').toFixed(1)} m/s; rain and snow ${Math.round(v('PRECTOTCORR') * 365)} mm a year.</p>`;
  } catch (e) { /* the climate line is extra; the test stands without it */ }
}

// Scan: the eight windows that touch the tested one, each measured the same way, to see if a neighbour matches better.
// Windows are read one after another so tiles shared between neighbours come from the cache.
async function scanAround(lat, lon, km, cell, o, centreScore, ac) {
  const out = $('#qtscanout'), btn = $('#qtscan'); if (!out) return;
  btn.disabled = true;
  const R = 6371008.8, dLat = km * 1000 / R * 180 / Math.PI, cells = [{ lat, lon, score: centreScore, here: true }];
  const names = { '-1,1': 'north-west', '0,1': 'north', '1,1': 'north-east', '-1,0': 'west', '1,0': 'east', '-1,-1': 'south-west', '0,-1': 'south', '1,-1': 'south-east' };
  let done = 0;
  for (const key of Object.keys(names)) {
    const [i, j] = key.split(',').map(Number), la = lat + j * dLat, lo = lon + i * dLat / Math.cos(la * Math.PI / 180);
    out.innerHTML = `<p class="qtwait">Scanning: window ${++done} of 8 …</p>`;
    if (Math.abs(la) > 80) continue;
    try { const w = await readWindow(la, lo, km, cell, { signal: ac.signal }); cells.push({ lat: la, lon: lo, score: similarity(measure(w), o.meta).score, where: names[key] }); }
    catch (e) { if (ac.signal.aborted) return; }
  }
  if (ac.signal.aborted || !out.isConnected) return;
  drawScan(cells, km, (a, b) => quickTest(a, b));
  const best = cells.filter(c => !c.here).sort((a, b) => b.score - a.score)[0];
  out.innerHTML = `<p class="fineprint"><b>Scan of the nine windows:</b> ${!best ? 'no neighbouring window could be read.' : best.score > centreScore
    ? `the window to the ${best.where} scores higher, ${best.score}% against ${centreScore}% here. <button class="linkbtn" id="qtbest">Test that window</button>`
    : `none of the eight neighbours scores higher than this one (best neighbour: ${best.score}%, to the ${best.where}).`} Each square on the map shows its score; click one to test it. Same quick-test limits apply.</p>`;
  const bb = $('#qtbest'); if (bb) bb.addEventListener('click', () => quickTest(best.lat, best.lon));
}
const f0 = v => v.toFixed(0);
async function quickTest(lat, lon, check = false) {
  const T = testTarget(), box = $('#ztest'); if (!T.pair) return;
  if (qtAbort) qtAbort.abort(); const ac = qtAbort = new AbortController();     // a newer click cancels the older requests
  const [o, pe] = await Promise.all([getField(T.pair.other, T.pair.body || 'moon'), getField(T.pair.earth, 'earth')]);
  if (o.missing) return;
  if (check) { lat = pe.meta.centre.lat; lon = pe.meta.centre.lon; }
  const km = o.windowKm, cell = o.meta.analysis_cell_m, oc = o.meta.centre, ts = byId(T.pair.site);
  stopTour();
  $('#zoom-go').textContent = '← Back to the globes'; $('#zoom-go').setAttribute('aria-pressed', 'true');
  openZoom({ id: '_test', body: T.pair.body || 'moon', name: check ? pe.meta.name : 'Your place', lat, lon, target: ts.target, tlat: oc.lat, tlon: oc.lon },
    { noFly: zoomOpen(), savedFrom: ts.id, windows: { earth: { lat, lon, km }, other: { lat: oc.lat, lon: oc.lon, km } }, onPick: (a, b) => quickTest(a, b), pickName: T.name });
  if (!check) setHash(`#test/${lat.toFixed(3)},${lon.toFixed(3)},${S.other}`);
  box.hidden = false; box.innerHTML = `<p class="qtwait">Reading open elevation for ${fmtLL(lat, lon)} …</p>`;
  const t0 = performance.now();
  try {
    const w = await readWindow(lat, lon, km, cell, { signal: ac.signal, onStep: (d, n) => { if (!ac.signal.aborted) box.firstChild.textContent = `Reading open elevation for ${fmtLL(lat, lon)} … ${d} of ${n} tiles`; } });
    if (ac.signal.aborted) return;
    let low = 0; for (const z of w.dem) if (z <= 0) low++; low /= w.dem.length;       // open sea is stored as sea floor, below zero
    const sea = low > 0.5 ? `<p class="err"><b>${f0(low * 100)}% of this window lies below sea level.</b> If this is open sea, the tiles hold the sea floor, not a surface anyone could visit, and the score below means nothing.</p>`
      : low > 0.05 ? `<p class="fineprint">${f0(low * 100)}% of this window lies below sea level. Where that is sea, the tiles hold the sea floor, which is counted as ground here.</p>` : '';
    const q = measure(w), sim = similarity(q, o.meta), ms = Math.round(performance.now() - t0), pm = check ? pe.meta.metrics : null;
    const f = (v, d) => v.toFixed(d), row = (name, k, d, unit, pct) => `<tr><th scope="row">${name}</th><td class="n">${pct ? f(q.metrics[k] * 100, 0) : f(q.metrics[k], d)}${unit}</td>${pm ? `<td class="n">${pct ? f(pm[k] * 100, 0) : f(pm[k], d)}${unit}</td>` : ''}<td class="n">${pct ? f(o.meta.metrics[k] * 100, 0) : f(o.meta.metrics[k], d)}${unit}</td></tr>`;
    box.innerHTML = `<div class="qthead"><span class="tag">Quick test · not our pipeline</span>
        <b>${check ? esc(pe.meta.name) : 'Your place'}</b> <span class="mono">${fmtLL(lat, lon)}</span> against <b>${esc(T.name)}</b></div>
      ${sea}
      <p class="qtscore"><b>${sim.score}%</b> terrain similarity <span>slopes ${f(sim.parts.slopes, 0)}% · relief ${f(sim.parts.relief, 0)}% · roughness ${f(sim.parts.roughness, 0)}%</span></p>
      <div class="xwrap"><table class="st2"><thead><tr><th>Measure</th><th>${check ? 'Quick test' : 'Your place'}</th>${pm ? '<th>Our pipeline, same place</th>' : ''}<th>${esc(T.world)} window</th></tr></thead><tbody>
        ${row('Relief', 'relief_p5_p95_m', 0, ' m')}${row('Median slope', 'median_slope_deg', 1, '°')}${row('Steep-end slope', 'p95_slope_deg', 1, '°')}${row('Roughness', 'roughness_m', 1, ' m')}${row('Ground flatter than 8°', 'gentle_share', 0, '%', true)}
        ${T.pair.form ? `<tr><th scope="row">Radial form <small>0 no centred shape, 1 a perfect bowl</small></th><td class="n">${f(radialForm(w), 2)}</td>${pm ? `<td class="n">${f(T.pair.form.earth, 2)}</td>` : ''}<td class="n">${f(T.pair.form.other, 2)}</td></tr>` : ''}
      </tbody></table></div>
      <div id="qtclim"></div>
      <p class="fineprint">Measured in your browser just now: a ${km} km window on ${String(cell).startsWith('8') ? 'an' : 'a'} ${cell} m grid, from ${w.tiles} open elevation tiles (Mapzen Terrain Tiles on AWS Open Data, about ${f(w.tilePixelM, 0)} m here) in ${ms} ms. ${q.metrics.masked_share > 0.005 ? `Flat water left out: ${f(q.metrics.masked_share * 100, 0)}% of the window. ` : ''}The measures are the same ones our pipeline uses, but the elevation source is different and coarser, so treat this as a first look. On very flat ground the tiles are too coarse to trust. Terrain only: it says nothing about rock, temperature or ice.${T.pair.sim ? ` For scale, ${esc(T.check)} scores ${T.pair.sim.score}% in our pipeline.` : ''}</p>
      <div class="qtbtns">${check ? '' : `<button class="zoomgo" id="qtscan">Scan the eight windows around it</button>`}</div>
      <div id="qtscanout"></div>`;
    const sc = $('#qtscan'); if (sc) sc.addEventListener('click', () => scanAround(lat, lon, km, cell, o, sim.score, ac));
    quickClimate(lat, lon, ac);
  } catch (e) {
    if (ac.signal.aborted) return;
    box.innerHTML = `<p class="err">The quick test could not run: ${esc(e.message || String(e))}</p>`;
  }
}
function zoomOut() {
  if (qtAbort) qtAbort.abort(); $('#ztest').hidden = true; setHash('#worlds');
  closeZoom(); syncZoomBtn(); refreshAll(); kick();
}
function bindZoom() {
  $('#zoom-go').addEventListener('click', () => { stopTour(); if (zoomOpen()) zoomOut(); else if (S.site) zoomTo(byId(S.site)); });
  $('#qtform').addEventListener('submit', e => {
    e.preventDefault();
    const m = $('#qtll').value.trim().match(/^(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)$/), lat = m && +m[1], lon = m && +m[2];
    const bad = !m || Math.abs(lat) > 80 || Math.abs(lon) > 180;
    $('#qthelp').textContent = !bad ? 'or click the Earth map' : m && Math.abs(lat) > 80 && Math.abs(lat) <= 90 ? 'The open elevation tiles stop at 80° of latitude, so this place cannot be tested' : 'Type latitude, then longitude, in decimal degrees: for example 64.07, -16.20';
    if (bad) { if (qtAbort) qtAbort.abort(); $('#ztest').hidden = true; }   // an old result must not stand under a new, rejected place
    $('#qthelp').classList.toggle('err', bad); $('#qtll').setAttribute('aria-invalid', bad);
    if (!bad) quickTest(lat, lon);
  });
  $('#tour-go').addEventListener('click', () => { const s = byId(D.tourSite) || byId(S.site); if (tourT.length) stopTour(); else if (s) playTour(s); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') stopTour(); });
}

/* The 30-second tour: one pair, from the globes down to the two places, ending on where the analogy stops.
   Every line it shows is a claim from sites.json with its source ids; nothing is written here. */
let tourT = [];
function stopTour(keep) {
  tourT.forEach(clearTimeout); tourT = [];
  $('#tour-go').textContent = 'Play the 30-second tour'; $('#tour-go').setAttribute('aria-pressed', 'false');
  if (!keep) $('#tourcap').hidden = true;
}
function playTour(s) {
  stopTour(); if (zoomOpen()) zoomOut();
  const cap = $('#tourcap'), world = s.body === 'mars' ? 'Mars' : 'the Moon';
  const say = (kind, label, text, src) => { cap.hidden = false; cap.className = 'tourcap ' + kind; cap.innerHTML = `<span class="k">${esc(label)}</span><span class="t">${esc(text)}${srcLinks(D, src)}</span>`; };
  const steps = [[0, () => { selectSite(s.id); say('', `${s.short} → ${world}`, `${s.name}, ${s.where}, stands in for ${s.target}.`); }],
    [4500, () => { zoomTo(s); say('', 'The claim', s.claim || ''); }]];
  let t = 10500;
  for (const m of (s.matches || []).slice(0, 2)) { steps.push([t, () => say('ok', 'Alike', m.t, m.src)]); t += 5000; }
  for (const b of (s.breaks || []).slice(0, 2)) { steps.push([t, () => say('brk', 'Where it stops', b.t, b.src)]); t += 5000; }
  steps.push([t, () => { stopTour(true); cap.innerHTML += ` <a href="#pair/${s.id}">Open the full case →</a>`; }]);
  $('#tour-go').textContent = 'Stop the tour'; $('#tour-go').setAttribute('aria-pressed', 'true');
  tourT = steps.map(([ms, fn]) => setTimeout(fn, ms));
}

/* Right-hand panel: the site list, or one site's details once a site is pressed */
function showSideList() {
  S.side = 'list'; $('#slist').hidden = false; $('#sdetail').hidden = true; $('aside.side').classList.remove('wide');
}
function showSideDetail(s) {
  const pair = D.pairs.find(p => p.site === s.id);
  const legend = legendHtml(D);
  const cmp = s.cmp || {}, vals = !!s.cmp;   // only a site with recorded values shows the two values
  // An empty cell says why it is empty, so it never contradicts the status next to it
  const empty = (k, c) => k === 'terrain' && c === 'M' ? 'measured, see rows below' : k === 'ops' && c === 'M' ? 'needs a cited slope limit' : 'no data yet';
  // One block per parameter: the legend's letter and the name, the two values where recorded, then the note. Nothing folds.
  const rows = D.dims.map(([k, name]) => {
    const [c, note] = s.d[k], [a, e] = cmp[k] || [], word = D.status[c], help = (D.statusHelp || {})[c];
    const say = esc(word + (help ? ': ' + help : ''));
    const val = (t, who) => `<div><span class="role">${who}</span>${t ? esc(t) : `<span class="none">${empty(k, c)}</span>`}</div>`;
    return `<li class="dim e-${c}"><h4><span class="sw st-${c}" role="img" title="${say}" aria-label="${say}">${esc(word[0])}</span>${esc(name)}</h4>
      ${vals ? `<div class="vals">${val(a, 'Anchor')}${val(e, 'Earth analog')}</div>` : ''}
      <p>${esc(note)}</p>${vals && k === 'terrain' ? '<table class="cmp2 tm"><tbody><tr id="tmslot"></tr></tbody></table>' : ''}</li>`;
  }).join('');
  const band = s.conf ? String(s.conf.band).toLowerCase() : 'none';
  const world = s.body === 'moon' ? 'Moon' : 'Mars';
  const el = $('#sdetail');
  el.innerHTML = `<button class="back" id="sback">← All sites</button>
    <div class="two">
      <div class="place anchor"><span class="role">Anchor · ${world}</span><strong>${esc(s.target)}</strong><span class="mono muted">${s.tlat != null ? fmtLL(s.tlat, s.tlon) : 'A process, with no single place'}</span></div>
      <div class="place cand"><span class="role">Earth analog</span><strong>${esc(s.name)}</strong><span class="mono muted">${esc(s.where)} · ${fmtLL(s.lat, s.lon)}</span></div>
    </div>
    <div class="chips">${labelChip(D, s)}<span>${esc(s.kind)}</span></div>
    <p class="confbadge band-${esc(band)}"><span>Evidence confidence</span> ${s.conf ? `<b>${s.conf.score}%</b> · ${esc(s.conf.band)}` : 'not scored'}</p>
    <div class="mhead"><h3>Are they similar? Parameter by parameter</h3></div>
    <div class="mhead">${legend}</div>
    <ul class="dims">${rows}</ul>
    <div class="more"><h4>Data</h4><p>${esc(s.data)}</p></div>
    <button class="btn alt" id="gozoom">Zoom in to both places on the map</button>
    ${pair ? `<button class="btn alt" id="goside">Compare terrain side by side</button>` : ''}
    <a class="btn go" href="#pair/${s.id}">Open the full case: alike, and where it breaks →</a>`;
  S.side = 'detail'; $('#slist').hidden = true; el.hidden = false; el.scrollTop = 0;
  $('aside.side').classList.add('wide');   // two value columns need more width than the site list
  $('#sback').addEventListener('click', showSideList);
  const b = $('#goside'); if (b) b.addEventListener('click', () => ctx.openSbs(pair.id));
  $('#gozoom').addEventListener('click', () => zoomTo(s));
  fillTerrainMetrics(pair);
}

/* Terrain rows: real numbers for both places, shown only when both windows have an export */
async function fillTerrainMetrics(pair) {
  const slot = $('#tmslot'); if (!slot) return;
  const say = t => { slot.outerHTML = `<tr class="n end"><td colspan="3"><em>${t}</em></td></tr>`; };
  if (!pair) return say('No terrain window for this site yet.');
  const [e, o] = await Promise.all([getField(pair.earth, 'earth'), getField(pair.other, pair.body || 'moon')]);
  if (!slot.isConnected) return;   // the panel was replaced while loading
  if (e.missing || o.missing) return say('Waiting for terrain exports of both windows.');
  const M = [['relief_p5_p95_m', 'Relief (5th to 95th percentile)', 'm'], ['median_slope_deg', 'Median slope', '°'], ['p95_slope_deg', '95th percentile slope', '°'], ['roughness_m', 'Roughness', 'm']];
  slot.outerHTML = M.map(([k, l, u]) => `<tr class="m"><th scope="row">${l}</th><td>${o.meta.metrics[k].toFixed(1)} ${u}</td><td>${e.meta.metrics[k].toFixed(1)} ${u}</td></tr>`).join('')
    + `<tr class="n end"><td colspan="3"><em>Both windows are ${e.windowKm} km, measured on one ${e.meta.analysis_cell_m} m grid (${esc((o.meta.source || {}).dataset || '')}; ${esc((e.meta.source || {}).dataset || '')}).</em></td></tr>`;
}

/* ---------- 3. side by side ---------- */
function buildPairs() {
  $('#pairs').innerHTML = D.pairs.map(p => `<button class="pill" data-id="${p.id}" aria-pressed="${p.id === S.pair}">${esc(p.label)}</button>`).join('');
  $$('#pairs .pill').forEach(b => b.addEventListener('click', () => { S.pair = b.dataset.id; syncPairs(); loadPair(); }));
}
const syncPairs = () => $$('#pairs .pill').forEach(b => b.setAttribute('aria-pressed', b.dataset.id === S.pair));

async function getField(id, kind) { if (!fields.has(id)) fields.set(id, await loadField(id, kind)); return fields.get(id); }
async function loadPair() {
  const p = pairById(S.pair), token = (loadPair.t = (loadPair.t || 0) + 1);
  const [e, o] = await Promise.all([getField(p.earth, 'earth'), getField(p.other, p.body || 'moon')]);
  if (token !== loadPair.t) return;
  $('#sbs-back').href = '#pair/' + p.site;
  renderPanels(p, e, o); renderMeasurements(p, e, o); drawSbs();
}

function panelHtml(f, title, coords, cls, id) {
  const m = f.meta || {}, top = `<div class="ph"><i class="dot ${cls}"></i><strong>${esc(title)}</strong><span class="mono">${esc(coords)}</span></div>`;
  // No export, no picture: a message stands in, never made-up terrain
  if (f.missing) return `<figure class="panel">${top}<div class="cv"><p class="err">No terrain export for this window (${esc(f.why)}). Nothing is drawn in its place.</p></div></figure>`;
  const cap = `${esc((m.source && m.source.dataset) || 'Elevation export')}${m.source && m.source.pixel_m ? `, ${m.source.pixel_m} m source pixels` : ''}. Heights are drawn relative to the median of the dry ground.`;
  return `<figure class="panel">${top}<div class="cv"><canvas id="${id}" role="img" aria-label="3D terrain view of ${esc(title)}"></canvas></div><figcaption>${cap}</figcaption></figure>`;
}
function renderPanels(p, e, o) {
  const site = byId(p.site), oc = p.otherCentre;
  // show the centre the data was actually cut at, when there is an export
  const ec = (!e.missing && e.meta.centre) || { lat: site.lat, lon: site.lon };
  const occ = (!o.missing && o.meta.centre) || oc;
  $('#panels').innerHTML = panelHtml(e, p.earthTitle, fmtLL(ec.lat, ec.lon), 'earth', 'terr-earth') +
    panelHtml(o, p.otherTitle, fmtLL(occ.lat, occ.lon) + (oc.provisional ? ' (provisional)' : ''), p.body || 'moon', 'terr-other');
  // drag to turn, on either canvas, shared camera
  for (const id of ['terr-earth', 'terr-other']) {
    const cv = $('#' + id); if (!cv) continue; let on = false, lx = 0;
    cv.addEventListener('pointerdown', ev => { on = true; lx = ev.clientX; cv.setPointerCapture(ev.pointerId); cv.style.cursor = 'grabbing'; });
    cv.addEventListener('pointermove', ev => { if (!on) return; S.T.view = Math.round((S.T.view - (ev.clientX - lx) * 0.5 + 360) % 360); lx = ev.clientX; $('#ctl-view').value = S.T.view; drawSbs(); });
    const end = () => { on = false; cv.style.cursor = ''; }; cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  }
  $('#lab-earth').textContent = 'Earth'; $('#lab-other').textContent = p.body === 'mars' ? 'Mars' : 'Moon';
  applyMode();
}

let raf = 0;
function drawSbs() {
  if (raf) return;
  raf = requestAnimationFrame(() => {
    raf = 0; if (S.tab !== 'side-by-side') return;
    const p = pairById(S.pair), e = fields.get(p.earth), o = fields.get(p.other); if (!e || !o) return;
    if (e.missing || o.missing) { $('#printed').textContent = 'A terrain export is missing, so nothing is compared.'; $('#printed').hidden = false; return; }
    if (S.mode === '3d') { const a = $('#terr-earth'), b = $('#terr-other'); if (a && b) { drawTerrain(a, e, S.T); drawTerrain(b, o, S.T); } }
    else { drawHillshade($('#hs-earth'), e, S.T); drawHillshade($('#hs-other'), o, S.T); }
    $('#out-view').textContent = S.T.view + '°'; $('#out-az').textContent = S.T.az + '°'; $('#out-el').textContent = S.T.el + '°'; $('#out-ve').textContent = S.T.ve.toFixed(1) + '×';
    printLine(e, o);
  });
}
function printLine(e, o) {
  const parts = [];
  parts.push(e.windowKm === o.windowKm ? `Window ${e.windowKm} × ${e.windowKm} km on both sides` : `WINDOWS DIFFER: ${e.windowKm} km and ${o.windowKm} km`);
  const g = [e, o].map(f => f.meta && f.meta.analysis_cell_m).filter(Boolean); if (g.length === 2) parts.push(g[0] === g[1] ? `analysis grid ${g[0]} m` : `GRIDS DIFFER: ${g[0]} m and ${g[1]} m`);
  const mesh = Math.round(e.windowKm * 1000 / (e.n - 1)); parts.push(`display mesh ${mesh} m`);
  parts.push(`vertical exaggeration ${S.T.ve.toFixed(1)}×`, `sun ${S.T.el}° above the horizon, from ${S.T.az}°`);
  if (S.T.el <= 2) parts.push(`lunar-pole light: the Moon's axis is tilted about 1.5°, so at its poles the Sun stays about this low (NASA Moon Fact Sheet, nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html). Each slope is shaded by how it faces the Sun; shadows cast by one hill on another are not drawn. No place on Earth is lit like this`);
  // measured share from the 80 m grid, so it matches the table
  const m = e.meta && e.meta.metrics;
  const share = m && m.masked_share != null ? m.masked_share : e.water.reduce((a, b) => a + b, 0) / e.water.length;
  if (share > 0) parts.push(`Earth lake masked: ${(share * 100).toFixed(1)}% of window`);
  // the settings line sits at the foot of the sidebar; only a warning stays under the pictures
  S.printed = parts.join(' · ');
  const foot = $('#printed-side'); if (foot) foot.textContent = S.printed;
  const warn = parts.filter(t => /DIFFER/.test(t)).join(' · ');
  $('#printed').textContent = warn; $('#printed').hidden = !warn;
}
function applyMode() {
  const d3 = S.mode === '3d';
  $('#panels').hidden = !d3; $('#slider').hidden = d3;
  $('#mode-3d').setAttribute('aria-pressed', d3); $('#mode-slide').setAttribute('aria-pressed', !d3);
}
function bindSbs() {
  const bind = (id, key, num) => $('#' + id).addEventListener('input', e => { S.T[key] = num ? +e.target.value : e.target.value; drawSbs(); });
  bind('ctl-view', 'view', true); bind('ctl-az', 'az', true); bind('ctl-el', 'el', true); bind('ctl-ve', 've', true);
  $('#ctl-slide').addEventListener('input', e => $('#stage').style.setProperty('--p', e.target.value + '%'));
  $('#mode-3d').addEventListener('click', () => { S.mode = '3d'; applyMode(); drawSbs(); });
  $('#mode-slide').addEventListener('click', () => { S.mode = 'slide'; applyMode(); drawSbs(); });
  // The Moon's axis is tilted about 1.5 degrees (NASA Moon Fact Sheet), so at its poles the Sun never climbs much higher than that
  $('#polar-light').addEventListener('click', () => { S.T.el = 1.5; $('#ctl-el').value = 1.5; drawSbs(); });
  let sweeping = 0; const btn = $('#sweep');
  const stop = () => { cancelAnimationFrame(sweeping); sweeping = 0; btn.textContent = 'Sweep the sun'; };
  btn.addEventListener('click', () => {
    if (sweeping) return stop(); if (reduced) return;
    btn.textContent = 'Stop the sun'; const run = () => { S.T.az = (S.T.az + 1) % 360; $('#ctl-az').value = S.T.az; drawSbs(); sweeping = requestAnimationFrame(run); }; sweeping = requestAnimationFrame(run);
  });
  new ResizeObserver(drawSbs).observe($('#view-side-by-side'));
}

/* ---------- measurements aside ---------- */
// Numbers come from the export's "metrics" (computed in Python on the shared 80 m grid). The browser never recomputes them.
function renderMeasurements(p, e, o) {
  const me = (e.meta && e.meta.metrics) || null, mo = (o.meta && o.meta.metrics) || null;
  const pending = e.missing || o.missing || !me || !mo;
  const sim = simHtml(p), sec = (h, body, cls = '') => `<section class="ms ${cls}">${h ? `<h2>${h}</h2>` : ''}${body}</section>`;
  // the similarity leads, always with its three parts; the settings line closes the sidebar
  $('#meas').innerHTML =
    (sim ? sec('Terrain similarity', sim) : '') +
    sec('Measured on one grid', `${pending ? `<p class="err">Measurements appear when both windows have a real export with metrics. Until then every number here is blank on purpose.</p>` : ''}
    ${measTableHtml(e, o)}
    <p class="fineprint">The last column is a plain ratio, not a verdict. The terrain similarity ${sim ? 'above ' : ''}averages three of these measures, and is always shown with its three parts.</p>`) +
    sec('', histHtml(e, o)) + sec('', profileHtml(e, o)) +
    sec('Does the method work? Controls', `<ul>${D.controls.map(c => `<li>${esc(c.text)}: ${esc(c.state)}</li>`).join('')}</ul>`) +
    sec('What it means for operations', `<div>${esc(D.operations)}${srcLinks(D, D.operationsSrc)}</div>`) +
    sec('Where it breaks', `<div>${esc(D.breaks)}</div><a href="#pair/${p.site}">Read the full case for this pair →</a>`, 'brk') +
    sec('Window and display settings', `<p class="printed" id="printed-side">${esc(S.printed || '')}</p>`);
}
function histHtml(e, o) {
  const ha = e.meta && e.meta.slope_hist, hb = o.meta && o.meta.slope_hist;
  const head = `<figcaption>Slope distribution, same bins both sides ${(!ha || !hb) ? '<span class="tag">PENDING</span>' : ''}</figcaption>`;
  if (!ha || !hb || ha.frac.length !== hb.frac.length) return `<figure class="hist">${head}<p class="fineprint">Appears when both exports carry a slope histogram.</p></figure>`;
  const W = 300, H = 140, x0 = 30, x1 = 290, y0 = 112, y1 = 8, nb = ha.frac.length, top = Math.max(...ha.frac, ...hb.frac) || 1;
  const pts = f => f.map((v, i) => `${(x0 + (i + 0.5) / nb * (x1 - x0)).toFixed(1)},${(y0 - v / top * (y0 - y1)).toFixed(1)}`).join(' ');
  const maxDeg = ha.edges_deg[ha.edges_deg.length - 1];
  return `<figure class="hist">${head}<svg role="img" aria-label="Slope histograms for the two windows" viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">
    <line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y0}" stroke="#2c2748"/><line x1="${x0}" y1="${y1}" x2="${x0}" y2="${y0}" stroke="#2c2748"/>
    <polyline fill="none" stroke="#a88bff" stroke-width="2" points="${pts(ha.frac)}"/><polyline fill="none" stroke="#c9c7d8" stroke-width="2" stroke-dasharray="5 3" points="${pts(hb.frac)}"/>
    <text x="160" y="132" fill="#a09db5" font-size="12" text-anchor="middle">slope (degrees, 0 to ${maxDeg})</text>
    <text x="${x1 - 40}" y="22" fill="#a88bff" font-size="12">Earth</text><text x="${x1 - 40}" y="36" fill="#c9c7d8" font-size="12">${o.kind === 'mars' ? 'Mars' : 'Moon'}</text></svg></figure>`;
}

// One line across each window, drawn from the exported heights on one pair of axes. Nothing is recomputed: these are the
// stored heights of the middle row, each relative to its own window's median, so shape and depth can be compared by eye.
function profileHtml(e, o) {
  if (e.missing || o.missing || e.windowKm !== o.windowKm) return '';
  const row = f => { const r = f.n >> 1; return Array.from({ length: f.n }, (_, i) => f.h[r * f.n + i]); };
  const a = row(e), b = row(o), lo = Math.min(...a, ...b), hi = Math.max(...a, ...b);
  const W = 300, H = 150, x0 = 38, x1 = 292, y0 = 118, y1 = 10, km = e.windowKm;
  const pts = v => v.map((z, i) => `${(x0 + i / (v.length - 1) * (x1 - x0)).toFixed(1)},${(y0 - (z - lo) / (hi - lo || 1) * (y0 - y1)).toFixed(1)}`).join(' ');
  const yz = y0 - (0 - lo) / (hi - lo || 1) * (y0 - y1);
  const ve = ((y0 - y1) / (hi - lo || 1)) / ((x1 - x0) / (km * 1000));
  const wet = e.water && Array.from({ length: e.n }, (_, i) => e.water[(e.n >> 1) * e.n + i]).some(Boolean);
  const other = o.kind === 'mars' ? 'Mars' : 'Moon';
  return `<figure class="hist"><figcaption>One line across each window, same axes</figcaption>
    <svg role="img" aria-label="Height along the middle of each window" viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">
    <line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y0}" stroke="#2c2748"/><line x1="${x0}" y1="${y1}" x2="${x0}" y2="${y0}" stroke="#2c2748"/>
    <line x1="${x0}" y1="${yz.toFixed(1)}" x2="${x1}" y2="${yz.toFixed(1)}" stroke="#2c2748" stroke-dasharray="2 4"/>
    <polyline fill="none" stroke="#a88bff" stroke-width="2" points="${pts(a)}"/><polyline fill="none" stroke="#c9c7d8" stroke-width="2" stroke-dasharray="5 3" points="${pts(b)}"/>
    <text x="${x0 - 4}" y="${y1 + 4}" fill="#a09db5" font-size="11" text-anchor="end">${Math.round(hi)}</text><text x="${x0 - 4}" y="${y0}" fill="#a09db5" font-size="11" text-anchor="end">${Math.round(lo)}</text>
    <text x="${x0}" y="${y0 + 13}" fill="#a09db5" font-size="11">0</text><text x="${x1}" y="${y0 + 13}" fill="#a09db5" font-size="11" text-anchor="end">${km} km</text>
    <text x="165" y="${H - 4}" fill="#a09db5" font-size="12" text-anchor="middle">left to right through the centre</text>
    <text x="${x1 - 40}" y="22" fill="#a88bff" font-size="12">Earth</text><text x="${x1 - 40}" y="36" fill="#c9c7d8" font-size="12">${other}</text></svg>
    <p class="fineprint">Heights in metres from each window's own median, read from the middle row of the two exports. The vertical scale is stretched ${ve.toFixed(0)} times.${wet ? ' The flat stretch on the Earth line is the lake surface.' : ''} One line is one line: the table above uses the whole window.</p></figure>`;
}

boot();
