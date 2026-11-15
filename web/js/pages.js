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

export const confText = s => (s.conf ? `Confidence ${s.conf.score}% · ${s.conf.band}` : 'Confidence not scored');

// full: print each status's meaning next to its word instead of leaving it in the tooltip
export const legendHtml = (D, full) => Object.entries(D.status).map(([k, l]) => {
  const help = (D.statusHelp || {})[k] || '';
  return full && help ? `<span class="lg"><i class="sw st-${k}">${esc(l[0])}</i><b>${esc(l)}</b><span class="lgd">${esc(help)}</span></span>`
    : `<span class="lg" title="${esc(help)}"><i class="sw st-${k}">${esc(l[0])}</i>${esc(l)}</span>`;
}).join('');

export function matrixHtml(D, s, cls = '') {
  return `<ul class="matrix ${cls}">${D.dims.map(([k, name]) => {
    const [c, note] = s.d[k], v = (s.cmp || {})[k];
    return `<li class="st-${c}"><b>${esc(name)}</b><i>${esc(D.status[c])}</i><small>${esc(note)}</small>${v ? `<small class="cmpv">${World(s.body)}: ${esc(v[0] || 'no data')} · Earth: ${esc(v[1] || 'no data')}</small>` : ''}</li>`;
  }).join('')}</ul>`;
}

