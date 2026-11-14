"""Export one terrain window for the web app (web/data/terrain/<id>.json).

Used for BOTH Earth and Moon windows so the two files have the same format and the app can
compare them. The browser only draws what is in the file; every number in "metrics" is
computed here, on one shared analysis grid.

Usage from a notebook, once you have a square elevation array in metres (north at the top):

    from export_terrain import export_window
    export_window(dem_utm, cell_m=30, window_km=40, out_path="../web/data/terrain/kamestastin.json",
                  id="kamestastin", body="earth", name="Kamestastin Lake impact structure",
                  centre=(55.883, -63.30), mask=lake_mask,
                  source={"dataset": "Copernicus DEM GLO-30", "pixel_m": 30, "crs": "EPSG:32620"})

Run `python export_terrain.py --selftest` to check the maths on synthetic terrain.

DRAFT DEFINITIONS: the metric definitions below are a starting point for the team to review,
not a validated method. GENTLE_SLOPE_DEG is the NASA Human Landing System tilt threshold (see below).
"""
import json
import sys
import tempfile
from datetime import date
from pathlib import Path

import numpy as np

ANALYSIS_CELL_M = 80        # both worlds are brought to this grid before measuring (Moon LOLA polar DEM is 80 m)
DISPLAY_N = 128             # mesh size used for the 3D picture (display only)
# Gentle ground: NASA Human Landing System requirement "Landing Site Vertical Orientation", 0 to 8 degrees from local
# vertical (threshold) for surface operations. Chavers et al. 2020, https://ntrs.nasa.gov/citations/20200001606 ;
# NASA OIG report IG-26-004 gives the same 8 degree tilt tolerance. The requirement states no baseline and site
# studies apply it at about 5 m, so on this 80 m grid the share is a coarse screen, not a landing-safety result.
GENTLE_SLOPE_DEG = 8.0
GENTLE_SOURCE = "NASA Human Landing System tilt threshold; at an 80 m baseline this is a coarse screen"
HIST_EDGES = list(range(0, 42, 2))   # slope histogram bins in degrees, 0 to 40
TREND_PX = 5                # roughness: remove a 5 x 5 pixel moving average (400 m at 80 m)


def block_mean(a, n_out):
    """Area-average a 2D array down to n_out x n_out. NaNs are ignored; all-NaN blocks stay NaN.
    Area averaging (not picking every k-th pixel) keeps coarsening from inventing roughness."""
    a = np.asarray(a, dtype="float64")
    rows, cols = a.shape
    re = np.linspace(0, rows, n_out + 1).round().astype(int)
    ce = np.linspace(0, cols, n_out + 1).round().astype(int)
    valid = ~np.isnan(a)
    z = np.where(valid, a, 0.0)
    s = np.add.reduceat(np.add.reduceat(z, re[:-1], axis=0), ce[:-1], axis=1)
    c = np.add.reduceat(np.add.reduceat(valid.astype("float64"), re[:-1], axis=0), ce[:-1], axis=1)
    with np.errstate(invalid="ignore", divide="ignore"):
        return np.where(c > 0, s / c, np.nan)


def slope_deg(dem, cell_m):
    gy, gx = np.gradient(dem, cell_m)
    return np.degrees(np.arctan(np.hypot(gx, gy)))


def local_detrended(dem, k):
    """Height minus its k x k moving average (NaN-safe via edge padding with the nearest value)."""
    pad = k // 2
    p = np.pad(np.nan_to_num(dem, nan=np.nanmedian(dem)), pad, mode="edge")
    w = np.lib.stride_tricks.sliding_window_view(p, (k, k))
    return dem - w.mean(axis=(-1, -2))


def metrics_on_grid(dem, masked, cell_m, gentle_deg=GENTLE_SLOPE_DEG):
    ok = ~masked & ~np.isnan(dem)
    if ok.sum() < 100:
        raise ValueError("fewer than 100 usable cells after masking")
    sl = slope_deg(dem, cell_m)[ok]
    h = dem[ok]
    rough = local_detrended(dem, TREND_PX)[ok]
    frac, _ = np.histogram(np.clip(sl, 0, HIST_EDGES[-1] - 1e-9), bins=HIST_EDGES)
    return {
        "relief_p5_p95_m": float(np.percentile(h, 95) - np.percentile(h, 5)),
        "median_slope_deg": float(np.median(sl)),
        "p95_slope_deg": float(np.percentile(sl, 95)),
        "roughness_m": float(np.std(rough)),
        "gentle_share": float((sl < gentle_deg).mean()),
        "gentle_slope_deg": gentle_deg,
        "gentle_slope_source": GENTLE_SOURCE,
        "masked_share": float(masked.mean()),
        "usable_cells": int(ok.sum()),
    }, {"edges_deg": HIST_EDGES, "frac": [float(x) for x in frac / frac.sum()]}


