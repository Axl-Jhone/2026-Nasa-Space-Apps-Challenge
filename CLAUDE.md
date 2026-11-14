# Earth Analog Atlas (2026 NASA Space Apps Challenge)

## Goal
We compare the terrain of an Earth site with a lunar crater using real elevation
data (DEMs), to find Earth places that are good analogs for Moon base locations.
Team of 4; we are beginners in geospatial work, so explain things in plain
language and keep code simple.

## Who works where
- The data pipeline owner works ONLY in `/pipeline`. Do not edit files outside it.
- Shared files, especially the JSON data contract, must NOT be changed unless the
  whole team has agreed. If a change seems needed, stop and ask.

## Environment
- Python 3.12 on Windows, VS Code, Jupyter kernel `nasa-spaceapps`.
- Installed: rasterio, numpy, matplotlib, pystac-client, planetary-computer, pyproj.
- Do not install anything else without asking.

## Notebook rules (`pipeline/earth_dem.ipynb`)
- Keep cells small. Every code cell gets a markdown note saying what it does.
- Explain every non-obvious line in one sentence (we must defend the method).
- Work one step at a time; show output and wait for confirmation.
- If a number or plot looks wrong, say so plainly and investigate; never smooth it over.
- No refactoring into modules yet. Do not commit or push until the pipeline owner explicitly approves.

## Data
- Large downloaded data goes in `data/raw/`, which must be listed in `.gitignore`.
- Any number shown to users must come from real data, never placeholders.
