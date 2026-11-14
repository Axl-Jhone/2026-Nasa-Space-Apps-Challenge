"""Work out each pair's confidence score from what web/data/sites.json records, and write it back.

Confidence here means how well the statements on a pair's page are supported by sources we opened.
It is NOT a similarity score. The rubric is the team's own and is printed on the site's Method tab.

    python pipeline/score_confidence.py           rewrite the scores in sites.json
    python pipeline/score_confidence.py --check   change nothing; exit 1 if the stored scores are out of date

Nothing is judged here. Every part is counted from the file: which sources back which claims, what kind each
source is (sources.<id>.kind), how much of it was read (sources.<id>.depth), and whether terrain exports exist.
"""
import sys
from pathlib import Path

import sitesjson

ROOT = Path(__file__).resolve().parent.parent
SITES = ROOT / "web" / "data" / "sites.json"
TERRAIN = ROOT / "web" / "data" / "terrain"

HYPOTHESIS_CAP = 40
BANDS = [(75, "High"), (55, "Medium"), (35, "Low"), (0, "Very low")]

RUBRIC = {
    "h": "How confidence is worked out",
    "what": "How well the statements on this page are supported by sources we opened. It is not a similarity score.",
    "own": "The rubric is our own, not a published standard. It is set out on the Method tab.",
    "planNote": "Where that wording and the score differ, the score is the one that can be recounted from this page.",
    "p": [
        "Each pair has a confidence score out of 100. It says how well the statements on that pair's page are supported by sources we opened. It is not a similarity score, and a high score does not mean two places are alike: Kamestastin scores on its evidence while its measured terrain does not match.",
        "The score is the sum of five parts. Every part is counted from what the page records: which sources back which claims, what kind of source each one is, and how much of it was read.",
    ],
    "parts": [
        {"k": "published", "label": "The pairing is published", "short": "Published", "max": 25, "levels": [
            [25, "a peer-reviewed paper or a thesis makes the comparison"],
            [15, "a conference abstract, a report or an agency page does"],
            [8, "only news or a press release does"],
            [0, "it is our own proposal"]]},
        {"k": "sources", "label": "Strength of the sources", "short": "Sources", "max": 25, "levels": [
            [25, "peer-reviewed paper or thesis, read in full"],
            [20, "report, agency page or dataset"],
            [15, "peer-reviewed paper or thesis, abstract only; or a conference abstract"],
            [10, "preprint"],
            [5, "press release, news article or a summary of a paper"],
            [2, "encyclopedia"],
            ["", "The part is the average over the sources behind the \"alike\" claims."]]},
        {"k": "count", "label": "Independent sources", "short": "Count", "max": 15, "levels": [
            [15, "three or more sources stronger than news"],
            [10, "two"],
            [5, "one"],
            [0, "none"]]},
        {"k": "quantity", "label": "Same property on both worlds", "short": "Both worlds", "max": 20, "levels": [
            [20, "measured by us on both worlds, on one grid"],
            [15, "a published value for the same property on both sides: a number, or a named mineral"],
            [0, "neither"]]},
        {"k": "limits", "label": "Limits documented", "short": "Limits", "max": 15, "levels": [
            [15, "two or more differences backed by a source or a measurement"],
            [8, "one"],
            [0, "none"]]},
    ],
    "p2": [
        f"A hypothesis is capped at {HYPOTHESIS_CAP}, whatever its parts add up to, because nobody has tested the pairing.",
        "Bands: 75 and above is High, 55 to 74 is Medium, 35 to 54 is Low, under 35 is Very low.",
        "The rubric rewards reading better sources. A score rises when someone opens the primary paper and records it, and falls if a claim turns out to rest on news alone.",
        "The scores are computed by pipeline/score_confidence.py and stored in the data file. The page shows the stored numbers and their parts.",
    ],
}

KIND_WORDS = {"journal": "peer-reviewed paper", "thesis": "thesis", "conference": "conference abstract", "report": "report",
              "agency": "agency page", "dataset": "dataset", "preprint": "preprint", "press": "press release", "news": "news article",
              "summary": "summary of a paper", "tertiary": "encyclopedia"}


def grade(src):
    """Points out of 25 for one source, from its kind and how much of it was read."""
    kind, depth = src.get("kind"), src.get("depth")
    if kind in ("journal", "thesis"):
        return 25 if depth == "full" else 15
    if kind in ("report", "agency", "dataset"):
        return 20
    if kind == "conference":
        return 15
    if kind == "preprint":
        return 10
    if kind in ("press", "news", "summary"):
        return 5
    return 2 if kind == "tertiary" else 0


def describe(src):
    word = KIND_WORDS.get(src.get("kind"), "source")
    if src.get("kind") in ("journal", "thesis"):
        word += " read in full" if src.get("depth") == "full" else ", abstract only"
    return word


def plural(n, one, many=None):
    return f"{n} {one if n == 1 else (many or one + 's')}"


