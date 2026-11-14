// ATLAS (Earth Analog Atlas): app logic. All content comes from data/sites.json and data/terrain/*.json.
// Written with an AI assistant (Claude), directed by the team. See the Method and sources tab.
import { $, $$, esc, reduced, fmtLL } from './util.js';
import { loadField, drawTerrain, drawHillshade } from './terrain.js';
import { Globe, loadTextures, refreshAll, kick } from './globe.js';
import { renderPair, renderExplore, renderMethod, labelChip, legendHtml, measTableHtml, srcLinks, matrixHtml } from './pages.js';
import { initAscii } from './ascii.js';

const TABS = ['worlds', 'explore', 'planets', 'side-by-side', 'method'];
const VIEWS = [...TABS, 'pair'];   // 'pair' is reached as #pair/<site id>, not from the tab bar
const S = { tab: 'worlds', site: 'kamestastin', other: 'moon', side: 'list', filter: 'moon', planet: 'moon', pair: 'degerlache', mode: '3d', T: { view: 35, az: 300, el: 14, ve: 2 }, ex: { world: 'all', label: 'all' } };
let D, G = {}, PG = {}, TEX = null;
const fields = new Map();           // terrain id -> field (real or sample)
const byId = id => D.sites.find(s => s.id === id);
const pairById = id => D.pairs.find(p => p.id === id);
const bodyName = b => ({ earth: 'Earth', moon: 'the Moon', mars: 'Mars' }[b]);
const count = (s, code) => D.dims.filter(d => s.d[d[0]][0] === code).length;

/* ---------- boot ---------- */
async function boot() {
  try { D = await (await fetch('data/sites.json', { cache: 'no-cache' })).json(); }
  catch (e) { $('main').innerHTML = `<p class="err" style="margin:24px">Could not load data/sites.json. Serve the web folder over http (for example: python -m http.server) instead of opening the file directly.</p>`; return; }
  // A pair marked hideIfSample is shown only once its real terrain export exists, so placeholder terrain never reaches the page
  for (const p of D.pairs.filter(x => x.hideIfSample)) if ((await getField(p.other, 'moon')).sample) D.pairs = D.pairs.filter(x => x !== p);
  $('#credit').textContent = D.imagery;
  $('#pnote').textContent = D.planetsNote || '';
  initAscii(); buildIntro(); buildGlobes(); buildFilters(); buildSiteList(); buildPlanets(); buildPairs(); bindSbs();
  $$('nav.tabs button').forEach(b => b.addEventListener('click', () => { location.hash = '#' + b.dataset.tab; }));
  addEventListener('hashchange', route);
  try { const s = localStorage.getItem('atlas-site'); if (s && byId(s)) S.site = s; } catch (e) { /* storage may be blocked */ }
  selectSite(S.site); route(); renderPlanet();
  try { TEX = await loadTextures(); for (const k of ['earth', 'moon', 'mars']) { G[k].setTexture(TEX[k]); PG[k].setTexture(TEX[k]); } }
  catch (e) { console.warn('globe textures missing; showing plain discs', e); }
}

// Shared with the argument pages (pages.js): terrain loading, and the jump to Side by side
const ctx = { getField: (id, kind) => getField(id, kind), openSbs: id => { S.pair = id; syncPairs(); location.hash = '#side-by-side'; } };
function route() {
  const h = location.hash.slice(1), ps = h.startsWith('pair/') ? byId(h.slice(5)) : null;
  const t = ps ? 'pair' : TABS.includes(h) ? h : 'worlds';
  S.tab = t;
  for (const id of VIEWS) $('#view-' + id).hidden = id !== t;
  $$('nav.tabs button').forEach(b => b.setAttribute('aria-pressed', b.dataset.tab === (t === 'pair' ? 'explore' : t)));
  if (t === 'side-by-side') loadPair();
  else if (t === 'pair') { selectSite(ps.id); renderPair(D, ps, ctx); }
  else if (t === 'explore') renderExplore(D, S.ex, route);
  else if (t === 'method') renderMethod(D, ctx);
  else refreshAll();
  kick();
}

