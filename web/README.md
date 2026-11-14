# ATLAS (Earth Analog Atlas): web app

A static site. No build step, no framework. Five tabs: **Three worlds**, **All pairs**, **Planets**, **Side by side**, **Method and sources**. Each site also has a pair page at `#pair/<site id>`, opened from the site list, the globes or the All pairs table.

## Run it

```
cd web
python -m http.server 8000
```

Open http://localhost:8000. Opening `index.html` by double-click will not work, because the page loads JSON files.
To deploy, upload the `web/` folder to GitHub Pages, Netlify or Vercel as it is.

## What is real and what is a placeholder

| Thing | Status |
|---|---|
| Globe imagery (`assets/tiles`) | Real NASA imagery (GIBS Blue Marble, LRO WAC, Viking MDIM), credited in the footer |
| Site list, labels, claims (`data/sites.json`) | Claims for the ten plan sites come from the research plan's source check and carry source ids. A claim with no source id is shown as "our reading". Río Tinto and Yungay are team additions, confirmed by abstract only |
| Planet figures | NASA Planetary Fact Sheets, read 15 November 2026 |
| 3D terrain and slide view | Real for both pairs (de Gerlache and Shackleton). A pair marked `hideIfSample` in `sites.json` is hidden if its export is missing, so sample terrain never reaches the page |
| Measurements table and slope chart | Blank until both windows have an export with metrics. The browser never invents or recomputes them |
| Control results | Run on 15 November: two lunar craters, Kamestastin, the Namib Sand Sea and Sua Pan. The table on the Method tab reads the exports |

## Files

```
index.html          page shell
css/style.css       all styling (dark theme)
js/app.js           tabs, routing, lists, globes, side-by-side logic
js/pages.js         pair page, All pairs table, Method and sources (all text from sites.json)
js/terrain.js       loads exports, sample fallback, shading, 3D drawing, hillshade
js/globe.js         textured globes and tile stitching
js/util.js          small helpers
data/sites.json     sites, matrix, planets, pairs, text boxes (edit this, not the code)
data/terrain/       one JSON per window, written by pipeline/export_terrain.py
assets/tiles/       globe texture tiles
```

## Adding real terrain

Each window is one file, `data/terrain/<id>.json`. The ids the app asks for come from `pairs` in `sites.json`:
`kamestastin`, `degerlache`, `shackleton`. The control table also reads `namib` and `suapan` (`controlWindows` in `sites.json`).

Write them from the notebook with `pipeline/export_terrain.py` (same function for Earth and Moon, so formats match):

```python
from export_terrain import export_window
export_window(dem_utm, cell_m=30, window_km=40,
              out_path="../web/data/terrain/kamestastin.json",
              id="kamestastin", body="earth", name="Kamestastin Lake impact structure",
              centre=(55.883, -63.30), mask=lake_mask,          # lake_mask: True where lake, same shape as dem_utm
              source={"dataset": "Copernicus DEM GLO-30", "pixel_m": 30, "crs": "EPSG:32620"})
export_window(moon_crop, cell_m=80, window_km=40,
              out_path="../web/data/terrain/degerlache.json",
              id="degerlache", body="moon", name="de Gerlache crater",
              centre=(-88.5, -87.1),
              source={"dataset": "LRO LOLA LDEM_80S_80M", "pixel_m": 80})
```

Requirements: a square 2D array in metres, north at the top, covering `window_km`. Heights can be absolute
(sea level, or the lunar reference sphere); the app draws them relative to the median of the dry ground.

If a file is missing the app shows sample terrain with a tag. If a file is malformed the tag says why.

### File format (what the app reads)

| Field | Meaning |
|---|---|
| `n`, `heights_m` | display mesh size and `n*n` heights in metres, row 0 = north |
| `window_km` | side of the square window |
| `water` | optional `n*n` list of 0/1, 1 = lake (drawn as water, excluded from measures) |
| `source` | `{dataset, pixel_m, crs}` shown under the picture |
| `analysis_cell_m` | the shared grid the metrics were computed on (the app warns if Earth and Moon differ) |
| `metrics` | `relief_p5_p95_m`, `median_slope_deg`, `p95_slope_deg`, `roughness_m`, `gentle_share`, `gentle_slope_deg`, `gentle_slope_source`, `masked_share` |
| `slope_hist` | `{edges_deg, frac}`, same bins for both windows |

## Metric definitions (draft, for the team to review)

Both windows are first area-averaged onto one 80 m grid, then measured. Slope is from gradients in metres.

- **Relief**: 95th minus 5th percentile height of unmasked cells.
- **Roughness**: standard deviation of height minus its 5 x 5 pixel (400 m) moving average.
- **Gentle ground**: share of unmasked cells with slope under `GENTLE_SLOPE_DEG`, 8 degrees: the tilt NASA's Human Landing System must tolerate for surface operations (Chavers et al. 2020; NASA OIG IG-26-004). The requirement has no stated baseline and is applied at about 5 m in site studies, so at 80 m it is a coarse screen.
- No combined score. The app shows each measure and a plain ratio, not a verdict.

## Known gaps

- Much of the evidence is abstracts and press releases; the Method tab says how much of each source was read. A team member should open the primary paper for each chosen pair.
- The de Gerlache and Shackleton centres are the first of three sets the Gazetteer lists for each, so they stay marked provisional.
- Coordinates for Galena Creek, Great Kobuk, Yungay and Río Tinto are approximate and say so on the page.
- The measures cannot tell a crater from a dune field (see the controls). A shape measure is the next thing to add.
- Lake level: the DEM stores 334.5 m, which should be checked against the Copernicus product notes before it is quoted.
- No Discover (systematic search) tab.
- Dark theme only. The display mesh (128 x 128) is for pictures; measurements come from the 80 m grid.

## Site records in `data/sites.json`

Each site has: `label` (`benchmark`, `established` or `hypothesis`), `labelNote`, `confidence`, `claim` (one sentence), `matches` and `breaks` (lists of `{t, src}`; `src` holds source ids), optional `figures` (one quantity on both worlds), `helps`, `prior`, the matrix `d`, and coordinates with `coordSrc` or `coordNote`. Source ids are defined once under `sources` with a title, a link and how much was read. The pages never show a hypothesis as a finding: a `hypothesis` label draws a dashed box at the top of the pair page, and matrix cells proposed by us use status `H`.
