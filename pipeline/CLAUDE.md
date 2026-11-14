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
- They read downloads from `data/raw/` (git-ignored) and write small outputs to `data/processed/`.

## To settle as a team (differences with the root `CLAUDE.md` and `pipeline/README.md`)
1. **Raw downloads:** the root file says `pipeline/cache/`; these notebooks use `data/raw/`. Pick one place.
2. **Outputs:** the team plan writes `data/terrain/<pair>.json` through `pipeline/export.py`. These notebooks write GeoTIFFs to `data/processed/` instead, and `*.tif` is now git-ignored (the one already committed stays tracked).
3. **Test site:** `web/` and `pipeline/export_terrain.py` came from a separate prototype. Their terrain JSON is **not** the `contract/` format and must not be mistaken for it.
