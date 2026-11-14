"""Measured land surface temperature at each Earth site, from NASA MODIS (Terra), for one year.

Reads the MOD11A2 product (8-day clear-sky composites, 1 km pixels) from Microsoft Planetary Computer, takes the one
pixel that contains the site's coordinates, and writes web/data/temperature.json. Nothing is modelled or filled in:
a composite with no clear-sky value is skipped and the count of values used is written beside every figure.

    python pipeline/earth_temperature.py            (needs rasterio, pyproj, pystac-client, planetary-computer)

Stored value x 0.02 = kelvin; 0 means no data. Both come from the product's own documentation.
"""
import json
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from pathlib import Path

import planetary_computer
import rasterio
from pyproj import Transformer
from pystac_client import Client

ROOT = Path(__file__).resolve().parent.parent
YEAR = 2023
SCALE = 0.02
COLLECTION = "modis-11A2-061"


def read_pixel(href, lon, lat):
    with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR"):
        with rasterio.open(href) as ds:
            x, y = Transformer.from_crs("EPSG:4326", ds.crs, always_xy=True).transform(lon, lat)
            raw = int(next(ds.sample([(x, y)]))[0])
    return raw * SCALE if raw > 0 else None


def site_series(catalog, site):
    lon, lat = site["lon"], site["lat"]
    items = [i for i in catalog.search(collections=[COLLECTION], intersects={"type": "Point", "coordinates": [lon, lat]},
                                       datetime=f"{YEAR}-01-01/{YEAR}-12-31").items() if i.id.startswith("MOD11A2")]
    jobs = [(i.assets[band].href, lon, lat) for i in items for band in ("LST_Day_1km", "LST_Night_1km")]
    with ThreadPoolExecutor(8) as pool:
        vals = list(pool.map(lambda j: read_pixel(*j), jobs))
    day = [v for v in vals[0::2] if v is not None]
    night = [v for v in vals[1::2] if v is not None]
    r = lambda v: round(v, 1)
    return {"lat": lat, "lon": lon, "composites": len(items), "n_day": len(day), "n_night": len(night),
            "mean_day_k": r(sum(day) / len(day)) if day else None, "mean_night_k": r(sum(night) / len(night)) if night else None,
            "min_night_k": r(min(night)) if night else None, "max_day_k": r(max(day)) if day else None}


def main():
    sites = json.loads((ROOT / "web" / "data" / "sites.json").read_text(encoding="utf-8"))["sites"]
    catalog = Client.open("https://planetarycomputer.microsoft.com/api/stac/v1", modifier=planetary_computer.sign_inplace)
    out = {"dataset": "MODIS/Terra Land Surface Temperature, 8-day, 1 km (MOD11A2 v061)", "year": YEAR, "generated": date.today().isoformat(),
           "note": "One 1 km pixel at the site's coordinates. Clear-sky 8-day composites; a composite with no value is skipped.", "sites": {}}
    for s in sites:
        try:
            out["sites"][s["id"]] = site_series(catalog, s)
            print(s["id"], out["sites"][s["id"]], flush=True)
        except Exception as e:          # say which site failed and keep going; a missing site shows as not measured
            print(s["id"], "FAILED:", e, file=sys.stderr, flush=True)
    (ROOT / "web" / "data" / "temperature.json").write_text(json.dumps(out, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