def export_window(dem, cell_m, window_km, out_path, id, body, name, centre, mask=None,
                  source=None, n=DISPLAY_N, notes=""):
    dem = np.asarray(dem, dtype="float64")
    if dem.ndim != 2 or dem.shape[0] != dem.shape[1]:
        raise ValueError(f"window must be a square 2D array, got {dem.shape}")
    side_m = dem.shape[0] * cell_m
    if abs(side_m - window_km * 1000) > 2 * cell_m:
        raise ValueError(f"array covers {side_m / 1000:.2f} km but window_km={window_km}")
    mask = np.zeros(dem.shape, bool) if mask is None else np.asarray(mask, bool)
    if mask.shape != dem.shape:
        raise ValueError("mask must have the same shape as dem")

    n80 = round(window_km * 1000 / ANALYSIS_CELL_M)
    dem80 = block_mean(dem, n80)                    # shared analysis grid
    mask80 = block_mean(mask.astype("float64"), n80) >= 0.5
    m, hist = metrics_on_grid(dem80, mask80, ANALYSIS_CELL_M)

    disp = block_mean(dem80, n)                     # display mesh, row 0 = north
    water = block_mean(mask80.astype("float64"), n) >= 0.5
    if np.isnan(disp).any():
        disp = np.where(np.isnan(disp), np.nanmedian(disp), disp)

    out = {
        "id": id, "body": body, "name": name, "centre": {"lat": centre[0], "lon": centre[1]},
        "window_km": window_km, "n": n, "analysis_cell_m": ANALYSIS_CELL_M,
        "source": source or {},
        "heights_m": [round(float(v), 1) for v in disp.ravel()],
        "elev_min_m": float(np.nanmin(dem)), "elev_max_m": float(np.nanmax(dem)),
        "water": [int(v) for v in water.ravel()] if water.any() else None,
        "water_note": "Lake surface as stored in the DEM (flattened), masked from all measures" if water.any() else None,
        "metrics": m, "slope_hist": hist,
        "generated": date.today().isoformat(), "notes": notes,
    }
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    Path(out_path).write_text(json.dumps(out, separators=(",", ":")))
    return out


def _selftest():
    rng = np.random.default_rng(1)
    n = 1333
    y, x = np.mgrid[:n, :n]
    r = np.hypot(x - n / 2, y - n / 2) * 30 / 1000          # km from centre, 30 m pixels
    crater = np.where(r < 14, -260 + 430 * (r / 14) ** 2, 170 * np.exp(-(r - 14) * 0.4))
    dem = 300 + crater + rng.normal(0, 3, (n, n))
    lake = (np.hypot(x - 400, y - 800) * 30 < 4000)
    dem[lake] = 334.5
    o = export_window(dem, 30, 40, Path(tempfile.gettempdir()) / "selftest_terrain.json", "t", "earth", "synthetic", (0, 0), mask=lake)
    assert len(o["heights_m"]) == DISPLAY_N ** 2 and len(o["water"]) == DISPLAY_N ** 2
    expected = np.pi * 4 ** 2 / 40 ** 2          # a 4 km radius lake in a 40 km window
    assert abs(o["metrics"]["masked_share"] - expected) < 0.002, (o["metrics"]["masked_share"], expected)
    assert abs(sum(o["slope_hist"]["frac"]) - 1) < 1e-9
    # a flat plane must give zero slope and zero relief
    flat = export_window(np.full((500, 500), 100.0), 80, 40, Path(tempfile.gettempdir()) / "selftest_flat.json", "f", "moon", "flat", (0, 0))
    assert flat["metrics"]["median_slope_deg"] < 1e-9 and flat["metrics"]["relief_p5_p95_m"] < 1e-9 and flat["metrics"]["gentle_share"] == 1.0
    # block_mean: exact for an integer factor, and each output cell equals the mean of its own source pixels
    r2 = np.tile(np.arange(1000.0), (1000, 1))
    assert abs(block_mean(r2, 500).mean() - r2.mean()) < 1e-9
    ramp = np.tile(np.arange(1333.0), (1333, 1))
    edges = np.linspace(0, 1333, 501).round().astype(int)
    assert all(abs(block_mean(ramp, 500)[0, i] - np.arange(edges[i], edges[i + 1]).mean()) < 1e-9 for i in range(500))
    # a uniform 20 degree slope must read as 20 degrees
    plane = np.tile(np.arange(500.0) * 80 * np.tan(np.radians(20)), (500, 1))
    assert abs(slope_deg(plane, 80).mean() - 20) < 1e-6
    print("selftest ok:", {k: round(v, 3) for k, v in o["metrics"].items() if isinstance(v, float)})


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        _selftest()
    else:
        print(__doc__)
