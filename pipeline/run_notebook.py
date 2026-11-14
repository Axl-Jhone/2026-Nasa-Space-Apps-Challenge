"""Run a window notebook from the command line, with different site settings.

It executes the notebook's own code cells, unchanged, after swapping the values in settings
lines such as `SITE_NAME = ...`. Nothing is re-implemented here, so a window cut this way is
measured exactly as in the notebook. Used for the Shackleton window and the control windows.

    cd pipeline
    python run_notebook.py moon_dem.ipynb SITE_NAME=Shackleton CENTRE_LAT=-89.67 CENTRE_LON=129.78

Values that look like numbers are passed as numbers; everything else as text.
"""
import json
import os
import re
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")   # draw plots to memory and discard them: no windows pop up


def literal(text):
    """'-89.67' -> -89.67 (a number); 'Shackleton' -> "'Shackleton'" (quoted text)."""
    try:
        float(text)
        return text
    except ValueError:
        return repr(text)


def run(nb_name, overrides):
    here = Path(__file__).resolve().parent
    os.chdir(here)                       # the notebooks expect to run from pipeline/
    sys.path.insert(0, str(here))        # so `from export_terrain import ...` works
    cells = ["".join(c["source"]) for c in json.loads((here / nb_name).read_text(encoding="utf-8"))["cells"] if c["cell_type"] == "code"]

    # Stop before running anything if a setting name is not in the notebook (a typo would otherwise be ignored silently)
    pattern = {name: re.compile(rf"(?m)^{re.escape(name)}\s*=.*$") for name in overrides}
    missing = [name for name, p in pattern.items() if not any(p.search(src) for src in cells)]
    if missing:
        raise SystemExit(f"settings not found in {nb_name}: {missing}")

    namespace = {"__name__": "__main__"}
    for src in cells:
        for name, value in overrides.items():
            src = pattern[name].sub(lambda m, n=name, v=value: f"{n} = {literal(v)}", src)
        exec(compile(src, nb_name, "exec"), namespace)


if __name__ == "__main__":
    if len(sys.argv) < 2 or not all("=" in a for a in sys.argv[2:]):
        raise SystemExit(__doc__)
    run(sys.argv[1], dict(a.split("=", 1) for a in sys.argv[2:]))
