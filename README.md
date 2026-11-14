# 2026-Nasa-Space-Apps-Challenge
Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars

**ATLAS (Earth Analog Atlas)**: this place on Earth is like that place on the Moon or Mars in these measured ways, and unlike it in these.

| Path | What |
| --- | --- |
| `web/` | The website (static, no build step). Run: `cd web`, `python -m http.server 8000` |
| `web/data/sites.json` | All page text: sites, labels, claims with source ids, the analogy matrix, method text, source list |
| `web/data/terrain/` | Terrain exports the site reads |
| `pipeline/` | Notebooks that cut the Earth and Moon windows, `export_terrain.py` that measures them, `run_notebook.py` that reruns a notebook for another site, and `score_confidence.py` that counts each pair's confidence score |
| `SUBMISSION.md` | Drafts for the Space Apps form, the 30-second demo script, and the source list |
| `data/raw/` | Raw downloads (only the `.LBL` labels are committed) |

Start with [BUILD-GUIDE.md](BUILD-GUIDE.md). Rules for AI sessions are in [CLAUDE.md](CLAUDE.md).

Data: Copernicus DEM GLO-30 (via Microsoft Planetary Computer), LRO LOLA polar gridded elevation (NASA PDS), NASA GIBS Blue Marble, LRO WAC and Viking MDIM imagery. NASA is acknowledged as the data source and does not endorse this project.