/* ---------- 1. three worlds ---------- */
// One line above the globes that says what the site argues, and where to start. Counts come from the data.
function buildIntro() {
  const I = D.intro, el = $('#intro'); if (!I || !el) return;
  const n = b => D.sites.filter(s => s.body === b).length, start = byId(I.start);
  el.innerHTML = `<span class="k">${D.sites.length} Earth sites · ${n('moon')} for the Moon · ${n('mars')} for Mars</span>
    <span class="l">${esc(I.before)} <em>${esc(I.hold)}</em>${esc(I.mid)} <em class="brk">${esc(I.brk)}</em>${esc(I.after)}</span>
    ${start ? `<a class="btn" href="#pair/${start.id}">${esc(I.cta)}</a>` : ''}`;
}

// Pin lists for each world. Used by the Three worlds globes and the Planets globes, so both show the same pins.
function makePins() {
  const pinFor = body => { const m = new Map(); for (const s of D.sites) if (s.body === body && s.tlat != null) { const k = s.tlat + ',' + s.tlon; if (!m.has(k)) m.set(k, { lat: s.tlat, lon: s.tlon, label: s.target, ids: [] }); m.get(k).ids.push(s.id); } return [...m.values()]; };
  const earth = D.sites.map(s => ({ lat: s.lat, lon: s.lon, label: s.short, ids: [s.id] }))
    .concat(D.context.map(c => ({ lat: c.lat, lon: c.lon, label: c.name + ': already a well-known analog', ctx: true })));
  return { earth, moon: pinFor('moon'), mars: pinFor('mars') };
}

