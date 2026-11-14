"""Long-term climate at each Earth site from NASA POWER: air temperature, wind and rainfall.

    python pipeline/earth_climate.py        (standard library only; no account needed)

NASA POWER serves climatologies from the MERRA-2 reanalysis on a grid of about 50 km. A reanalysis is a
reconstruction constrained by observations, not a reading from a thermometer at the site, and one grid cell
is far larger than most of our sites. The page says both. Values are copied as served; only the yearly
rainfall total is worked out here (mm per day x 365).
"""
import json
import sys
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PARAMS = "T2M,T2M_MAX,T2M_MIN,WS10M,WS10M_MAX,PRECTOTCORR"
URL = "https://power.larc.nasa.gov/api/temporal/climatology/point?parameters={p}&community=AG&longitude={lon}&latitude={lat}&format=JSON"


def main():
    sites = json.loads((ROOT / "web" / "data" / "sites.json").read_text(encoding="utf-8"))["sites"]
    out = {"dataset": "NASA POWER climatology (MERRA-2 reanalysis, about 50 km grid)", "url": "https://power.larc.nasa.gov/",
           "generated": date.today().isoformat(),
           "note": "A reanalysis value for the grid cell that contains the site, not a reading at the site itself.", "sites": {}}
    for s in sites:
        try:
            with urllib.request.urlopen(URL.format(p=PARAMS, lon=s["lon"], lat=s["lat"]), timeout=60) as r:
                d = json.load(r)
            p = d["properties"]["parameter"]
            bad = [k for k in PARAMS.split(",") if p[k]["ANN"] in (None, -999, -999.0)]
            if bad:
                raise ValueError(f"no value for {bad}")
            out["period"] = d.get("header", {}).get("range", out.get("period"))
            out["sites"][s["id"]] = {
                "lat": s["lat"], "lon": s["lon"],
                "t_mean_c": p["T2M"]["ANN"], "t_min_c": p["T2M_MIN"]["ANN"], "t_max_c": p["T2M_MAX"]["ANN"],
                "wind_mean_ms": p["WS10M"]["ANN"], "wind_max_ms": p["WS10M_MAX"]["ANN"],
                "rain_mm_year": round(p["PRECTOTCORR"]["ANN"] * 365),
            }
            print(s["id"], out["sites"][s["id"]], flush=True)
        except Exception as e:      # name the site that failed and keep going; it shows as not read
            print(s["id"], "FAILED:", e, file=sys.stderr, flush=True)
    (ROOT / "web" / "data" / "climate.json").write_text(json.dumps(out, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
