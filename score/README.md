# score/ (Mico)

| File | Step | What |
| --- | --- | --- |
| `metrics.py` | C1 | `relief_m`, `slope_deg`, `slope_hist`, `roughness_m` |
| `similarity.py` | C2 | `similarity(a, b)` |
| `tests/test_synthetic.py` | C3 | Surfaces with known answers. Write the prediction before running |
| `METHOD.md` | C1, C2 | Each definition in one sentence and one formula, for the method page |

Function names and shapes are fixed in `contract/README.md`. Heights are metres, NaN means no data, every function must ignore NaN.

Run tests from the repo root: `python -m pytest score`.
