"""Saved copies of the zoom-view map pictures, so the demo runs with no network.

    python pipeline/prerender_maps.py            # every site
    python pipeline/prerender_maps.py salda      # one site

For each site and each world it asks the same public services as the live view (web/data/maplayers.json) for two
pictures centred on the place: a wide one and a close one. Nothing is drawn or altered; the bytes are saved as
received. web/data/maps/index.json records where each picture sits, in metres on the map's own flat grid.

Flat grid (the same maths as web/js/zoom.js):
  ordinary places: x = R cos(lat0) (lon - lon0), y = R (lat - lat0), angles in radians. Local, not global.
  Moon south of 60 S: polar stereographic about the south pole, x = 2R tan((90 + lat) / 2) sin(lon), y = ... cos(lon).
"""
import datetime
import json
import math
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "web" / "data" / "maps"
CFG = json.loads((ROOT / "web" / "data" / "maplayers.json").read_text(encoding="utf-8"))
SIZE = 640
VIEWS = {"wide": 512_000, "close": 64_000}      # half-width in metres: 1024 km and 128 km across


def is_polar(body, lat):
    return body == "moon" and lat < -60


def centre_xy(body, lat, lon):
    if not is_polar(body, lat):
        return 0.0, 0.0
    t = 2 * CFG["radius_m"]["moon"] * math.tan(math.radians(90 + lat) / 2)
    return t * math.sin(math.radians(lon)), t * math.cos(math.radians(lon))


def bbox_for(layer, body, lat0, lon0, b):
    """Metres on the flat grid -> what the service wants."""
    if layer["srs"] == "m":
        return b
    r = CFG["radius_m"][body]
    kx, ky = math.degrees(1 / (r * math.cos(math.radians(lat0)))), math.degrees(1 / r)
    return [lon0 + b[0] * kx, lat0 + b[1] * ky, lon0 + b[2] * kx, lat0 + b[3] * ky]


def fetch(layer, bbox, transparent=False):
    url = layer["url"] + ("&FORMAT=image/jpeg" if "FORMAT" not in layer["url"].upper() else "")
    url += "&BBOX=" + ",".join(f"{v:.6f}" for v in bbox) + f"&WIDTH={SIZE}&HEIGHT={SIZE}"
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "atlas-prerender"}), timeout=120) as r:
        kind, data = r.headers.get("Content-Type", ""), r.read()
    assert kind.startswith("image/"), (kind, data[:200])
    return data


def one(site_id, tag, body, lat, lon):
    key = "moonpolar" if is_polar(body, lat) else body
    cx, cy = centre_xy(body, lat, lon)
    out = {"body": body, "polar": is_polar(body, lat), "lat": lat, "lon": lon, "views": {}}
    for view, half in VIEWS.items():
        b = [cx - half, cy - half, cx + half, cy + half]
        # the sharpest layer that is offered at this scale; fall back to the base layer if it comes back empty
        mpp = 2 * half / SIZE
        cands = [l for l in reversed(CFG["layers"][key]) if mpp <= l.get("maxMpp", 1e12)]
        for layer in cands:
            data = fetch(layer, bbox_for(layer, body, lat, lon, b))
            if len(data) > 6000 or layer is cands[-1]:      # an all-blank picture compresses to almost nothing
                break
        name = f"{site_id}-{tag}-{view}.jpg"
        (OUT / name).write_bytes(data)
        out["views"][view] = {"file": name, "b": [round(v, 1) for v in b], "layer": layer["id"], "bytes": len(data)}
        print(f"  {name:36s} {layer['id']:10s} {len(data) / 1000:6.0f} kB")
    return out


def main(only):
    OUT.mkdir(parents=True, exist_ok=True)
    sites = json.loads((ROOT / "web" / "data" / "sites.json").read_text(encoding="utf-8"))["sites"]
    idx_path = OUT / "index.json"
    idx = json.loads(idx_path.read_text(encoding="utf-8")) if idx_path.exists() else {"sites": {}}
    for s in sites:
        if only and s["id"] not in only:
            continue
        print(s["id"])
        rec = {"earth": one(s["id"], "earth", "earth", s["lat"], s["lon"])}
        if s.get("tlat") is not None:
            rec["other"] = one(s["id"], "other", s["body"], s["tlat"], s["tlon"])
        idx["sites"][s["id"]] = rec
    idx["size_px"] = SIZE
    idx["fetched"] = datetime.date.today().isoformat()
    idx["note"] = "Pictures saved as received from the services in maplayers.json. b is [min x, min y, max x, max y] in metres on the map's flat grid."
    idx_path.write_text(json.dumps(idx, indent=1), encoding="utf-8", newline="\n")
    print("wrote", idx_path)


if __name__ == "__main__":
    main(set(sys.argv[1:]))
