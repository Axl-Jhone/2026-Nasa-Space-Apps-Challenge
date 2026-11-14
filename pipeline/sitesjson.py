"""Read and write web/data/sites.json in a layout that stays easy to edit by hand:
short records (a claim, a source, a matrix cell) sit on one line; everything else is indented."""
import json
from pathlib import Path


def _scalar(o):
    return o is None or isinstance(o, (str, int, float, bool))


def _flat(o):
    """True for a list of scalars, or a list of lists of scalars with at most 3 items each (e.g. a matrix cell)."""
    return isinstance(o, list) and all(_scalar(x) for x in o)


def _inline(o):
    return json.dumps(o, ensure_ascii=False, separators=(", ", ": "))


def _one_line(o):
    if _scalar(o) or _flat(o):
        return True
    if isinstance(o, dict) and len(o) <= 4 and all(_scalar(v) or _flat(v) for v in o.values()):
        return True
    return False


def _dump(o, ind):
    pad, pad2 = "  " * ind, "  " * (ind + 1)
    if _one_line(o):
        s = _inline(o)
        return "{ " + s[1:-1] + " }" if isinstance(o, dict) and o else s
    if isinstance(o, dict):
        return "{\n" + ",\n".join(f"{pad2}{json.dumps(k, ensure_ascii=False)}: {_dump(v, ind + 1)}" for k, v in o.items()) + f"\n{pad}}}"
    return "[\n" + ",\n".join(pad2 + _dump(v, ind + 1) for v in o) + f"\n{pad}]"


def load(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def save(path, D):
    text = _dump(D, 0) + "\n"
    json.loads(text)  # refuse to write anything that is not valid JSON
    Path(path).write_text(text, encoding="utf-8", newline="\n")
