# Earth Analog Atlas

NASA Space Apps 2026, challenge "Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars". Deadline 15 November 2026, 11:59 pm PHT (submit by 9 pm).

The site argues: this place on Earth is like that place on the Moon or Mars in these measured ways, and unlike it in these. Terrain is measured on both worlds and gets a similarity percentage, always shown with its three parts. Earth temperature is measured from MODIS and set against published figures. Confidence is a separate percentage about evidence. No number is an overall score for a pair.

## What lives where

| Path | Owner | What |
| --- | --- | --- |
| `pipeline/earth_dem.ipynb` | Leander | Copernicus GLO-30 window from Planetary Computer, reprojected to UTM |
| `pipeline/moon_dem.ipynb` | Leander | LOLA `LDEM_80S_80M` window, every number read from the label |
| `pipeline/export_terrain.py` | Leander, Mico (metric definitions) | Shared 80 m grid, metrics, writes `web/data/terrain/<id>.json`. `--selftest` checks the maths |
| `pipeline/mars_dem.py` | Leander | MOLA MEGDR window for Mars (Jezero), read from the NASA Planetary Data System. Run with `ATLAS_ANALYSIS_CELL_M=500` |
| `pipeline/run_notebook.py` | Leander | Reruns a notebook's own cells for another site (Shackleton, the control windows) |
| `pipeline/score_confidence.py` | Mico, Prince | Counts each pair's confidence score from `sites.json` and writes it back. `--check` says if the stored scores are stale |
| `pipeline/score_terrain.py` | Mico | Terrain similarity (slopes, relief, roughness, plain average) and radial form (shape, shown separately, never part of the similarity) for each pair and control window |
| `pipeline/earth_temperature.py` | Leander | One year of MODIS land surface temperature at each Earth site, written to `web/data/temperature.json` |
| `pipeline/earth_climate.py` | Leander | NASA POWER air temperature, wind and rainfall at each Earth site, written to `web/data/climate.json` |
| `pipeline/prerender_maps.py` | Leander | Saved copies of the zoom-view map pictures (`web/data/maps/`), from the services listed in `web/data/maplayers.json`. Rerun after changing a site's coordinates |
| `pipeline/sitesjson.py` | | Reads and writes `sites.json` in its hand-editable layout |
| `data/raw/` | | Downloads. Only `.LBL` labels are committed |
| `data/processed/` | | Notebook outputs (GeoTIFF). Not committed, regenerate from the notebooks |
| `web/` | Axl | Static site, no build step. Formats are in `web/README.md` |
| `web/data/sites.json` | Prince | All page text: sites, labels, claims with source ids, matrix, planets, pairs, controls, method text, source list |
| `SUBMISSION.md` | Everyone | Drafts for the Space Apps form and the demo script |
| `web/js/zoom.js`, `web/vendor/leaflet/` | Axl | Zoom view: two maps at one scale, live pictures over the saved copies. Leaflet 1.9.4 is vendored, do not load it from a CDN |
| `web/js/quicktest.js` | Mico (formulas), Axl | Quick test of any Earth place against the Moon or Mars window. Tiles are fetched four at a time, cached, and cancelled when a newer test starts |
| `web/js/intro.js`, `web/js/atlas-art.js` | Axl | Star background and the opening figure. Decoration only. The figure's characters are written by `pipeline/atlas_art.py` from a public-domain photograph; do not hand-edit |
| `web/data/terrain/` | written by `export_terrain.py` | Do not hand-edit |

Edit only what the person you are working with owns. If the work needs a change elsewhere, say what and why, and let its owner make it.

## How to work with us

We are learning as we build. For every step:

1. Do one small step, not a whole module.
2. Before writing code, explain the plan, why this way, and what could go wrong. Wait for an OK.
3. After writing it, walk through what you wrote and say what we should check by hand.
4. Commit only when asked. Pull before you start and before you push.

Keep code comments short.

## Skills in this repo (`.claude/skills/`)

| Skill | Use it when | Who mostly |
| --- | --- | --- |
| `test-driven-development` | Writing any function with a checkable answer. Write the expected value from physics or a hand calculation first, watch the test fail, then write the code | Mico, Leander |
| `systematic-debugging` | Anything breaks. Find the root cause and explain it before changing code | Everyone |
| `verification-before-completion` | Before saying a step is done. Run the check and show its output | Everyone |
| `requesting-code-review` | Before pushing a finished piece | Everyone |
| `architecture-decision-records` | The team picks between real alternatives. The records in `docs/adr/` double as the AI-use log for the submission | Everyone |

The "How to work with us" rules come first. These skills add discipline on top; they do not replace the explanation.

## Honesty rules

- Never invent a source, citation, number or coordinate. If it is unknown, mark it `N` (not assessed) or ask.
- Nothing on the site is generated, simulated or seeded. The sample-terrain code is gone: a missing export shows a message, never a picture. The gentle-slope limit is 8°, cited to NASA's Human Landing System tilt threshold and labelled a coarse screen at 80 m.
- Confidence is a number out of 100 with its five parts shown. It is counted by `pipeline/score_confidence.py` from the sources recorded in `sites.json`; never type a score by hand. After changing a claim or a source, rerun the script.
- A claim in `sites.json` with no source id is shown on the page as "our reading". A pairing we propose ourselves is labelled `hypothesis` and is never shown as a finding.
- Every number on the page comes from a file. The browser never invents or recomputes a measurement.
- One exception, agreed 15 November: the quick test (`web/js/quicktest.js`) measures a place the visitor picks, in the browser, from open elevation tiles. Its formulas must stay identical to `export_terrain.py` and `score_terrain.py`. It compares a place only with the selected site's own measured anchor; where the anchor has no measured window the test is off and says so. The visitor may opt in to the world's default window, and the result must then name it as a stand-in; it is never used silently. Every number from it is labelled "Quick test" and never enters `sites.json`.
- The star background and the opening ASCII figure (`web/js/intro.js`) are decoration, not data. The Credits say so.
- Do not change a test's expected value to make it pass. Explain the failure instead.

## Word lists used in `web/data/sites.json`

- Matrix status codes: `M` measured, `C` cited, `P` partial match, `H` hypothesis (ours), `B` breaks here, `N` not assessed
- Pair labels: `established`, `hypothesis` (`benchmark` was retired on 15 November; those pairs are `established`)
- Dimensions: `geo`, `terrain`, `temp`, `ice`, `dust`, `bio`, `sub`, `ops`
- Bodies: `moon`, `mars`

## Commands

- Python: `python -m venv .venv`, then `pip install -r requirements.txt`. Notebooks run from `pipeline/`
- Metric self-test: `cd pipeline`, then `python export_terrain.py --selftest`
- Site: `cd web`, then `python -m http.server 8000`, open http://localhost:8000 (double-clicking `index.html` does not work)

## Gotchas

- `.gitignore` started as GitHub's Python template; its `lib/`, `build/`, `dist/` rules are anchored to the repo root. Check with `git check-ignore -v <path>` if a file will not show up in `git status`.
- Never commit `.IMG` or `.tif` elevation files. They are ignored in both upper and lower case.
- The two windows of a pair must be the same size and measured on the same grid: 40 km and 80 m for the Moon pairs, 60 km and 500 m for Lake Salda and Jezero (the Mars grid is about 463 m). The page warns if they differ. Numbers from the two grids cannot be compared with each other.
- The de Gerlache and Shackleton centres are provisional (the Gazetteer lists several). The page shows the centre each export was cut at.
