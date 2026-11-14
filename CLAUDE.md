# Earth Analog Atlas

NASA Space Apps 2026, challenge "Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars". Deadline 15 November 2026, 11:59 pm PHT (submit by 9 pm).

The site argues: this place on Earth is like that place on the Moon or Mars in these measured ways, and unlike it in these. Terrain is the only dimension measured the same way on both worlds, so it is the only one measured. There is no combined score: each measure is shown on its own with a plain ratio.

## What lives where

| Path | Owner | What |
| --- | --- | --- |
| `pipeline/earth_dem.ipynb` | Leander | Copernicus GLO-30 window from Planetary Computer, reprojected to UTM |
| `pipeline/moon_dem.ipynb` | Leander | LOLA `LDEM_80S_80M` window, every number read from the label |
| `pipeline/export_terrain.py` | Leander, Mico (metric definitions) | Shared 80 m grid, metrics, writes `web/data/terrain/<id>.json`. `--selftest` checks the maths |
| `pipeline/run_notebook.py` | Leander | Reruns a notebook's own cells for another site (Shackleton, the control windows) |
| `data/raw/` | | Downloads. Only `.LBL` labels are committed |
| `data/processed/` | | Notebook outputs (GeoTIFF). Not committed, regenerate from the notebooks |
| `web/` | Axl | Static site, no build step. Formats are in `web/README.md` |
| `web/data/sites.json` | Prince | All page text: sites, labels, claims with source ids, matrix, planets, pairs, controls, method text, source list |
| `SUBMISSION.md` | Everyone | Drafts for the Space Apps form and the demo script |
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
- Placeholders say so on the page. A pair whose terrain export is missing is hidden, not shown with sample terrain. The gentle-slope limit is 8°, cited to NASA's Human Landing System tilt threshold and labelled a coarse screen at 80 m.
- A claim in `sites.json` with no source id is shown on the page as "our reading". A pairing we propose ourselves is labelled `hypothesis` and is never shown as a finding.
- Every number on the page comes from a file. The browser never invents or recomputes a measurement.
- Do not change a test's expected value to make it pass. Explain the failure instead.

## Word lists used in `web/data/sites.json`

- Matrix status codes: `M` measured, `C` cited, `P` partial match, `H` hypothesis (ours), `B` breaks here, `N` not assessed
- Pair labels: `benchmark`, `established`, `hypothesis`
- Dimensions: `geo`, `terrain`, `temp`, `ice`, `dust`, `bio`, `sub`, `ops`
- Bodies: `moon`, `mars`

## Commands

- Python: `python -m venv .venv`, then `pip install -r requirements.txt`. Notebooks run from `pipeline/`
- Metric self-test: `cd pipeline`, then `python export_terrain.py --selftest`
- Site: `cd web`, then `python -m http.server 8000`, open http://localhost:8000 (double-clicking `index.html` does not work)

## Gotchas

- `.gitignore` started as GitHub's Python template; its `lib/`, `build/`, `dist/` rules are anchored to the repo root. Check with `git check-ignore -v <path>` if a file will not show up in `git status`.
- Never commit `.IMG` or `.tif` elevation files. They are ignored in both upper and lower case.
- Both windows must be 40 km and measured on the same 80 m grid. The page warns if they differ.
- The de Gerlache and Shackleton centres are provisional (the Gazetteer lists several). The page shows the centre each export was cut at.