// The same eight dimensions as rows. Uniform items read better as a table than as eight cards.
export function dimTableHtml(D, s) {
  return `<div class="xwrap dtw"><table class="dt"><tbody>${D.dims.map(([k, name]) => {
    const [c, note] = s.d[k], v = (s.cmp || {})[k], src = (s.dsrc || {})[k];
    // every row says where it comes from: a source, our own measurement, or our reading
    const mark = src && src.length ? srcLinks(D, src) : c === 'M' ? '<em class="own">measured by us</em>' : c === 'N' ? '' : '<em class="own">our reading</em>';
    return `<tr><th scope="row">${esc(name)}</th><td class="s"><span class="st-${c}"><i>${esc(D.status[c])}</i></span></td><td>${esc(note)}${mark}${v ? `<small>${World(s.body)}: ${esc(v[0] || 'no data')} · Earth: ${esc(v[1] || 'no data')}</small>` : ''}</td></tr>`;
  }).join('')}</tbody></table></div>`;
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
  const W = o.kind === 'mars' ? 'Mars' : 'Moon';
  return `<table><thead><tr><th>Measure</th><th>Earth</th><th>${W}</th><th>${W} ÷ Earth</th></tr></thead><tbody>${rows}</tbody></table>`;
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

// Confidence: the number, the five parts it is made of, and why each part scored as it did
function confHtml(D, s) {
  const c = s.conf, R = D.confidenceRubric || {}; if (!c) return '';
  const rows = c.parts.map(p => `<tr><th scope="row">${esc(p.label)}</th><td class="s n">${p.pts} / ${p.max}</td><td>${esc(p.why)}${srcLinks(D, p.src)}</td></tr>`).join('');
  return `<section id="conf">
      <h2>Confidence</h2>
      <p class="cfnum"><b>${c.score}%</b> · ${esc(c.band)}</p>
      <p>${esc(R.what || '')}</p>
      <div class="xwrap dtw"><table class="dt"><tbody>${rows}<tr><th scope="row">Total</th><td class="s n">${c.score}%</td><td>${esc(c.note || '')}</td></tr></tbody></table></div>
      ${s.planRating ? `<p class="fineprint">The research plan rated this pair in words: "${esc(s.planRating)}". ${esc(R.planNote || '')}</p>` : ''}
      <p class="fineprint">${esc(R.own || '')}</p>
    </section>`;
}

export function renderPair(D, s, ctx) {
  const el = $('#view-pair'), i = D.sites.indexOf(s), N = D.sites.length, prev = D.sites[(i - 1 + N) % N], next = D.sites[(i + 1) % N];
  const pair = D.pairs.find(p => p.site === s.id);
  const hyp = s.label === 'hypothesis';
  const brk = (s.breaks || []).length
    ? `<ul class="claims">${s.breaks.map(c => claimLi(D, c)).join('')}</ul>`
    : `<p>No differences specific to this pair have been assessed by us yet. The limits below still apply.</p>`;
  el.innerHTML = `<div class="docin pair">
    <nav class="crumbs" aria-label="Pairs"><a href="#worlds" id="pback">← Back to the globes</a><span>Pair ${i + 1} of ${N}</span><span class="sp"></span><a href="#pair/${prev.id}">‹ ${esc(prev.short)}</a><a href="#pair/${next.id}">${esc(next.short)} ›</a></nav>
    <header class="phead">
      <div class="chips">${labelChip(D, s)}<span>${confText(s)}</span><span>${esc(s.kind)}</span></div>
      <h1>${esc(s.name)} <span class="ar">↔</span> ${esc(s.target)}</h1>
      <p class="lede">${esc(s.claim || '')}</p>
      <p class="${hyp ? 'hypo' : 'fineprint'}">${hyp ? '<b>This pairing is a hypothesis, not a finding.</b> ' : ''}${esc(s.labelNote || '')} ${esc(s.role || '')}</p>
      <div class="two">
        <div class="place cand"><span class="role">Earth analog</span><strong>${esc(s.name)}</strong><span class="mono muted">${esc(s.where)} · ${fmtLL(s.lat, s.lon)}${s.coordSrc ? srcLinks(D, s.coordSrc) : ''}</span>${s.coordNote ? `<span class="mono muted">${esc(s.coordNote)}</span>` : ''}</div>
        <div class="place anchor"><span class="role">Stands in for · ${World(s.body)}</span><strong>${esc(s.target)}</strong><span class="mono muted">${s.tlat != null ? fmtLL(s.tlat, s.tlon) + srcLinks(D, s.tcoordSrc) : 'A process, with no single place'}</span>${s.tcoordNote ? `<span class="mono muted">${esc(s.tcoordNote)}</span>` : ''}</div>
      </div>
    </header>
    ${confHtml(D, s)}
    <section>
      <h2>Alike in these ways</h2>
      ${figuresHtml(D, s)}
      <ul class="claims">${(s.matches || []).map(c => claimLi(D, c)).join('')}</ul>
    </section>
    <section id="pterr">
      <h2>Measured terrain</h2>
      <p>${pair ? 'Loading the two terrain windows…' : esc(s.d.terrain[1]) + '. Terrain is the only dimension we measure, and only where open elevation data can resolve the site on both worlds.'}</p>
    </section>
    <section id="ptemp">
      <h2>Measured temperature</h2>
      <p>Loading the temperature record…</p>
    </section>
    <section>
      <h2>How it could help exploration</h2>
      <p>${esc(s.helps)}${srcLinks(D, s.helpsSrc)}</p>
      <p><span class="muted">Prior analog work: </span>${esc(s.prior || 'Not assessed.')}${srcLinks(D, s.priorSrc)}</p>
    </section>
    <section>
      <h2>Dimension by dimension</h2>
      ${dimTableHtml(D, s)}
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
  fillPairTemp(D, s, ctx);
}

// Terrain similarity: one percentage, always with the three parts it is the average of
// Radial form: a separate figure for shape, because the similarity above cannot tell a crater from a dune field
const formWord = v => (v >= 0.5 ? 'a centred bowl or peak' : v >= 0.25 ? 'partly centred' : 'no centred shape');
export function formHtml(pair) {
  const f = pair && pair.form; if (!f) return '';
  const w = pair.body === 'mars' ? 'Mars' : 'Moon', gap = Math.abs(f.earth - f.other);
  return `<div class="xwrap dtw"><table class="dt"><tbody>
      <tr><th scope="row">Radial form, Earth</th><td class="s n">${f.earth.toFixed(2)}</td><td>${formWord(f.earth)}</td></tr>
      <tr><th scope="row">Radial form, ${w}</th><td class="s n">${f.other.toFixed(2)}</td><td>${formWord(f.other)}</td></tr></tbody></table></div>
    <p class="fineprint">Radial form is the share of a window's height variation explained by distance from its centre: 1 for a perfect bowl, about 0 for dunes or a flat pan. ${gap <= 0.15 ? 'The two windows are alike in form.' : 'The two windows differ in form.'} It is shown beside the similarity and is not part of it. <a href="#method">How it is worked out</a></p>`;
}
export function simHtml(pair) {
  const m = pair && pair.sim; if (!m) return '';
  return `<p class="cfnum"><b>${m.score}%</b> terrain similarity</p>
    <div class="xwrap dtw"><table class="dt"><tbody>${m.parts.map(q => `<tr><th scope="row">${esc(q.label)}</th><td class="s n">${q.pct}%</td><td>${esc(q.why)}</td></tr>`).join('')}
      <tr><th scope="row">Average</th><td class="s n">${m.score}%</td><td>The plain average of the three parts. Terrain only: it says nothing about rock, temperature or ice.</td></tr></tbody></table></div>${formHtml(pair)}`;
}

// Measured temperature: MODIS at the Earth site, set against the published figure for the counterpart
const kc = k => `${k.toFixed(0)} K (${(k - 273.15).toFixed(0)} °C)`;
async function fillPairTemp(D, s, ctx) {
  const [T, C] = await Promise.all([ctx.getTemp(), ctx.getClimate()]), slot = $('#ptemp'); if (!slot || !slot.isConnected) return;
  let t = T && T.sites && T.sites[s.id]; const c = C && C.sites && C.sites[s.id], o = s.tempOther;
  if (t && t.mean_night_k == null) t = null;
  const clim = c ? `<h2 class="sub">Climate at the site</h2>
    <div class="xwrap dtw"><table class="dt"><tbody>
      <tr><th scope="row">Air temperature</th><td class="s n">${c.t_mean_c.toFixed(1)} °C</td><td>Long-term mean; extremes ${c.t_min_c.toFixed(0)} to ${c.t_max_c.toFixed(0)} °C</td></tr>
      <tr><th scope="row">Wind at 10 m</th><td class="s n">${c.wind_mean_ms.toFixed(1)} m/s</td><td>Long-term mean; strongest ${c.wind_max_ms.toFixed(0)} m/s</td></tr>
      <tr><th scope="row">Rain and snow</th><td class="s n">${c.rain_mm_year} mm a year</td><td>Long-term mean</td></tr>
    </tbody></table></div>
    <p class="fineprint">${esc(C.dataset)}. ${esc(C.note)}</p>` : '';
  if (!t) { slot.innerHTML = `<h2>Measured temperature</h2><p>The satellite record returned no clear reading for this site's pixel in ${T ? T.year : 'the year read'}.</p>${clim}`; return; }
  const gap = o && o.k != null && t.min_night_k != null ? t.min_night_k - o.k : null;
  slot.innerHTML = `<h2>Measured temperature</h2>
    <p class="verdict">${gap == null ? '' : gap > 0 ? `Even the coldest night here was ${gap.toFixed(0)} K warmer than the figure for the counterpart.` : `The coldest night here was ${(-gap).toFixed(0)} K colder than the figure for the counterpart.`}</p>
    <div class="xwrap dtw"><table class="dt"><tbody>
      <tr><th scope="row">${esc(s.short)}, by day</th><td class="s n">${kc(t.mean_day_k)}</td><td>Average over ${T.year}; warmest 8-day average ${kc(t.max_day_k)}<em class="own">measured by us</em></td></tr>
      <tr><th scope="row">${esc(s.short)}, by night</th><td class="s n">${kc(t.mean_night_k)}</td><td>Average over ${T.year}; coldest 8-day average ${kc(t.min_night_k)}<em class="own">measured by us</em></td></tr>
      ${o ? `<tr><th scope="row">${esc(s.target)}</th><td class="s n">${esc(o.v)}</td><td>${esc(o.note)}${srcLinks(D, o.src)}</td></tr>` : ''}
    </tbody></table></div>
    <p class="fineprint">${esc(T.dataset)}. ${esc(T.note)} Values used: ${t.n_day} by day and ${t.n_night} by night, of ${t.composites} composites. The two sides are not the same kind of number: one is a year of satellite readings at one pixel, the other a published figure.</p>${clim}`;
}

// The measured block: real numbers for both windows, or a plain statement that there are none
async function fillPairTerrain(D, s, pair, ctx) {
  const [e, o] = await Promise.all([ctx.getField(pair.earth, 'earth'), ctx.getField(pair.other, pair.body || 'moon')]);
  const slot = $('#pterr'); if (!slot || !slot.isConnected || !$('#view-pair .pair')) return;
  if (e.missing || o.missing || !e.meta.metrics || !o.meta.metrics) { slot.innerHTML = '<h2>Measured terrain</h2><p>Waiting for terrain exports of both windows. No number is shown until then.</p>'; return; }
  const me = e.meta.metrics, mo = o.meta.metrics, other = pair.otherTitle.split(',')[0];
  const r = k => (mo[k] / me[k]).toFixed(1), pc = v => (v * 100).toFixed(0) + '%';
  slot.innerHTML = `<h2>Measured terrain</h2>
    ${simHtml(pair)}
    <p class="verdict">${esc(s.terrainVerdict || '')}</p>
    <p>On one ${e.meta.analysis_cell_m} m grid, ${esc(other)} has ${Math.round(mo.relief_p5_p95_m).toLocaleString()} m of relief against ${Math.round(me.relief_p5_p95_m).toLocaleString()} m at ${esc(s.short)} (×${r('relief_p5_p95_m')}), and a median slope of ${mo.median_slope_deg.toFixed(1)}° against ${me.median_slope_deg.toFixed(1)}° (×${r('median_slope_deg')}). ${pc(mo.gentle_share)} of its ground is gentler than ${me.gentle_slope_deg}°, against ${pc(me.gentle_share)} on Earth.</p>
    <div class="mtwrap">${measTableHtml(e, o)}</div>
    <p class="fineprint">Both windows are ${e.windowKm} km squares. ${esc((e.meta.source || {}).dataset || '')} and ${esc((o.meta.source || {}).dataset || '')}. The last column is a plain ratio, not a verdict, and the measures are not combined into one score.</p>
    ${s.terrainReading ? `<p class="fineprint">${esc(s.terrainReading)}</p>` : ''}
    <button class="btn" id="pgoside">See both terrains side by side</button>`;
  $('#pgoside').addEventListener('click', () => ctx.openSbs(pair.id));
}

/* ---------- all pairs ---------- */
// Pick what a mission needs to test: which sites to use for it, and which not to. Built only from the matrix and its notes.
function needHtml(D, F, pill) {
  if (!D.needs) return '';
  const k = F.need || D.needs[0][0], dim = D.dims.find(d => d[0] === k);
  const item = s => `<li><a href="#pair/${s.id}"><b>${esc(s.short)}</b></a> <span class="muted">for ${esc(s.target)}</span>${s.d[k][0] === 'B' ? '' : ` <span class="st-${s.d[k][0]}">${esc(D.status[s.d[k][0]])}</span>`} <span class="plab">${labelChip(D, s)}</span><br>${esc(s.d[k][1])}${srcLinks(D, (s.dsrc || {})[k])}</li>`;
  const use = D.sites.filter(s => 'MCP'.includes(s.d[k][0])).sort((a, b) => 'MCP'.indexOf(a.d[k][0]) - 'MCP'.indexOf(b.d[k][0]));
  const hyp = D.sites.filter(s => s.d[k][0] === 'H'), no = D.sites.filter(s => s.d[k][0] === 'B'), na = D.sites.filter(s => s.d[k][0] === 'N');
  return `<section class="need">
    <h2>What do you need to test?</h2>
    <div class="pills" role="group" aria-label="Mission need">${D.needs.map(([id, label]) => pill('need', id, label)).join('')}</div>
    <p class="fineprint">${esc(dim[1])}. The lists come straight from the table below: each line is that pair's note for this dimension, with its sources. Measured means we measured it, not that it matched: read the note.</p>
    <div class="needcols">
      <div><h3>Sites with evidence on this (${use.length})</h3>${use.length ? `<ul>${use.map(item).join('')}</ul>` : '<p class="muted">No site in the atlas is measured or cited for this.</p>'}
        ${hyp.length ? `<h3>Proposed by us, not tested (${hyp.length})</h3><ul>${hyp.map(item).join('')}</ul>` : ''}</div>
      <div class="no"><h3>Sites that do not match on this (${no.length})</h3>${no.length ? `<ul>${no.map(item).join('')}</ul>` : '<p class="muted">No pair is marked as not matching here.</p>'}
        ${na.length ? `<p class="fineprint">Not assessed for this: ${na.map(s => esc(s.short)).join(', ')}.</p>` : ''}</div>
    </div></section>`;
}

export function renderExplore(D, F, rerender, ctx) {
  const el = $('#view-explore');
  if (!F.need && D.needs) F.need = D.needs[0][0];   // the first need is the one shown, so its button is the pressed one
  const sites = D.sites.filter(s => (F.world === 'all' || s.body === F.world) && (F.label === 'all' || s.label === F.label));
  // Confidence order: the stored scores, highest first or lowest first; with no order chosen the list stays as written
  const cs = x => (x.conf ? x.conf.score : -1);
  if (F.sort) sites.sort((a, b) => (F.sort === 'desc' ? cs(b) - cs(a) : cs(a) - cs(b)));
  const sortSay = F.sort === 'desc' ? 'highest first' : F.sort === 'asc' ? 'lowest first' : 'not sorted';
  const pill = (group, k, l) => `<button class="pill" data-g="${group}" data-k="${k}" aria-pressed="${F[group] === k}">${esc(l)}</button>`;
  const head = D.dims.map(([k, name, short]) => `<th scope="col" class="c-${k}" title="${esc(name)}">${esc((short || name).replace(/^Temp\b/, 'Temperature'))}</th>`).join('');
  const rows = sites.map(s => `<tr data-id="${s.id}">
      <th scope="row"><a href="#pair/${s.id}"><b>${esc(s.short)}</b><span><i class="dot ${s.body}"></i>${esc(s.target)}</span></a></th>
      <td class="lb">${labelChip(D, s)}</td>
      <td class="n">${s.conf ? s.conf.score + '%' : '—'}</td>
      ${D.dims.map(([k, name]) => { const [c, note] = s.d[k]; return `<td class="cell" title="${esc(name + '. ' + D.status[c] + ': ' + note)}"><span class="st-${c}"><i>${esc(D.status[c][0])}</i></span></td>`; }).join('')}</tr>`).join('');
  const n = b => D.sites.filter(s => s.body === b).length;
  el.innerHTML = `<div class="docin">
    <header class="phead">
      <h1>All pairs, dimension by dimension</h1>
      <p class="lede">${D.sites.length} Earth sites, each set against a place or process on the Moon or Mars. One row says where a pair holds and where it breaks.</p>
    </header>
    ${needHtml(D, F, pill)}
    <h2>Every pair, every dimension</h2>
    <div class="xbar">
      <div class="pills" role="group" aria-label="World">${pill('world', 'all', 'All')}${pill('world', 'moon', `Moon (${n('moon')})`)}${pill('world', 'mars', `Mars (${n('mars')})`)}</div>
      <div class="pills" role="group" aria-label="Label">${pill('label', 'all', 'Any label')}${Object.entries(D.labels).map(([k, v]) => pill('label', k, v[0])).join('')}</div>
    </div>
    <div class="mhead lgfull">${legendHtml(D, true)}</div>
    <div class="xwrap"><table class="xt"><thead><tr><th scope="col">Earth site and what it stands in for</th><th scope="col">Label</th><th scope="col" aria-sort="${F.sort === 'desc' ? 'descending' : F.sort === 'asc' ? 'ascending' : 'none'}"><button class="sortbtn" id="xsort" aria-pressed="${!!F.sort}" title="Out of 100. How well the page's statements are supported by sources we opened. Click to order the rows: highest first, lowest first, then back to the written order. Now: ${sortSay}">Confidence <span aria-hidden="true">${F.sort === 'desc' ? '↓' : F.sort === 'asc' ? '↑' : '↕'}</span></button></th>${head}</tr></thead>
      <tbody>${rows || `<tr><td colspan="${D.dims.length + 3}">No pair matches these filters.</td></tr>`}</tbody></table></div>
    <p class="fineprint">Hover over a cell to read its note. Click a row to open the pair. Terrain is the only dimension measured on both worlds; everything else is cited evidence or marked as not assessed.</p>
    <section id="xclim"></section>
    <section class="breaks">
      <h2>${esc(D.negative.head)}</h2>
      <p>${esc(D.negative.text)}${srcLinks(D, D.negative.src)}</p>
      <div class="limits"><b class="h">${esc(D.limitsHead)}</b>
        <dl>${D.limits.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>
        <p class="fineprint">${esc(D.limitsNote || '')}${srcLinks(D, D.limitsSrc)}</p></div>
    </section>
  </div>`;
  $$('.xbar .pill, .need .pill', el).forEach(b => b.addEventListener('click', () => { F[b.dataset.g] = b.dataset.k; rerender(); }));
  $('#xsort', el).addEventListener('click', () => { F.sort = !F.sort ? 'desc' : F.sort === 'desc' ? 'asc' : null; rerender(); });
  if (ctx) fillClimateTable(D, sites, ctx);
  $$('.xt tbody tr[data-id]', el).forEach(tr => tr.addEventListener('click', ev => { if (!ev.target.closest('a')) location.hash = '#pair/' + tr.dataset.id; }));
}

// Every site's measured surface temperature and climate in one table, so sites can be compared on more than terrain
async function fillClimateTable(D, sites, ctx) {
  const [T, C] = await Promise.all([ctx.getTemp(), ctx.getClimate()]), slot = $('#xclim'); if (!slot || !slot.isConnected || (!T && !C)) return;
  const k = v => (v == null ? '—' : (v - 273.15).toFixed(0) + ' °C');
  const rows = sites.map(s => { const t = (T && T.sites[s.id]) || {}, c = (C && C.sites[s.id]) || null;
    return `<tr><td><a href="#pair/${s.id}">${esc(s.short)}</a></td><td class="n">${k(t.min_night_k)}</td><td class="n">${k(t.max_day_k)}</td><td class="n">${c ? c.t_mean_c.toFixed(1) + ' °C' : '—'}</td><td class="n">${c ? c.wind_mean_ms.toFixed(1) + ' m/s' : '—'}</td><td class="n">${c ? c.rain_mm_year + ' mm' : '—'}</td></tr>`; }).join('');
  slot.innerHTML = `<h2>Temperature, wind and rain at every site</h2>
    <p>Two more NASA datasets, read at each Earth site. They put numbers on what terrain cannot show: how cold, how windy, how dry.</p>
    <div class="xwrap"><table class="st2"><thead><tr><th>Site</th><th>Coldest night</th><th>Warmest day</th><th>Mean air temperature</th><th>Mean wind</th><th>Rain and snow a year</th></tr></thead><tbody>${rows}</tbody></table></div>
    <p class="fineprint">Coldest night and warmest day: ${T ? esc(T.dataset) + ', ' + T.year + ', 8-day averages at one 1 km pixel' : 'not read'}. Air temperature, wind and rain: ${C ? esc(C.dataset) : 'not read'}; a grid-cell value, not a reading at the site. A dash means no clear reading.</p>`;
}

/* ---------- method and sources ---------- */
export function renderMethod(D, ctx) {
  const M = D.method, el = $('#view-method');
  const ps = a => (a || []).map(p => `<p>${esc(p)}</p>`).join('');
  const sec = x => `<section${x.id ? ` id="${esc(x.id)}"` : ''}><h2>${esc(x.h)}</h2>${ps(x.p)}${x.ul ? `<ul>${x.ul.map(li => `<li>${esc(li)}</li>`).join('')}</ul>` : ''}${ps(x.p2)}${x.id === 'controls' ? '<div id="ctlslot"></div>' : ''}</section>`;
  const K = D.sourceKinds || {};
  const src = Object.entries(D.sources).map(([id, x]) => `<tr><td class="n">${esc(id)}</td><td>${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a>` : esc(x.title)}</td><td>${esc(K[x.kind] || '')}</td><td>${esc(x.read)}</td></tr>`).join('');
  const R = D.confidenceRubric, P = D.provenance;
  const rubric = R ? `<section id="confidence"><h2>${esc(R.h)}</h2>${ps(R.p)}
      <div class="xwrap"><table class="st2"><thead><tr><th>Part</th><th>Points</th><th>How it is decided</th></tr></thead><tbody>${R.parts.map(q => `<tr><td>${esc(q.label)}</td><td class="n">0 to ${q.max}</td><td>${q.levels.map(([pts, t]) => `<b>${pts}</b> ${esc(t)}`).join('<br>')}</td></tr>`).join('')}</tbody></table></div>
      ${ps(R.p2)}
      <div class="xwrap"><table class="st2"><thead><tr><th>Pair</th>${R.parts.map(q => `<th>${esc(q.short)}</th>`).join('')}<th>Score</th></tr></thead><tbody>${D.sites.filter(x => x.conf).map(x => `<tr><td><a href="#pair/${x.id}">${esc(x.short)}</a></td>${x.conf.parts.map(q => `<td class="n">${q.pts}</td>`).join('')}<td class="n"><b>${x.conf.score}</b></td></tr>`).join('')}</tbody></table></div></section>` : '';
  const prov = P ? `<section id="provenance"><h2>${esc(P.h)}</h2>${ps(P.p)}
      <div class="xwrap"><table class="st2"><thead><tr><th>What is on the site</th><th>Where it comes from</th><th>On the challenge Resources list?</th></tr></thead><tbody>${P.rows.map(([a, b, c, url]) => `<tr><td>${esc(a)}</td><td>${url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(b)}</a>` : esc(b)}</td><td>${esc(c)}</td></tr>`).join('')}</tbody></table></div>${ps(P.p2)}</section>` : '';
  el.innerHTML = `<div class="docin method">
    <header class="phead"><h1>Method and sources</h1><p class="lede">How each claim on this site can be traced, and what the numbers do and do not say.</p></header>
    ${M.sections.map(sec).join('')}
    ${D.terrainSim ? sec({ id: 'similarity', ...D.terrainSim }) : ''}
    ${D.terrainForm ? sec({ id: 'form', ...D.terrainForm }) : ''}
    ${rubric}
    ${prov}
    <section><h2>Data</h2><ul>${M.datasets.map(([n, use, url]) => `<li><a href="${esc(url)}" target="_blank" rel="noopener">${esc(n)}</a>. ${esc(use)}</li>`).join('')}</ul></section>
    <section><h2>Credits</h2>${ps(M.credits)}</section>
    <section><h2>Sources</h2>
      <p>Every source behind the claims on this site, with how much of it was read. Ids match the small links beside each claim.</p>
      <div class="xwrap"><table class="st2"><thead><tr><th>Id</th><th>Source</th><th>Kind</th><th>How much was read</th></tr></thead><tbody>${src}</tbody></table></div>
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
  const rows = W.map((w, i) => { const f = F[i], m = !f.missing && f.meta.metrics;
    return `<tr><td>${esc(w.label)}<small>${esc(w.kind)}</small></td>${cols.map(([k, , , fmt]) => `<td class="n">${m && Number.isFinite(m[k]) ? fmt(m[k]) : '—'}</td>`).join('')}<td class="n">${w.sim != null ? w.sim + '%' : 'reference'}</td><td class="n">${w.form != null ? w.form.toFixed(2) : '—'}</td></tr>`; }).join('');
  slot.innerHTML = `<div class="xwrap"><table class="st2"><thead><tr><th>Window (40 km, 80 m grid)</th>${cols.map(([, n]) => `<th>${n}</th>`).join('')}<th>Similarity to de Gerlache</th><th>Radial form</th></tr></thead><tbody>${rows}</tbody></table></div>
    <p class="fineprint">Relief and roughness in metres, slopes in degrees. Radial form runs from 0 (no centred shape) to 1 (a perfect bowl): it separates the dune field and the lake bed from the craters, which the similarity alone does not. A dash means that window has no export yet.</p>`;
}