function buildGlobes() {
  const P = makePins();
  const onPin = ids => selectSite(ids.includes(S.site) ? S.site : ids[0], true);
  G.earth = new Globe({ root: $('#globe-earth'), body: 'earth', pins: P.earth, gain: 1.2, S: 512, onPin });
  G.moon = new Globe({ root: $('#globe-moon'), body: 'moon', pins: P.moon, gain: 1.35, S: 512, onPin });
  G.mars = new Globe({ root: $('#globe-mars'), body: 'mars', pins: P.mars, gain: 1.15, S: 512, onPin });
  G.moon.lat = -35; G.moon.lon = 20; G.mars.lat = 30; G.mars.lon = 40;
  // Earth is always shown; the toggle picks the second world. Choosing one with no selected site there selects its first site.
  $$('#other-toggle button').forEach(b => b.addEventListener('click', () => {
    setOther(b.dataset.b);
    if (byId(S.site).body !== b.dataset.b) { const first = D.sites.find(s => s.body === b.dataset.b); if (first) selectSite(first.id); }
  }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && S.tab === 'worlds' && S.side === 'detail') showSideList(); });
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
    <span class="r1"><i class="dot earth"></i>${esc(s.short)}<em class="lb-${esc(s.label)}">${esc((D.labels[s.label] || [s.label])[0])}</em></span>
    <span class="r2"><i class="dot ${s.body}"></i>${esc(s.target)}</span>
    <span class="r3">${count(s, 'M')} measured, ${count(s, 'C')} cited</span></button></li>`).join('')
    + (S.filter === 'moon' || S.filter === 'all' ? `<li class="neg"><b>${esc(D.negative.head)}</b>${esc(D.negative.text)}</li>` : '');
  $$('#sitelist .site').forEach(b => b.addEventListener('click', () => selectSite(b.dataset.id, true)));
}

function selectSite(id, open = false) {
  const s = byId(id); if (!s) return; S.site = id;
  try { localStorage.setItem('atlas-site', id); } catch (e) { /* ignore */ }
  $$('#sitelist .site').forEach(b => b.setAttribute('aria-pressed', b.dataset.id === id));
  for (const g of Object.values(G)) g.markOn([id]);
  if (s.body === 'moon' || s.body === 'mars') setOther(s.body);   // show the world this site stands in for
  G.earth.focus(s.lat, s.lon);
  const tg = s.body === 'moon' ? G.moon : G.mars; if (s.tlat != null) tg.focus(s.tlat, s.tlon);
  $('#cap-earth').textContent = `${s.name}, ${s.where}`;
  $('#cap-moon').textContent = s.body === 'moon' ? s.target : 'No counterpart selected';
  $('#cap-mars').textContent = s.body === 'mars' ? s.target : 'No counterpart selected';
  if (open || S.side === 'detail') showSideDetail(s);   // pressing a site opens its details; the toggle only updates them if already open
}

/* Right-hand panel: the site list, or one site's details once a site is pressed */
function showSideList() {
  S.side = 'list'; $('#slist').hidden = false; $('#sdetail').hidden = true; $('aside.side').classList.remove('wide');
}
function showSideDetail(s) {
  const pair = D.pairs.find(p => p.site === s.id);
  const legend = legendHtml(D);
  const cmp = s.cmp || {};
  // An empty cell says why it is empty, so it never contradicts the status next to it
  const empty = (k, c) => k === 'terrain' && c === 'M' ? 'measured, see rows below' : k === 'ops' && c === 'M' ? 'needs a cited slope limit' : 'no data yet';
  const cell = (t, k, c) => t ? `<td>${esc(t)}</td>` : `<td class="none">${empty(k, c)}</td>`;
  // Two value columns (anchor, Earth analog) per parameter, then the match verdict and note underneath
  const rows = D.dims.map(([k, name]) => {
    const [c, note] = s.d[k], [a, e] = cmp[k] || [];
    return `<tr class="p"><th scope="row" class="st-${c}">${esc(name)}<i>${esc(D.status[c])}</i></th>${cell(a, k, c)}${cell(e, k, c)}</tr>
      <tr class="n${k === 'terrain' ? '' : ' end'}"><td colspan="3">${esc(note)}</td></tr>${k === 'terrain' ? '<tr id="tmslot"></tr>' : ''}`;
  }).join('');
  const world = s.body === 'moon' ? 'Moon' : 'Mars';
  const el = $('#sdetail');
  el.innerHTML = `<button class="back" id="sback">← All sites</button>
    <div class="two">
      <div class="place anchor"><span class="role">Anchor · ${world}</span><strong>${esc(s.target)}</strong><span class="mono muted">${s.tlat != null ? fmtLL(s.tlat, s.tlon) : 'A process, with no single place'}</span></div>
      <div class="place cand"><span class="role">Earth analog</span><strong>${esc(s.name)}</strong><span class="mono muted">${esc(s.where)} · ${fmtLL(s.lat, s.lon)}</span></div>
    </div>
    <div class="chips">${labelChip(D, s)}<span>Confidence: ${esc(s.confidence || 'not rated')}</span><span>${esc(s.kind)}</span></div>
    <p>${esc(s.claim || '')}</p>
    <a class="btn go" href="#pair/${s.id}">Open the full case: alike, and where it breaks →</a>
    <p><span class="muted">How it helps exploration: </span>${esc(s.helps)}</p>
    <div class="mhead"><h3>Are they similar? Parameter by parameter</h3></div>
    <div class="mhead">${legend}</div>
    ${s.cmp ? `<table class="cmp2"><thead><tr><th></th><th>Anchor<small>${esc(s.target)}</small></th><th>Earth analog<small>${esc(s.short)}</small></th></tr></thead><tbody>${rows}</tbody></table>
    <p class="fineprint">${esc(s.cmpNote || '')}</p>` : matrixHtml(D, s, 'one')}
    <p class="fineprint">Data: ${esc(s.data)}</p>
    ${pair ? `<button class="btn alt" id="goside">Compare terrain side by side</button>` : ''}
    <p class="fineprint">Every site, always: Earth cannot reproduce the reduced gravity, the lunar vacuum, the thin Martian air or their radiation.</p>`;
  S.side = 'detail'; $('#slist').hidden = true; el.hidden = false; el.scrollTop = 0;
  $('aside.side').classList.add('wide');   // two value columns need more width than the site list
  $('#sback').addEventListener('click', showSideList);
  const b = $('#goside'); if (b) b.addEventListener('click', () => ctx.openSbs(pair.id));
  fillTerrainMetrics(pair);
}

/* Terrain rows: real numbers for both places, but only when both windows have a real export (never sample terrain) */
async function fillTerrainMetrics(pair) {
  const slot = $('#tmslot'); if (!slot) return;
  const say = t => { slot.outerHTML = `<tr class="n end"><td colspan="3"><em>${t}</em></td></tr>`; };
  if (!pair) return say('No terrain window for this site yet.');
  const [e, o] = await Promise.all([getField(pair.earth, 'earth'), getField(pair.other, 'moon')]);
  if (!slot.isConnected) return;   // the panel was replaced while loading
  if (e.sample || o.sample) return say('Waiting for real terrain exports of both windows.');
  const M = [['relief_p5_p95_m', 'Relief (5th to 95th percentile)', 'm'], ['median_slope_deg', 'Median slope', '°'], ['p95_slope_deg', '95th percentile slope', '°'], ['roughness_m', 'Roughness', 'm']];
  slot.outerHTML = M.map(([k, l, u]) => `<tr class="m"><th scope="row">${l}</th><td>${o.meta.metrics[k].toFixed(1)} ${u}</td><td>${e.meta.metrics[k].toFixed(1)} ${u}</td></tr>`).join('')
    + `<tr class="n end"><td colspan="3"><em>Both windows are 40 km, measured on one 80 m grid (${esc((o.meta.source || {}).dataset || '')}; ${esc((e.meta.source || {}).dataset || '')}).</em></td></tr>`;
}

/* ---------- 2. planets ---------- */
function buildPlanets() {
  const order = ['earth', 'moon', 'mars'];
  $('#pnav').innerHTML = order.map(k => `<button data-p="${k}" aria-pressed="${S.planet === k}"><span class="pd"></span>${D.planets[k].name}</button>`).join('');
  $$('#pnav button').forEach(b => b.addEventListener('click', () => { S.planet = b.dataset.p; renderPlanet(); }));
  const gain = { earth: 1.2, moon: 1.35, mars: 1.15 };
  const pins = makePins();
  for (const k of order) {
    PG[k] = new Globe({ root: $('#pglobe-' + k), body: k, pins: pins[k], gain: gain[k], S: 480, spin: true, onPin: ids => showPop(k, ids) });
    PG[k].lat = 15; PG[k].lon = { earth: -60, moon: 20, mars: 40 }[k];
    // The globe turns on its own, which makes pins hard to click: pause the spin while the mouse is over it
    PG[k].root.addEventListener('pointerenter', () => { PG[k].spin = false; });
    PG[k].root.addEventListener('pointerleave', () => { if (popFor !== k) { PG[k].spin = true; kick(); } });
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePop(); });
}

/* Pin card on the Planets tab: click a pin to see the site; the globe stays still while the card is open */
let popFor = null;
function closePop() {
  const pop = $('#pop'); if (pop) pop.hidden = true;
  if (popFor) { PG[popFor].markOn(null); PG[popFor].spin = true; kick(); }
  popFor = null;
}
function showPop(k, ids) {
  const sites = ids.map(id => D.sites.find(s => s.id === id)).filter(Boolean); if (!sites.length) return;
  if (popFor && popFor !== k) closePop();
  popFor = k; PG[k].spin = false; PG[k].markOn(ids);
  const pair = D.pairs.find(p => ids.includes(p.site));
  const chips = s => `<div class="chips">${labelChip(D, s)}<span>${esc(s.kind)}</span><span>Scale: ${esc(s.scale)}</span></div>`;
  const body = k === 'earth'
    ? `<h3>${esc(sites[0].name)}</h3><div class="pw">${esc(sites[0].where)}</div>
       <p>Stands in for <strong>${esc(sites[0].target)}</strong> on ${bodyName(sites[0].body)}</p>${chips(sites[0])}
       <p>${esc(sites[0].helps)}</p><p><a href="#pair/${sites[0].id}">Open the full case →</a></p>`
    : `<h3>${esc(sites[0].target)}</h3><div class="pw">${bodyName(k)}</div>
       <p>Earth sites that stand in for this place:</p>
       <ul>${sites.map(s => `<li><a href="#pair/${s.id}"><strong>${esc(s.name)}</strong></a>, ${esc(s.where)}. ${esc(s.helps)}</li>`).join('')}</ul>`;
  const pop = $('#pop');
  pop.innerHTML = `<button class="x" aria-label="Close">×</button>${body}<canvas class="thumb" hidden></canvas><div class="thumbnote fineprint"></div>${pair ? `<button class="btn" data-pair="${pair.id}">Compare terrain side by side</button>` : ''}`;
  pop.hidden = false;
  // Small terrain picture: drawn only from a real export, never from the labelled sample terrain
  const thumb = $('.thumb', pop), note = $('.thumbnote', pop), tid = pair && (k === 'earth' ? pair.earth : pair.other);
  if (!tid) note.textContent = 'No terrain window for this place yet.';
  else getField(tid, k === 'earth' ? 'earth' : 'moon').then(f => {
    if (!pop.contains(thumb)) return;            // the card was closed or replaced while loading
    if (f.sample) { note.textContent = 'No real terrain export for this window yet.'; return; }
    drawHillshade(thumb, f, { view: 35, az: 300, el: 30, ve: 2 }); thumb.hidden = false;
    const src = f.meta.source || {};
    note.textContent = `Shaded relief of the ${f.windowKm} km window${src.dataset ? ', ' + src.dataset : ''}. Light from the north-west.`;
  });
  $('.x', pop).addEventListener('click', closePop);
  const b = $('[data-pair]', pop); if (b) b.addEventListener('click', () => { S.pair = b.dataset.pair; syncPairs(); location.hash = '#side-by-side'; });
}
function renderPlanet() {
  closePop();
  const k = S.planet, P = D.planets[k];
  $$('#pnav button').forEach(b => { b.setAttribute('aria-pressed', b.dataset.p === k); b.style.color = b.dataset.p === k ? '#fff' : ''; });
  for (const id of ['earth', 'moon', 'mars']) $('#pglobe-' + id).hidden = id !== k;
  const sites = (k === 'earth' ? D.sites : D.sites.filter(s => s.body === k)).map(s => k === 'earth' ? `${s.short}, ${s.where}` : `${s.short} → ${s.target}`);
  $('#pstats').innerHTML = P.stats.map(([v, l]) => `<li><span><b>${esc(v)}</b><span>${esc(l)}</span></span><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a3acbd" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg></li>`).join('');
  $('#pcard').innerHTML = `<h2>${esc(P.caps)}</h2><p class="desc">${esc(P.desc)}</p>
    <div class="sl"><div>${esc(P.sitesHead)}</div><ul>${sites.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
    <div class="limit"><b>What Earth cannot reproduce</b><span>${esc(P.limit)}</span></div>`;
  refreshAll();
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
  const [e, o] = await Promise.all([getField(p.earth, 'earth'), getField(p.other, 'moon')]);
  if (token !== loadPair.t) return;
  renderPanels(p, e, o); renderMeasurements(p, e, o); drawSbs();
}

