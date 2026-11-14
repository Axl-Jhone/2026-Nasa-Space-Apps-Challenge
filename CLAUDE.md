# Earth Analog Atlas

NASA Space Apps 2026, challenge "Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars". Deadline 15 November 2026, 11:59 pm PHT (submit by 9 pm).

The site argues: this place on Earth is like that place on the Moon or Mars in these measured ways, and unlike it in these. Terrain is the only dimension measured the same way on both worlds, so it is the only one scored.

## Who owns what

| Folder | Owner | Contents |
| --- | --- | --- |
| `contract/` | whole team | Agreed data shapes. Do not edit without the team agreeing |
| `content/` | Prince (`limits.json`: Mico) | Site text, sources, rule table, validator `build.py` |
| `pipeline/` | Leander | Download, crop, regrid, hillshade, write `data/terrain/` |
| `score/` | Mico | Relief, slope, roughness, similarity, tests |
| `data/` | written by `content/build.py` and `pipeline/` | Read by the app. Do not hand-edit |
| `app/` | Axl | React + Vite + TypeScript, Plotly, Leaflet |

Edit only the folder of the person you are working with. If the work needs a change in another folder, say what and why, and let its owner make it. If it needs a new field, propose a change to `contract/`.

## How to work with us

We are learning as we build. For every step:

1. Do one small step, not a whole module.
2. Before writing code, explain the plan, why this way, and what could go wrong. Wait for an OK.
3. After writing it, walk through what you wrote and say what we should check by hand.
4. Commit only when asked.

Keep code comments short.

## Honesty rules

- Never invent a source, citation, number or coordinate. If it is unknown, use `not_assessed` or ask.
- Any record with made-up content has `"fake": true`. Remove it only when the content is real.
- Do not change a test's expected value to make it pass. Explain the failure instead.
- Every `cited` rating needs a source id that exists in `content/sources.json`.

## Fixed word lists

- Dimensions: `terrain`, `geology`, `temperature`, `illumination`, `ice`, `permafrost`, `dust`, `subsurface`
- Operations: `landing`, `navigation`, `mobility`, `robotics`, `construction`, `resources`, `human_ops`
- Levels: `measured`, `cited`, `hypothesis`, `breaks`, `not_assessed`
- Labels: `benchmark`, `established`, `agency_used`, `hypothesis`
- Bodies: `moon`, `mars`

## Commands

- Python: one virtual environment at the repo root. `python -m venv .venv`, then `pip install -r requirements.txt`
- Score tests: `python -m pytest score`
- Content check: `python content/build.py` (add `--final` before submitting)
- App: `cd app`, `npm install`, `npm run dev`

## Gotchas

- `.gitignore` started as GitHub's Python template. Its `lib/`, `build/`, `dist/` and `downloads/` rules are now anchored to the repo root, so `app/src/lib/` is safe. Check with `git check-ignore -v <path>` if a file will not show up in `git status`.
- Raw downloads go in `pipeline/cache/`, which is ignored. Never commit `.img` elevation files.
- The app is served from the repo name on GitHub Pages. Prefix fetched paths with `import.meta.env.BASE_URL` and use a hash router.
- One `slope_hist` has one fewer value than `slope_bins_deg` has edges.
