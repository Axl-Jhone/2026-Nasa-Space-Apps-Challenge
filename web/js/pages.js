// ATLAS: the argument pages. Pair page, All pairs table, Method and sources.
// Written with an AI assistant (Claude), directed by the team. See the Method and sources tab.
// All text comes from data/sites.json. Measures come from data/terrain/*.json and are never recomputed here.
import { $, $$, esc, fmtLL } from './util.js';

const world = b => (b === 'moon' ? 'the Moon' : 'Mars');
const World = b => (b === 'moon' ? 'Moon' : 'Mars');

/* ---------- shared pieces ---------- */
export function labelChip(D, s) {
  const L = (D.labels || {})[s.label] || [s.label || 'Unlabelled', ''];
  return `<span class="lab lab-${esc(s.label)}" title="${esc(L[1])}">${esc(L[0])}</span>` + (s.origin === 'team' ? '<span class="lab lab-team" title="Added by the team after the source check">Team addition</span>' : '');
}

// Source chips: each id links to the source and says in its tooltip how much of it was read
export function srcLinks(D, ids) {
  return (ids || []).map(id => {
    const s = D.sources[id]; if (!s) return `<span class="src">${esc(id)}</span>`;
    const tip = esc(`${s.title}. ${s.read}`);
    return s.url ? `<a class="src" href="${esc(s.url)}" target="_blank" rel="noopener" title="${tip}">${esc(id)}</a>` : `<span class="src" title="${tip}">${esc(id)}</span>`;
  }).join('');
}
// A claim with no source is marked, so it is never mistaken for a cited one
const claimLi = (D, c) => `<li><span>${esc(c.t)}</span>${c.src && c.src.length ? srcLinks(D, c.src) : `<em class="own">${c.measured ? 'measured' : 'our reading'}</em>`}</li>`;

export const legendHtml = D => Object.entries(D.status).map(([k, l]) => `<span class="lg" title="${esc((D.statusHelp || {})[k] || '')}"><i class="sw st-${k}"></i>${esc(l)}</span>`).join('');

export function matrixHtml(D, s, cls = '') {
  return `<ul class="matrix ${cls}">${D.dims.map(([k, name]) => {
    const [c, note] = s.d[k], v = (s.cmp || {})[k];
    return `<li class="st-${c}"><b>${esc(name)}</b><i>${esc(D.status[c])}</i><small>${esc(note)}</small>${v ? `<small class="cmpv">${World(s.body)}: ${esc(v[0] || 'no data')} · Earth: ${esc(v[1] || 'no data')}</small>` : ''}</li>`;
  }).join('')}</ul>`;
}

/* ---------- terrain measures (numbers from the exports) ---------- */
export const METRICS = [
  ['relief_p5_p95_m', 'Relief', '5th to 95th percentile height, metres', v => Math.round(v).toLocaleString()],
  ['median_slope_deg', 'Median slope', 'degrees, on the shared grid', v => v.toFixed(1)],
  ['p95_slope_deg', 'Steep-end slope', '95th percentile slope, degrees', v => v.toFixed(1)],
  ['roughness_m', 'Roughness', 'height scatter left after removing the local trend, metres', v => v.toFixed(1)],
  ['gentle_share', 'Gentle ground', null, v => (v * 100).toFixed(0) + '%'],
  ['masked_share', 'Masked area', 'lake or no data, left out of the measures', v => (v * 100).toFixed(1) + '%']
];
export function measTableHtml(e, o) {
  const me = (e.meta && e.meta.metrics) || null, mo = (o.meta && o.meta.metrics) || null;
  const gs = (me && me.gentle_slope_deg) || (mo && mo.gentle_slope_deg);
  const rows = METRICS.map(([k, name, def, fmt]) => {
    const a = me && me[k], b = mo && mo[k], ok = Number.isFinite(a) && Number.isFinite(b);
    const ratio = ok && k !== 'masked_share' && a !== 0 ? '×' + (b / a).toFixed(1) : '—';
    const d = def || `share of ground flatter than ${gs != null ? gs + '°' : 'the slope limit'}${(me && me.gentle_slope_source) ? ' (' + esc(me.gentle_slope_source) + ')' : ''}`;
    return `<tr><td>${name}<small>${d}</small></td><td class="n">${Number.isFinite(a) ? fmt(a) : '—'}</td><td class="n">${Number.isFinite(b) ? fmt(b) : '—'}</td><td class="n">${ratio}</td></tr>`;
  }).join('');
  return `<table><thead><tr><th>Measure</th><th>Earth</th><th>Moon</th><th>Moon ÷ Earth</th></tr></thead><tbody>${rows}</tbody></table>`;
}