function panelHtml(f, title, coords, cls, id) {
  const m = f.meta || {};
  const note = f.sample ? `<span class="tag">SAMPLE · ${esc(f.why || 'no export yet')}</span>` : '';
  const cap = f.sample ? 'Generated placeholder terrain. Replace it by exporting the real window (see README).'
    : `${esc((m.source && m.source.dataset) || 'Elevation export')}${m.source && m.source.pixel_m ? `, ${m.source.pixel_m} m source pixels` : ''}. Heights are drawn relative to the median of the dry ground.`;
  return `<figure class="panel"><div class="ph"><i class="dot ${cls}"></i><strong>${esc(title)}</strong><span class="mono">${esc(coords)}</span></div>
    <div class="cv">${note ? `<span class="tg">${note}</span>` : ''}<canvas id="${id}" role="img" aria-label="3D terrain view of ${esc(title)}"></canvas></div><figcaption>${cap}</figcaption></figure>`;
}
function renderPanels(p, e, o) {
  const site = byId(p.site), oc = p.otherCentre;
  // show the centre the data was actually cut at, when there is an export
  const ec = (!e.sample && e.meta.centre) || { lat: site.lat, lon: site.lon };
  const occ = (!o.sample && o.meta.centre) || oc;
  $('#panels').innerHTML = panelHtml(e, p.earthTitle, fmtLL(ec.lat, ec.lon), 'earth', 'terr-earth') +
    panelHtml(o, p.otherTitle, fmtLL(occ.lat, occ.lon) + (oc.provisional ? ' (provisional)' : ''), 'moon', 'terr-other');
  // drag to turn, on either canvas, shared camera
  for (const id of ['terr-earth', 'terr-other']) {
    const cv = $('#' + id); let on = false, lx = 0;
    cv.addEventListener('pointerdown', ev => { on = true; lx = ev.clientX; cv.setPointerCapture(ev.pointerId); cv.style.cursor = 'grabbing'; });
    cv.addEventListener('pointermove', ev => { if (!on) return; S.T.view = Math.round((S.T.view - (ev.clientX - lx) * 0.5 + 360) % 360); lx = ev.clientX; $('#ctl-view').value = S.T.view; drawSbs(); });
    const end = () => { on = false; cv.style.cursor = ''; }; cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  }
  $('#lab-earth').textContent = 'Earth'; $('#lab-other').textContent = 'Moon';
  applyMode();
}

