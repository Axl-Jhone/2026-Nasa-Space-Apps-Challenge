"""Terrain similarity between two windows, as a percentage with its three parts, written into web/data/sites.json.

It answers "how similar is the terrain?" for the one dimension we measure on both worlds. It is never shown without
its parts, and it says nothing about rock, temperature or anything else.

    python pipeline/score_terrain.py

Parts, each 0 to 100, from the measures already in web/data/terrain/<id>.json (same 40 km window, same 80 m grid):
  slopes     overlap of the two slope histograms: add up, bin by bin, the smaller of the two shares
  relief     smaller relief divided by larger relief
  roughness  smaller roughness divided by larger roughness
The score is their plain average. Weights would need a reason we do not have, so there are none.
"""
import json
from pathlib import Path

import sitesjson

ROOT = Path(__file__).resolve().parent.parent
SITES = ROOT / "web" / "data" / "sites.json"
TERRAIN = ROOT / "web" / "data" / "terrain"

TEXT = {
    "h": "How terrain similarity is worked out",
    "p": [
        "Where both worlds have a terrain window, the page gives a terrain similarity percentage. It is the plain average of three parts, each from 0 to 100, and it is always shown with them.",
    ],
    "ul": [
        "Slopes: how much the two slope histograms overlap. For each 2 degree bin take the smaller of the two shares, then add them up.",
        "Relief: the smaller relief divided by the larger.",
        "Roughness: the smaller roughness divided by the larger.",
    ],
    "p2": [
        "It is a plain average because we have no reason to weight one part above another. It describes terrain only. It says nothing about rock, temperature, ice or anything else, and it does not feed the confidence score.",
        "The controls test it: the table below gives every window's similarity to de Gerlache.",
    ],
}


def load(i):
    return json.loads((TERRAIN / f"{i}.json").read_text(encoding="utf-8"))


def similarity(a, b):
    ma, mb = a["metrics"], b["metrics"]
    ratio = lambda k: 100 * min(ma[k], mb[k]) / max(ma[k], mb[k]) if max(ma[k], mb[k]) > 0 else 100.0
    slopes = 100 * sum(min(x, y) for x, y in zip(a["slope_hist"]["frac"], b["slope_hist"]["frac"]))
    parts = [
        {"k": "slopes", "label": "Slopes", "pct": round(slopes), "why": "Overlap of the two slope histograms."},
        {"k": "relief", "label": "Relief", "pct": round(ratio("relief_p5_p95_m")),
         "why": f"{round(min(ma['relief_p5_p95_m'], mb['relief_p5_p95_m']))} m against {round(max(ma['relief_p5_p95_m'], mb['relief_p5_p95_m']))} m."},
        {"k": "roughness", "label": "Roughness", "pct": round(ratio("roughness_m")),
         "why": f"{min(ma['roughness_m'], mb['roughness_m']):.1f} m against {max(ma['roughness_m'], mb['roughness_m']):.1f} m."},
    ]
    return {"score": round(sum(p["pct"] for p in parts) / len(parts)), "parts": parts}


def main():
    D = sitesjson.load(SITES)
    for pair in D["pairs"]:
        if (TERRAIN / f"{pair['earth']}.json").exists() and (TERRAIN / f"{pair['other']}.json").exists():
            pair["sim"] = similarity(load(pair["earth"]), load(pair["other"]))
            print(f"{pair['id']:<12} {pair['sim']['score']:>3}%  " + "  ".join(f"{p['k']}={p['pct']}" for p in pair["sim"]["parts"]))
    ref = load("degerlache")
    for w in D.get("controlWindows", []):
        if w["id"] != "degerlache" and (TERRAIN / f"{w['id']}.json").exists():
            w["sim"] = similarity(load(w["id"]), ref)["score"]
            print(f"control {w['id']:<12} vs de Gerlache {w['sim']:>3}%")
    D["terrainSim"] = TEXT
    sitesjson.save(SITES, D)


if __name__ == "__main__":
    main()
