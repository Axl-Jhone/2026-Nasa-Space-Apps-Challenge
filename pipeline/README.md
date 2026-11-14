# pipeline/ (Leander)

| File | Step | What |
| --- | --- | --- |
| `earth.py` | B1, B2 | Copernicus GLO-30 window from Planetary Computer, reprojected to metres |
| `moon.py` | B3 | LOLA polar file read from its label, scaled, windowed |
| `grid.py` | B4 | Both sides to the same pixel size |
| `hillshade.py` | B5 | One PNG per side, same light settings, into `data/img/` |
| `export.py` | B5 | Calls `score/` and writes `data/terrain/<pair>.json` |
| `notebooks/look.ipynb` | all | Imports the above and shows each crop |

Logic in `.py` files, the notebook only for looking. Raw downloads go in `pipeline/cache/` (ignored by git). Until `score/` is ready, use stand-in functions with the names in `contract/README.md`.

Run from the repo root, for example `python -m pipeline.export`.