/* ---------- pair page ---------- */
function figuresHtml(D, s) {
  if (!(s.figures || []).length) return '';
  const cell = (v, note, src) => `<td><b>${esc(v)}</b><small>${esc(note || '')}</small>${srcLinks(D, src)}</td>`;
  return `<table class="figs"><thead><tr><th></th><th class="e"><i class="dot earth"></i>${esc(s.short)}</th><th class="o"><i class="dot ${s.body}"></i>${esc(s.target)}</th></tr></thead><tbody>
    ${s.figures.map(f => `<tr><td class="q">${esc(f.q)}</td>${cell(f.earth, f.earthNote, f.earthSrc)}${cell(f.other, f.otherNote, f.otherSrc)}</tr>`).join('')}</tbody></table>
    <p class="fineprint">Figures as published. They are cited, not measured by us, and are not combined into a score.</p>`;
}

function pairSources(D, s) {
  const ids = [];
  const add = a => (a || []).forEach(id => { if (!ids.includes(id)) ids.push(id); });
  (s.figures || []).forEach(f => { add(f.earthSrc); add(f.otherSrc); });
  (s.matches || []).forEach(c => add(c.src)); add(s.helpsSrc); (s.breaks || []).forEach(c => add(c.src)); add(s.priorSrc); add(s.coordSrc);
  if (!ids.length) return '<p class="fineprint">No sources are attached to this pair yet.</p>';
  return `<ol class="srclist">${ids.map(id => { const x = D.sources[id] || { title: id, read: 'not in the source list' };
    return `<li><b>${esc(id)}</b><span>${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a>` : esc(x.title)}<small>How much was read: ${esc(x.read)}</small></span></li>`; }).join('')}</ol>`;
}

export function renderPair(D, s, ctx) {
  const el = $('#view-pair'), i = D.sites.indexOf(s), N = D.sites.length, prev = D.sites[(i - 1 + N) % N], next = D.sites[(i + 1) % N];
  const pair = D.pairs.find(p => p.site === s.id);
  const hyp = s.label === 'hypothesis';
  const brk = (s.breaks || []).length
    ? `<ul class="claims">${s.breaks.map(c => claimLi(D, c)).join('')}</ul>`
    : `<p>No differences specific to this pair have been assessed by us yet. The limits below still apply.</p>`;
  el.innerHTML = `<div class="docin pair">
    <nav class="crumbs" aria-label="Pairs"><a href="#explore">← All pairs</a><span>Pair ${i + 1} of ${N}</span><span class="sp"></span><a href="#pair/${prev.id}">‹ ${esc(prev.short)}</a><a href="#pair/${next.id}">${esc(next.short)} ›</a></nav>
    <header class="phead">
      <div class="chips">${labelChip(D, s)}<span>Confidence: ${esc(s.confidence || 'not rated')}</span><span>${esc(s.kind)}</span></div>
      <h1>${esc(s.name)} <span class="ar">↔</span> ${esc(s.target)}</h1>
      <p class="lede">${esc(s.claim || '')}</p>
      <p class="${hyp ? 'hypo' : 'fineprint'}">${hyp ? '<b>This pairing is a hypothesis, not a finding.</b> ' : ''}${esc(s.labelNote || '')} ${esc(s.role || '')}</p>
      <div class="two">
        <div class="place cand"><span class="role">Earth analog</span><strong>${esc(s.name)}</strong><span class="mono muted">${esc(s.where)} · ${fmtLL(s.lat, s.lon)}${s.coordSrc ? srcLinks(D, s.coordSrc) : ''}</span>${s.coordNote ? `<span class="mono muted">${esc(s.coordNote)}</span>` : ''}</div>
        <div class="place anchor"><span class="role">Stands in for · ${World(s.body)}</span><strong>${esc(s.target)}</strong><span class="mono muted">${s.tlat != null ? fmtLL(s.tlat, s.tlon) + srcLinks(D, s.tcoordSrc) : 'A process, with no single place'}</span>${s.tcoordNote ? `<span class="mono muted">${esc(s.tcoordNote)}</span>` : ''}</div>
      </div>
    </header>
    <section>
      <h2>Alike in these ways</h2>
      ${figuresHtml(D, s)}
      <ul class="claims">${(s.matches || []).map(c => claimLi(D, c)).join('')}</ul>
    </section>
    <section id="pterr">
      <h2>Measured terrain</h2>
      <p>${pair ? 'Loading the two terrain windows…' : esc(s.d.terrain[1]) + '. Terrain is the only dimension we measure, and only where open elevation data can resolve the site on both worlds.'}</p>
    </section>
    <section>
      <h2>How it could help exploration</h2>
      <p>${esc(s.helps)}${srcLinks(D, s.helpsSrc)}</p>
      <p><span class="muted">Prior analog work: </span>${esc(s.prior || 'Not assessed.')}${srcLinks(D, s.priorSrc)}</p>
    </section>
    <section>
      <h2>Dimension by dimension</h2>
      <div class="mhead">${legendHtml(D)}</div>
      ${matrixHtml(D, s)}
    </section>
    <section class="breaks" id="breaks">
      <h2>Where it breaks</h2>
      ${brk}
      <div class="limits"><b class="h">${esc(D.limitsHead)}</b>
        <dl>${D.limits.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>
        <p class="fineprint">${esc(D.limitsNote || '')}${srcLinks(D, D.limitsSrc)}</p></div>
    </section>
    <section>
      <h2>Sources for this pair</h2>
      ${pairSources(D, s)}
    </section>
  </div>`;
  el.scrollTop = 0;
  if (pair) fillPairTerrain(D, s, pair, ctx);
}

// The measured block: real numbers for both windows, or a plain statement that there are none
async function fillPairTerrain(D, s, pair, ctx) {
  const [e, o] = await Promise.all([ctx.getField(pair.earth, 'earth'), ctx.getField(pair.other, 'moon')]);
  const slot = $('#pterr'); if (!slot || !slot.isConnected || !$('#view-pair .pair')) return;
  if (e.sample || o.sample || !e.meta.metrics || !o.meta.metrics) { slot.innerHTML = '<h2>Measured terrain</h2><p>Waiting for real terrain exports of both windows. No number is shown until then.</p>'; return; }
  const me = e.meta.metrics, mo = o.meta.metrics, other = pair.otherTitle.split(',')[0];
  const r = k => (mo[k] / me[k]).toFixed(1), pc = v => (v * 100).toFixed(0) + '%';
  slot.innerHTML = `<h2>Measured terrain</h2>
    <p class="verdict">${esc(s.terrainVerdict || '')}</p>
    <p>On one ${e.meta.analysis_cell_m} m grid, ${esc(other)} has ${Math.round(mo.relief_p5_p95_m).toLocaleString()} m of relief against ${Math.round(me.relief_p5_p95_m).toLocaleString()} m at ${esc(s.short)} (×${r('relief_p5_p95_m')}), and a median slope of ${mo.median_slope_deg.toFixed(1)}° against ${me.median_slope_deg.toFixed(1)}° (×${r('median_slope_deg')}). ${pc(mo.gentle_share)} of its ground is gentler than ${me.gentle_slope_deg}°, against ${pc(me.gentle_share)} on Earth.</p>
    <div class="mtwrap">${measTableHtml(e, o)}</div>
    <p class="fineprint">Both windows are ${e.windowKm} km squares. ${esc((e.meta.source || {}).dataset || '')} and ${esc((o.meta.source || {}).dataset || '')}. The last column is a plain ratio, not a verdict, and the measures are not combined into one score.</p>
    ${s.terrainReading ? `<p class="fineprint">${esc(s.terrainReading)}</p>` : ''}
    <button class="btn" id="pgoside">See both terrains side by side</button>`;
  $('#pgoside').addEventListener('click', () => ctx.openSbs(pair.id));
}

/* ---------- all pairs ---------- */
export function renderExplore(D, F, rerender) {
  const el = $('#view-explore');
  const sites = D.sites.filter(s => (F.world === 'all' || s.body === F.world) && (F.label === 'all' || s.label === F.label));
  const pill = (group, k, l) => `<button class="pill" data-g="${group}" data-k="${k}" aria-pressed="${F[group] === k}">${esc(l)}</button>`;
  const head = D.dims.map(([k, name, short]) => `<th scope="col" title="${esc(name)}">${esc(short || name)}</th>`).join('');
  const rows = sites.map(s => `<tr data-id="${s.id}">
      <th scope="row"><a href="#pair/${s.id}"><b>${esc(s.short)}</b><span><i class="dot ${s.body}"></i>${esc(s.target)}</span></a></th>
      <td class="lb">${labelChip(D, s)}</td>
      ${D.dims.map(([k, name]) => { const [c, note] = s.d[k]; return `<td class="cell" title="${esc(name + '. ' + D.status[c] + ': ' + note)}"><span class="st-${c}"><i>${c}</i></span></td>`; }).join('')}</tr>`).join('');
  const n = b => D.sites.filter(s => s.body === b).length;
  el.innerHTML = `<div class="docin">
    <header class="phead">
      <h1>All pairs, dimension by dimension</h1>
      <p class="lede">${D.sites.length} Earth sites, each set against a place or process on the Moon or Mars. One row says where a pair holds and where it breaks.</p>
    </header>
    <div class="xbar">
      <div class="pills" role="group" aria-label="World">${pill('world', 'all', 'All')}${pill('world', 'moon', `Moon (${n('moon')})`)}${pill('world', 'mars', `Mars (${n('mars')})`)}</div>
      <div class="pills" role="group" aria-label="Label">${pill('label', 'all', 'Any label')}${Object.entries(D.labels).map(([k, v]) => pill('label', k, v[0])).join('')}</div>
    </div>
    <div class="mhead">${legendHtml(D)}</div>
    <div class="xwrap"><table class="xt"><thead><tr><th scope="col">Earth site and what it stands in for</th><th scope="col">Label</th>${head}</tr></thead>
      <tbody>${rows || `<tr><td colspan="${D.dims.length + 2}">No pair matches these filters.</td></tr>`}</tbody></table></div>
    <p class="fineprint">Hover over a cell to read its note. Click a row to open the pair. Terrain is the only dimension measured on both worlds; everything else is cited evidence or marked as not assessed.</p>
    <section class="breaks">
      <h2>${esc(D.negative.head)}</h2>
      <p>${esc(D.negative.text)}${srcLinks(D, D.negative.src)}</p>
      <div class="limits"><b class="h">${esc(D.limitsHead)}</b>
        <dl>${D.limits.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>
        <p class="fineprint">${esc(D.limitsNote || '')}${srcLinks(D, D.limitsSrc)}</p></div>
    </section>
    <p class="fineprint">Already well-known analogs, shown as hollow pins on the globe for context only: ${D.context.map(c => esc(c.name)).join(', ')}.</p>
  </div>`;
  $$('.xbar .pill', el).forEach(b => b.addEventListener('click', () => { F[b.dataset.g] = b.dataset.k; rerender(); }));
  $$('.xt tbody tr[data-id]', el).forEach(tr => tr.addEventListener('click', ev => { if (!ev.target.closest('a')) location.hash = '#pair/' + tr.dataset.id; }));
}

/* ---------- method and sources ---------- */
export function renderMethod(D, ctx) {
  const M = D.method, el = $('#view-method');
  const ps = a => (a || []).map(p => `<p>${esc(p)}</p>`).join('');
  const sec = x => `<section${x.id ? ` id="${esc(x.id)}"` : ''}><h2>${esc(x.h)}</h2>${ps(x.p)}${x.ul ? `<ul>${x.ul.map(li => `<li>${esc(li)}</li>`).join('')}</ul>` : ''}${ps(x.p2)}${x.id === 'controls' ? '<div id="ctlslot"></div>' : ''}</section>`;
  const src = Object.entries(D.sources).map(([id, x]) => `<tr><td class="n">${esc(id)}</td><td>${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a>` : esc(x.title)}</td><td>${esc(x.read)}</td></tr>`).join('');
  el.innerHTML = `<div class="docin method">
    <header class="phead"><h1>Method and sources</h1><p class="lede">How each claim on this site can be traced, and what the numbers do and do not say.</p></header>
    ${M.sections.map(sec).join('')}
    <section><h2>Data</h2><ul>${M.datasets.map(([n, use, url]) => `<li><a href="${esc(url)}" target="_blank" rel="noopener">${esc(n)}</a>. ${esc(use)}</li>`).join('')}</ul></section>
    <section><h2>Credits</h2>${ps(M.credits)}</section>
    <section><h2>Sources</h2>
      <p>Every source behind the claims on this site, with how much of it was read. Ids match the small links beside each claim.</p>
      <div class="xwrap"><table class="st2"><thead><tr><th>Id</th><th>Source</th><th>How much was read</th></tr></thead><tbody>${src}</tbody></table></div>
    </section>
  </div>`;
  fillControls(D, ctx);
}

// Control windows: the same measures on terrains we expect to differ. Numbers come from the exports only.
async function fillControls(D, ctx) {
  const slot = $('#ctlslot'), W = D.controlWindows || []; if (!slot || !W.length) return;
  const F = await Promise.all(W.map(w => ctx.getField(w.id, w.body === 'earth' ? 'earth' : 'moon')));
  if (!slot.isConnected) return;
  const cols = METRICS.filter(m => m[0] !== 'masked_share');
  const rows = W.map((w, i) => { const f = F[i], m = !f.sample && f.meta.metrics;
    return `<tr><td>${esc(w.label)}<small>${esc(w.kind)}</small></td>${cols.map(([k, , , fmt]) => `<td class="n">${m && Number.isFinite(m[k]) ? fmt(m[k]) : '—'}</td>`).join('')}</tr>`; }).join('');
  slot.innerHTML = `<div class="xwrap"><table class="st2"><thead><tr><th>Window (40 km, 80 m grid)</th>${cols.map(([, n]) => `<th>${n}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>
    <p class="fineprint">Relief and roughness in metres, slopes in degrees. A dash means that window has no export yet.</p>`;
}
