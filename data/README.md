# data/

What the app reads. Written by `content/build.py` and `pipeline/export.py`; do not hand-edit.

Right now every file here is a FAKE copy of the contract samples, so the app can be built before the real data exists. Each fake record has `"fake": true`, and the app must show a FAKE banner for it.

| File | Written by |
| --- | --- |
| `sites.json`, `sources.json`, `rules.json`, `limits.json` | `content/build.py` |
| `terrain/<pair>.json` | `pipeline/export.py` |
| `img/*.png` | `pipeline/hillshade.py` |
