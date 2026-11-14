# Data contract

The shapes every module agrees on. Change this folder only when the team agrees, and update the samples in the same change.

Status: **draft**, agree it in Step 0.

## Fixed word lists

| List | Values |
| --- | --- |
| Dimensions | `terrain`, `geology`, `temperature`, `illumination`, `ice`, `permafrost`, `dust`, `subsurface` |
| Operations | `landing`, `navigation`, `mobility`, `robotics`, `construction`, `resources`, `human_ops` |
| Levels | `measured`, `cited`, `hypothesis`, `breaks`, `not_assessed` |
| Labels | `benchmark`, `established`, `agency_used`, `hypothesis` |
| Bodies | `moon`, `mars` |
| Status | `chosen` (one of the seven pairs), `explore` (explore only) |

## Files the app reads (all in `data/`)

| File | Written by | Shape |
| --- | --- | --- |
| `sites.json` | `content/build.py` | Array of site records, see `sample-site.json` |
| `sources.json` | `content/build.py` | Object keyed by source id, see below |
| `rules.json` | `content/build.py` | Object: operation → list of dimensions |
| `limits.json` | `content/build.py` (Mico writes the source) | Array of limits, see below |
| `terrain/<pair>.json` | `pipeline/export.py` | See `sample-terrain.json` |
| `img/*.png` | `pipeline/hillshade.py` | Shaded relief, same size and light on both sides |

## Site record (`sample-site.json`)

- `id`: lowercase, hyphens, unique. Also the page address.
- `fake`: `true` while any content is made up. `build.py --final` fails if any is left.
- `earth`, `counterpart`: name, region (Earth only), body (counterpart only), `lat` and `lon` in decimal degrees, north and east positive.
- `label`, `confidence` (`low`, `medium`, `high`), `summary`.
- `matches`, `breaks`: lists of `{ text, source }`. Every match needs a source id. A break may have `source: null`.
- `ratings`: **all eight dimensions present**, each `{ level, note, source }`.
  - `cited` needs a `source` that exists in `sources.json`.
  - `breaks` and `hypothesis` need a `note` saying why.
- `terrain_file`: path inside `data/`, or `null` when terrain is not scored.

## Source (`sources.json`)

```json
{
  "src-fake-1": { "title": "FAKE source", "url": "https://example.org", "opened_by": "Prince", "opened_on": "2026-11-14" }
}
```

`opened_by` is the person who opened the source and checked it says what the record claims.

## Limit (`limits.json`)

```json
[
  { "id": "gravity", "fake": true, "label": "Surface gravity", "earth": "FAKE", "moon": "FAKE", "mars": "FAKE", "source": "src-fake-1" }
]
```

## Terrain file (`sample-terrain.json`)

- `window_km`, `grid_m`: window size and the common pixel size both sides were resampled to.
- `slope_bins_deg`: bin edges. Each `slope_hist` has **one fewer** value than there are edges, as fractions summing to 1.
- `hillshade`: the light settings used for both images. The app prints them.
- `earth`, `counterpart`: dataset name, `relief_m`, `roughness_m`, `slope_hist`, `image`.
- `score`: `overall`, `relief`, `slope`, `roughness`, each 0 to 1, and `method`. The app never shows `overall` without the three parts.
- `control`: the same score for a site that should not match (test C4).

## Score functions (`score/`, called by `pipeline/`)

| Function | Takes | Returns |
| --- | --- | --- |
| `relief_m(dem, px_m)` | 2-D NumPy array of heights in metres (NaN = no data), pixel size in metres | float, metres |
| `slope_deg(dem, px_m)` | Same | 2-D array of slope in degrees |
| `slope_hist(slope, bins)` | Slope array, bin edges | list of fractions summing to 1 |
| `roughness_m(dem, px_m)` | Same as `relief_m` | float, metres |
| `similarity(a, b)` | Two dicts with `relief_m`, `roughness_m`, `slope_hist` | dict with `overall`, `relief`, `slope`, `roughness`, each 0 to 1 |

## Operations from ratings (done in the app)

For each operation at each site, look at the dimensions `rules.json` lists for it:

- **Can be rehearsed on:** dimensions rated `measured` or `cited`, plus `hypothesis` ones marked as hypothesis.
- **Cannot be rehearsed for:** dimensions rated `breaks`.
- **Unknown:** dimensions rated `not_assessed`.
- With nothing in the first list, show "not supported by evidence yet". Never hide the operation.
