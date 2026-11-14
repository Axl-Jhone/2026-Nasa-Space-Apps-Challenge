# content/ (Prince; `limits.json`: Mico)

| File | What |
| --- | --- |
| `sites/<id>.json` | One file per site, shape in `contract/sample-site.json`. Ten in all |
| `sources.json` | Every source, keyed by id |
| `rules.json` | Operation → dimensions table. The team's own framework, challenge every row |
| `limits.json` | Gravity, pressure, radiation, with sources (Mico, step C5) |
| `build.py` | To build: validates everything here and writes `data/sites.json`, `sources.json`, `rules.json`, `limits.json` |

Everything here is FAKE until replaced. `sites/kamestastin.json` is a copy of the contract sample.

`build.py` checks (see `contract/README.md`): all eight dimensions present, allowed levels only, cited ratings and matches point to real source ids, breaks and hypothesis have a note, and with `--final` nothing has `"fake": true`.

Steps: A1 to A4 in `BUILD-GUIDE.md`.