let raf = 0;
function drawSbs() {
  if (raf) return;
  raf = requestAnimationFrame(() => {
    raf = 0; if (S.tab !== 'side-by-side') return;
    const p = pairById(S.pair), e = fields.get(p.earth), o = fields.get(p.other); if (!e || !o) return;
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
  // measured share from the 80 m grid, so it matches the table
  const m = e.meta && e.meta.metrics;
  const share = m && m.masked_share != null ? m.masked_share : e.water.reduce((a, b) => a + b, 0) / e.water.length;
  if (!e.sample && share > 0) parts.push(`Earth lake masked: ${(share * 100).toFixed(1)}% of window`);
  if (e.sample || o.sample) parts.push('SAMPLE terrain shown where no export exists');
  $('#printed').textContent = parts.join(' · ');
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
  const pending = e.sample || o.sample || !me || !mo;
  $('#meas').innerHTML = `
    <h2>Measured on one grid</h2>
    ${pending ? `<p class="err">Measurements appear when both windows have a real export with metrics. Until then every number here is blank on purpose.</p>` : ''}
    ${measTableHtml(e, o)}
    <p class="fineprint">The last column is a plain ratio, not a verdict. We report each measure separately and do not combine them into one score.</p>
    ${histHtml(e, o)}
    <div class="box"><b>Does the method work? Controls</b><ul>${D.controls.map(c => `<li>${esc(c.text)}: ${esc(c.state)}</li>`).join('')}</ul></div>
    <div class="box"><b>What it means for operations</b><div>${esc(D.operations)}${srcLinks(D, D.operationsSrc)}</div></div>
    <div class="box brk"><b>Where it breaks</b><div>${esc(D.breaks)}</div><a href="#pair/${p.site}">Read the full case for this pair →</a></div>`;
}
function histHtml(e, o) {
  const ha = e.meta && e.meta.slope_hist, hb = o.meta && o.meta.slope_hist;
  const head = `<figcaption>Slope distribution, same bins both sides ${(!ha || !hb || e.sample || o.sample) ? '<span class="tag">PENDING</span>' : ''}</figcaption>`;
  if (!ha || !hb || e.sample || o.sample || ha.frac.length !== hb.frac.length) return `<figure class="hist">${head}<p class="fineprint">Appears when both exports carry a slope histogram.</p></figure>`;
  const W = 300, H = 140, x0 = 30, x1 = 290, y0 = 112, y1 = 8, nb = ha.frac.length, top = Math.max(...ha.frac, ...hb.frac) || 1;
  const pts = f => f.map((v, i) => `${(x0 + (i + 0.5) / nb * (x1 - x0)).toFixed(1)},${(y0 - v / top * (y0 - y1)).toFixed(1)}`).join(' ');
  const maxDeg = ha.edges_deg[ha.edges_deg.length - 1];
  return `<figure class="hist">${head}<svg role="img" aria-label="Slope histograms for Earth and Moon" viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">
    <line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y0}" stroke="#3a4560"/><line x1="${x0}" y1="${y1}" x2="${x0}" y2="${y0}" stroke="#3a4560"/>
    <polyline fill="none" stroke="#e0a03a" stroke-width="2" points="${pts(ha.frac)}"/><polyline fill="none" stroke="#a9b4c8" stroke-width="2" stroke-dasharray="5 3" points="${pts(hb.frac)}"/>
    <text x="160" y="132" fill="#a3acbd" font-size="12" text-anchor="middle">slope (degrees, 0 to ${maxDeg})</text>
    <text x="${x1 - 40}" y="22" fill="#e0a03a" font-size="12">Earth</text><text x="${x1 - 40}" y="36" fill="#a9b4c8" font-size="12">Moon</text></svg></figure>`;
}

boot();
