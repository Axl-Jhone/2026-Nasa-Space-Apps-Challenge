# Earth Analog Atlas (2026 NASA Space Apps Challenge)

## Goal
We compare Earth terrain windows with Moon/Mars terrain windows using real elevation
data (DEMs), to find Earth places that are good analogs for Moon base locations.
Team of 4; we are beginners in geospatial work, so explain code in plain words.

## Who works where
- The data pipeline owner works ONLY in `/pipeline` (plus the output folders below).
- Shared files, especially the JSON data contract, must NOT be changed unless the
  whole team has agreed. If a change seems needed, stop and ask.

## Environment
- Python 3.12 on Windows, VS Code, Jupyter kernel `nasa-spaceapps`.
- Installed: rasterio, numpy, matplotlib, pystac-client, planetary-computer, pyproj.
- Do not install anything else without asking.

## Notebook rules (`pipeline/earth_dem.ipynb`)
- Keep code short and commented, in the existing style: a config cell, then one step per cell.
- Every code cell gets a markdown note saying what it does; explain every non-obvious line.
- Work one step at a time; show output and wait for confirmation.
- If a number or plot looks wrong, say so plainly and investigate; never smooth it over.
- No refactoring into modules yet. Do not commit or push until the pipeline owner explicitly approves.

## Data
- `data/raw/` is read-only and git-ignored. Never commit or modify files there.
- Outputs go to `data/processed/`. Web exports go to `web/data/`.
- Never invent measurements. Scale factors, offsets, projections and coordinates must come
  from the files or a cited source. If unsure, say so. Numbers shown to users must come from real data.
- All windows are 40 km x 40 km squares so Earth and Moon are comparable.
