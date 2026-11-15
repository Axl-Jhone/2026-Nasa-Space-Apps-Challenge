"""Mars window: cut a square from the NASA MOLA gridded elevation (MEGDR, 128 pixels per degree, about 463 m)
and export it for the web app, on the same coarse grid as its Earth partner.

    ATLAS_ANALYSIS_CELL_M=500 python pipeline/mars_dem.py Jezero 18.41 77.69 60

Every number that places a pixel comes from the product label, which is fetched and parsed first. Only the rows
that cover the window are read from the server (an HTTP range request of a few megabytes), not the whole file.
The window is resampled from degrees onto a square grid in metres, because slope needs metres in both directions.
"""
import math
import os
import sys
import urllib.request

import numpy as np

from export_terrain import ANALYSIS_CELL_M, export_window

BASE = "https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/meg128/"
TILE = "megt44n000hb"          # 44 N to 0 N, 0 E to 90 E: the tile that holds Jezero


def get(url, rng=None):
    req = urllib.request.Request(url, headers={"Range": f"bytes={rng[0]}-{rng[1]}"} if rng else {})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


def main(name, lat, lon, window_km):
    label = {}
    for line in get(BASE + TILE + ".lbl").decode("ascii", "replace").splitlines():
        if "=" in line:
            k, v = line.split("=", 1)
            label.setdefault(k.strip(), v.strip())
    num = lambda k: float(label[k].split()[0])
    lines, samples, res = int(num("LINES")), int(num("LINE_SAMPLES")), num("MAP_RESOLUTION")
    radius_m = num("A_AXIS_RADIUS") * 1000
    north, west = num("MAXIMUM_LATITUDE"), num("WESTERNMOST_LONGITUDE")
    assert label["SAMPLE_TYPE"] == "MSB_INTEGER" and num("SAMPLE_BITS") == 16 and label["UNIT"] == "METER"
    assert "SIMPLE CYLINDRICAL" in label["MAP_PROJECTION_TYPE"] and "EAST" in label["POSITIVE_LONGITUDE_DIRECTION"]
    assert "SCALING_FACTOR" not in label or num("SCALING_FACTOR") == 1, "heights are expected in metres as stored"

    m_per_deg = math.pi * radius_m / 180                        # metres in one degree of latitude on this sphere
    half_deg = (window_km * 500 + 3000) / m_per_deg             # half the window plus a 3 km margin, in degrees of latitude
    r0 = max(0, int((north - (lat + half_deg)) * res))
    r1 = min(lines, int((north - (lat - half_deg)) * res) + 2)
    raw = get(BASE + TILE + ".img", (r0 * samples * 2, r1 * samples * 2 - 1))
    assert len(raw) == (r1 - r0) * samples * 2, "the server did not return the rows asked for"
    block = np.frombuffer(raw, dtype=">i2").reshape(r1 - r0, samples).astype("float64")
    print(f"Label: {lines} x {samples}, {res:.0f} pixels per degree, radius {radius_m / 1000:.1f} km. Read rows {r0}:{r1} ({len(raw) / 1e6:.1f} MB).")

    # Square grid in metres centred on the site; each cell takes the bilinear value at its centre.
    cell = ANALYSIS_CELL_M
    n = round(window_km * 1000 / cell)
    offs = (np.arange(n) - (n - 1) / 2) * cell                  # metres from the centre, west to east and north to south
    lat_g = lat - offs[:, None] / m_per_deg                     # row 0 is north
    lon_g = lon + offs[None, :] / (m_per_deg * math.cos(math.radians(lat)))
    row = (north - lat_g) * res - 0.5 - r0 + 0 * lon_g          # pixel centres sit half a pixel in from the tile edge
    col = (lon_g - west) * res - 0.5 + 0 * lat_g
    i0, j0 = np.floor(row).astype(int), np.floor(col).astype(int)
    assert i0.min() >= 0 and i0.max() + 1 < block.shape[0] and j0.min() >= 0 and j0.max() + 1 < samples, "window runs off the rows read"
    fi, fj = row - i0, col - j0
    dem = (block[i0, j0] * (1 - fi) * (1 - fj) + block[i0, j0 + 1] * (1 - fi) * fj
           + block[i0 + 1, j0] * fi * (1 - fj) + block[i0 + 1, j0 + 1] * fi * fj)
    print(f"Window {n} x {n} cells of {cell} m = {n * cell / 1000:.0f} km. Height {dem.min():.0f} to {dem.max():.0f} m (MOLA areoid).")

    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out = export_window(dem, cell_m=cell, window_km=window_km, out_path=os.path.join(root, "web", "data", "terrain", f"{name.lower()}.json"),
                        id=name.lower(), body="mars", name=f"{name} crater", centre=(lat, lon),
                        source={"dataset": "MGS MOLA MEGDR 128 pixels per degree", "pixel_m": 463, "crs": f"simple cylindrical, {radius_m / 1000:.0f} km sphere, resampled to a {cell} m square grid"},
                        notes=f"Centre from the IAU Gazetteer. Product {label['PRODUCT_ID']}, data set {label['DATA_SET_ID']}.")
    print({k: round(v, 3) for k, v in out["metrics"].items() if isinstance(v, float)})


if __name__ == "__main__":
    main(sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4]))
