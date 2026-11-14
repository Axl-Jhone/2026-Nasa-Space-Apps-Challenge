# pipeline/ (Leander; metric definitions: Mico)

| File | What |
| --- | --- |
| `earth_dem.ipynb` | Copernicus GLO-30 window for Kamestastin from Planetary Computer, reprojected to UTM 20N at 30 m, lake found, saved to `data/processed/`, exported to `web/data/terrain/kamestastin.json` |
| `moon_dem.ipynb` | LOLA `LDEM_80S_80M` window for de Gerlache, read from its label, exported to `web/data/terrain/degerlache.json` |
| `export_terrain.py` | One function for both worlds: area-averages to the shared 80 m grid, computes the metrics, writes the JSON the site reads |

Run notebooks from this folder. Raw downloads go in `../data/raw/` (git keeps only the `.LBL` label). Download the lunar file once (115 MB), saving it under the **uppercase** name the notebook opens. PDS serves it in lowercase, and Linux and Colab care about case:

```
curl -o ../data/raw/LDEM_80S_80M.IMG https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/ldem_80s_80m.img
```

For another crater or site, edit only the settings cell (centre, name, notes); the export cell reads everything from there. Rerunning always changes the `generated` date in the output file. That alone is not a change in the numbers.

Check the maths before trusting new numbers:

```
python export_terrain.py --selftest
```

Metric definitions (draft, Mico to confirm): relief = 95th minus 5th percentile height; slope from metre gradients; roughness = standard deviation of height minus its 5 × 5 cell (400 m) moving average; gentle ground = share of cells under 10°, a **placeholder** until a cited landing or traverse limit replaces it. Slopes of 40° and over are counted in the last bin (38–40°).
