# Pipeline notebook notes

Rules for the exploratory notebooks in this folder (`earth_dem.ipynb`, `moon_dem.ipynb`). The root `CLAUDE.md` is the team's file and always wins: if anything here disagrees with it, follow the root file.

## Environment
- Python 3.12 on Windows, VS Code, Jupyter kernel `nasa-spaceapps`.
- Installed: rasterio, numpy, matplotlib, pystac-client, planetary-computer, pyproj.
- Do not install anything else without asking.

## Notebook style
- Keep code short and commented: a config cell first, then one step per cell, each with a markdown note saying what it does.
- Explain every non-obvious line in one sentence, so the method can be defended.
- Work one step at a time; show the output and wait for confirmation.
- If a number or plot looks wrong, say so plainly and investigate; never smooth it over.
- All windows are 40 km x 40 km squares, so Earth and Moon are comparable.
- Every scale factor, offset, projection and coordinate comes from the file or a cited source. If unsure, say so.

## Where these notebooks read and write
- Read downloads from `data/raw/`. Git keeps only the `.LBL` labels there.
- Write GeoTIFFs to `data/processed/` (not committed; regenerate by rerunning).
- The last cell of each notebook calls `export_window` from `export_terrain.py`, which writes `web/data/terrain/<id>.json`. That file format, described in `web/README.md`, is the only one the site reads.

Settled 15 November: raw downloads in `data/raw/`, outputs through `export_terrain.py`. The earlier `contract/`, `content/`, `score/` and `app/` plan was removed, because `web/` is the app.