def score_site(site, sources, pairs):
    def src(ids):
        return [sources[i] for i in ids if i in sources]

    # the sources behind the "alike" claims and figures, in order of first use
    alike = []
    for f in site.get("figures", []):
        for i in f.get("earthSrc", []) + f.get("otherSrc", []):
            if i not in alike:
                alike.append(i)
    for c in site.get("matches", []):
        for i in c.get("src", []):
            if i not in alike:
                alike.append(i)
    grades = {i: grade(sources[i]) for i in alike if i in sources}
    parts = []

    # 1. the pairing is published
    an = site.get("analogySrc", [])
    kinds = {x.get("kind") for x in src(an)}
    if kinds & {"journal", "thesis"}:
        pts, why = 25, "A peer-reviewed paper or thesis makes this comparison."
    elif kinds & {"conference", "report", "agency", "dataset"}:
        pts, why = 15, "A conference abstract, report or agency page makes this comparison. No peer-reviewed paper that makes it is on our list."
    elif an:
        pts, why = 8, "Only news or a press release makes this comparison."
    else:
        pts, why = 0, "This pairing is our own proposal. Nothing we found makes it."
    parts.append({"k": "published", "label": "The pairing is published", "pts": pts, "max": 25, "why": why, "src": an})

    # 2. strength of the sources behind the "alike" claims
    if grades:
        avg = round(sum(grades.values()) / len(grades))
        tally = {}
        for i in grades:
            tally[describe(sources[i])] = tally.get(describe(sources[i]), 0) + 1
        listing = ", ".join(f"{n} {w}" for w, n in sorted(tally.items(), key=lambda kv: -kv[1]))
        why = f"{plural(len(grades), 'source')} back the matching claims: {listing}. Their average is {avg} of 25."
    else:
        avg, why = 0, "No source backs the matching claims."
    parts.append({"k": "sources", "label": "Strength of the sources", "pts": avg, "max": 25, "why": why, "src": list(grades)})

    # 3. how many of them are stronger than news
    strong = [i for i, g in grades.items() if g >= 15]
    pts = 15 if len(strong) >= 3 else 10 if len(strong) == 2 else 5 if len(strong) == 1 else 0
    why = f"{plural(len(strong), 'source is', 'sources are')} stronger than news or an encyclopedia." if strong else "No source stronger than news backs the matching claims."
    parts.append({"k": "count", "label": "Independent sources", "pts": pts, "max": 15, "why": why, "src": strong})

    # 4. the same quantity on both worlds
    pair = next((p for p in pairs if p.get("site") == site["id"]), None)
    measured = bool(site.get("scored") and pair and (TERRAIN / f"{pair['earth']}.json").exists() and (TERRAIN / f"{pair['other']}.json").exists())
    same = [f for f in site.get("figures", []) if f.get("same") and f.get("earthSrc") and f.get("otherSrc")]
    if measured:
        pts, why, ids = 20, "Terrain is measured by us on both worlds, on one 80 m grid.", []
    elif same:
        pts, why = 15, f"A published value for the same property on both sides: {same[0]['q'].lower()}."
        ids = [i for f in same[:1] for i in f["earthSrc"] + f["otherSrc"]]
    else:
        pts, why, ids = 0, "No property is given a value on both worlds.", []
    parts.append({"k": "quantity", "label": "Same property on both worlds", "pts": pts, "max": 20, "why": why, "src": ids})

    # 5. limits documented
    backed = [c for c in site.get("breaks", []) if c.get("src") or c.get("measured")]
    pts = 15 if len(backed) >= 2 else 8 if len(backed) == 1 else 0
    why = (f"{plural(len(backed), 'difference is', 'differences are')} backed by a source or a measurement." if backed
           else "No difference specific to this pair is backed by a source yet.")
    parts.append({"k": "limits", "label": "Limits documented", "pts": pts, "max": 15, "why": why, "src": [i for c in backed for i in c.get("src", [])]})

    total = sum(p["pts"] for p in parts)
    score, note = total, ""
    if site.get("label") == "hypothesis" and total > HYPOTHESIS_CAP:
        score = HYPOTHESIS_CAP
        note = f"The parts add up to {total}. A hypothesis is capped at {HYPOTHESIS_CAP}, because nobody has tested the pairing."
    band = next(name for floor, name in BANDS if score >= floor)
    for p in parts:
        p["src"] = list(dict.fromkeys(p["src"]))
    return {"score": score, "band": band, "note": note or f"{band}: {next(f'{f} and above' if f else 'under 35' for f, n in BANDS if n == band)}.", "parts": parts}


def main():
    D = sitesjson.load(SITES)
    before = {s["id"]: s.get("conf") for s in D["sites"]}
    for s in D["sites"]:
        s["conf"] = score_site(s, D["sources"], D["pairs"])
    stale = [s["id"] for s in D["sites"] if before[s["id"]] != s["conf"]] + (["rubric"] if D.get("confidenceRubric") != RUBRIC else [])
    D["confidenceRubric"] = RUBRIC
    if "--check" in sys.argv:
        print("out of date: " + ", ".join(stale) if stale else "scores are up to date")
        sys.exit(1 if stale else 0)
    sitesjson.save(SITES, D)
    for s in D["sites"]:
        c = s["conf"]
        print(f"{s['id']:<13} {c['score']:>3} {c['band']:<9} " + " ".join(f"{p['k'][:4]}={p['pts']}" for p in c["parts"]))


if __name__ == "__main__":
    main()
