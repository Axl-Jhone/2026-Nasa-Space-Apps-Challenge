"""Opening figure: turn the public-domain photograph of the Farnese Atlas into a grid of characters.

    python -I pipeline/atlas_art.py path/to/atlas.png

Source: "Atlas, in the National Museum of Naples", photograph by Giacomo Brogi, reproduced in W. T. Olcott,
Star Lore of All Ages (1911). Public domain. Wikimedia Commons:
https://commons.wikimedia.org/wiki/File:Star_Lore_Of_All_Ages_(1911),_0125,_Atlas.png

Brightness picks the character, as for the globes: the dark background becomes spaces, the marble becomes ink.
Only the character grid is written to the site (web/js/atlas-art.js); the photograph itself is not published.
"""
import sys
from pathlib import Path

from PIL import Image, ImageOps

RAMP = " .:-=+*#%@"
COLS = 60
CELL_ASPECT = 0.59          # a character cell is this wide for its height (IBM Plex Mono, line-height 1.02)
CROP = (0.045, 0.03, 0.955, 0.97)   # trim the printed border of the plate (fractions of width and height)
BLACK, WHITE = 70, 235      # brightness at or below BLACK is background; at or above WHITE is the densest character


def main(path):
    im = Image.open(path).convert("L")
    w, h = im.size
    im = im.crop((int(CROP[0] * w), int(CROP[1] * h), int(CROP[2] * w), int(CROP[3] * h)))
    rows = round(COLS * im.height / im.width * CELL_ASPECT)
    im = ImageOps.autocontrast(im.resize((COLS, rows), Image.LANCZOS), cutoff=1)
    px = im.load()
    lines = []
    for j in range(rows):
        s = ""
        for i in range(COLS):
            t = (px[i, j] - BLACK) / (WHITE - BLACK)
            s += RAMP[max(0, min(len(RAMP) - 1, round(t * (len(RAMP) - 1))))]
        lines.append(s.rstrip().ljust(COLS))
    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()
    out = Path(__file__).resolve().parent.parent / "web" / "js" / "atlas-art.js"
    body = ",\n".join("  '" + l.replace("\\", "\\\\").replace("'", "\\'") + "'" for l in lines)
    out.write_text("// Written by pipeline/atlas_art.py from the public-domain Brogi photograph of the Farnese Atlas. Do not hand-edit.\n"
                   f"export const ATLAS_ART = [\n{body},\n];\n", encoding="utf-8", newline="\n")
    print("\n".join(lines))
    print(f"{len(lines)} rows x {COLS} columns -> {out}")


if __name__ == "__main__":
    main(sys.argv[1])
