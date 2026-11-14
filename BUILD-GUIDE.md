# Earth Analog Atlas: build guide

Written 14 November 2026, 3:15 pm PHT. Deadline: 15 November, 11:59 pm PHT.

**Updated 3:40 pm: the team will build with AI ("vibecoding") and wants every step explained.** The order of work, the clock and the checkpoints below still stand. What changes is who types. The AI writes the code and explains its reasoning at each step. Each lane owner directs it and checks what comes out. The questions and hints in each lane are now your checklist for that checking.

**Updated 1 am, 15 November: the repo was cleaned up and checked.** See "Where things stand". It replaces the 4:25 pm tech stack and modules.

The goal is to learn things you can reuse, and to submit one honest, working argument. When those two pull apart, cut scope. Do not cut understanding. Code you cannot explain to a judge is a risk, however fast it was written.

## What you are building

One sentence: this place on Earth is like that place on the Moon or Mars in these measured ways, and unlike it in these.

**Build**

1. One terrain pair scored with real elevation data: Kamestastin Lake crater and one lunar crater.
2. Charts for that pair: slope distribution, relief, roughness, both sides on one grid.
3. A map and a page for each of the ten candidates, with cited claims and where the analogy breaks.
4. The negative result (nothing on Earth matches the lunar south pole's cold, lighting or volatiles) and the limits every pair shares (gravity, vacuum, thin atmosphere, radiation).
5. A method and sources page.
6. For every candidate, a rating on each analogy dimension and a list of the base operations it could rehearse (see "The parameters" below).

**Do not build:** globes, 3D terrain, a scrolled story, radar, the weather API.

**Only if ahead at 2 pm tomorrow:** a compare slider of the two shaded-relief images, a second scored pair, or one temperature chart that puts lunar cold-trap temperatures next to the coldest Earth site.

The mock-up (`earth-analog-atlas.html`) shows what the screens could look like. Its layout and code can be reused. Its scores and terrain are fake and must not ship.

## The parameters

Added by the team on 14 November. Two lists, and a rule that connects them.

### List 1: analogy dimensions (what the place is like)

Your six, plus two the plan already depends on.

| Dimension | What a match means |
| --- | --- |
| Geology or minerals | The rock or mineral is the same kind as at the counterpart |
| Extreme temperatures | The site reaches, or buffers, temperatures like the counterpart's |
| Unusual illumination | Lighting like the counterpart's: very low sun, long shadows, long darkness |
| Ice | Ice that is buried or reachable in a similar way |
| Permafrost | Ground that stays frozen |
| Dust processes | Wind lifting or moving dust and sand in a similar way |
| Terrain (kept from the plan) | Relief, slope and roughness. The only dimension measured the same way on all three worlds, so the only one scored |
| Subsurface (kept from the plan) | Caves and lava tubes. Umm Jirsan needs this one |

### List 2: base operations (what you could rehearse there)

Landing, navigation, mobility, robotics, construction, resource utilization, other human operations.

### The rule that connects them

An operation can be rehearsed at a site only on the dimensions that site matches. Write the rule down once as data, and let the code apply it to every site. Do not hand-write the operations for each site.

| Operation | Depends on these dimensions |
| --- | --- |
| Landing | Terrain, dust processes, illumination |
| Navigation | Illumination, terrain |
| Mobility | Terrain, geology (how the ground carries weight), dust, ice and permafrost |
| Robotics | Extreme temperatures, dust, illumination |
| Construction | Geology (the building material), extreme temperatures, permafrost, subsurface |
| Resource utilization | Ice, permafrost, minerals |
| Other human operations | Extreme temperatures, subsurface (shelter), illumination |

This table is our own reasoning, not a published standard. Prince and Mico should challenge every row, change what is wrong, and add a source where one exists. Say on the method page that it is the team's framework.

The result for each site reads like this: "Mobility: can be rehearsed on slopes. Cannot be rehearsed for lunar dust or lunar cold." The second sentence matters as much as the first. It is what the challenge means by showing where an analogy breaks.

### Each rating carries its evidence level

| Level | Meaning |
| --- | --- |
| Measured | The same quantity, from data, on both worlds. Today that is terrain only |
| Cited | A published source says so. The source link is required |
| Hypothesis | Plausible, proposed by us, not published |
| Breaks | Known not to match. Say why |
| Not assessed | Nobody on the team has checked. This is an allowed answer |

No rating without a source or the words "not assessed". An empty cell filled by a guess is the fastest way to lose a judge's trust.

### Where the ten candidates stand today

Taken only from the plan's cited evidence. Everything else is "not assessed" until Prince checks it.

| Site | Matches | Breaks | Operations with a cited use |
| --- | --- | --- | --- |
| Galena Creek (Mars) | Ice: cited. Terrain: to be measured | | Resource utilization: how reachable buried water is |
| Sittampundi (Moon) | Geology: cited | Temperatures, illumination, ice | Landing and mobility: bulk material for landing and rover tests |
| Kamestastin (Moon) | Geology: cited. Terrain: to be measured | Temperatures, illumination | Other human operations: crew geology training. Navigation: traverse planning |
| Umm Jirsan (Moon) | Subsurface: hypothesis. Temperatures: hypothesis, no measurements found | | Robotics and navigation: cave mapping, radio relay. Other human operations: skylight entry, shelter |
| Great Kobuk (Mars) | Dust processes (wind-driven sand): cited. Permafrost: cited in part | Ice: liquid water persists under the dunes | Mobility: driving on frozen sand |
| Bodélé (Mars) | Dust processes: hypothesis | | Other human operations: dust-storm forecasting |
| Lake Salda (Mars) | Minerals: cited | | Science, not base operations |
| Matanomadh (Mars) | Minerals: cited | | Not assessed |
| Azerbaijan mud volcanoes (Mars) | Geology (landform): cited | | Not assessed |
| Makgadikgadi (Mars) | Minerals: cited, preliminary | | Not assessed |

Two things this table shows, which you should say openly in the submission:

- **Extreme temperatures and unusual illumination have no match for the Moon.** The plan looked and found no natural Earth site that reproduces the south pole's cold or lighting. Those columns will be mostly "breaks". That is a real result. If Prince wants a candidate for illumination, it has to be found and sourced tonight.
- **Most of the list is Mars, and "operating a lunar base" is about the Moon.** Only three candidates are lunar. Apply the operations list to both worlds, and call it exploration operations where the site is a Mars analog.

## Who owns what

Suggested. Swap if it suits you better, but every lane needs one named owner.

| Lane | Owner | Works closely with |
| --- | --- | --- |
| A. Science case | Prince | Axl (who needs your text) |
| B. Data pipeline | Leander | Mico (who defines what you compute) |
| C. Similarity score | Mico | Leander |
| D. The app | Axl | Prince |

## Where things stand (15 November, 1 am)

The team built a different app from the 4:25 pm plan, and it works, so the plan now follows the repo. The React app, the `contract/` folder and the `content/`, `score/` and `app/` modules were removed.

| Part | What exists | Owner |
| --- | --- | --- |
| App | `web/`: a static site, no build step. Tabs: Three worlds, Planets, Side by side. Formats in `web/README.md` | Axl |
| Site text | `web/data/sites.json`: nine sites, the analogy matrix (codes M, C, P, B, N), planets, pairs, controls | Prince |
| Earth window | `pipeline/earth_dem.ipynb`: Kamestastin, Copernicus GLO-30, UTM 20N at 30 m, lake masked | Leander |
| Moon window | `pipeline/moon_dem.ipynb`: de Gerlache, LOLA `LDEM_80S_80M`, every number from the label | Leander |
| Measures | `pipeline/export_terrain.py`: both windows on one 80 m grid; relief, median and steep-end slope, roughness, gentle-ground share, slope histogram. `--selftest` checks the maths | Leander, Mico |

**Checked on 15 November, 1 am:** both notebooks were rerun from a clean start. Every height, lake-mask cell, histogram bin and measure matched the committed terrain files. Only the `generated` date differs, and it changes on every rerun. The self-test passes.

**Decisions the team made that differ from the plan:**

- **No combined score.** Each measure is shown on its own with a plain Moon ÷ Earth ratio. Step C2's single number is dropped. The controls in C4 (crater against crater, crater against a flat lake bed and a dune field) still matter, and are still "pending" on the page.
- **Eight matrix dimensions, not the eight in "The parameters".** The page uses geology, terrain, temperature and light, water/ice/resources, dust, biology, subsurface and operations. Illumination is folded into temperature, permafrost into ice, and the seven base operations into one "operations" row measured as gentle-ground share.

**Still open before Checkpoint B (2 am):**

1. A public URL. Axl turns on GitHub Pages: Settings → Pages → Source: GitHub Actions. The workflow in `.github/workflows/pages.yml` then publishes `web/` on every push to `main`.
2. The 10° gentle-slope limit is a placeholder. It needs a cited landing or traverse limit (Prince or Mico).
3. The de Gerlache and Kamestastin centres are provisional (A2).
4. The Shackleton pair has no export yet, so its terrain is tagged SAMPLE. Rerun `moon_dem.ipynb` with Shackleton's name, centre and source notes in the settings cell.
5. The controls (C4).

## Overnight build (15 November, 2 am)

Built with the AI assistant while the team slept. Nothing here is checked by a person yet: the list at the end says who checks what.

**What changed**

- **Name.** The masthead now reads ATLAS.
- **Pair pages** (`#pair/<site id>`): label (benchmark, established, hypothesis), confidence, what matches with a source link per claim, cited figures on both worlds, and an orange "where it breaks" block that ends with the limits no Earth site can reproduce.
- **All pairs** tab: every site against the eight dimensions in one table. It replaces the planned map.
- **Method and sources** tab: how terrain is measured, the controls, the source-check result, credits, the AI-use statement and all 51 sources.
- **Sites.** The plan's ten are back (Matanomadh, Azerbaijan mud volcanoes and Makgadikgadi added; Bodélé visible). Río Tinto and Yungay stay, marked as team additions.
- **Slope limit.** 8°, the Human Landing System tilt threshold, replaces the 10° placeholder. Kamestastin is 83% gentle ground; de Gerlache is 26%.
- **Shackleton** has a real export. No SAMPLE terrain is left on the site.
- **Controls** are run. Two lunar craters measure alike; a flat lake bed is clearly different; a dune field is **not** separated from Kamestastin. The site reports that as a finding.
- **Coordinates** now carry a source or a note saying they are approximate.
- `pipeline/run_notebook.py` reruns a notebook's own cells for another site. `SUBMISSION.md` holds drafts for the form and the demo script.
- **Theme (3 am).** An ASCII square space look: one monospace face, square corners, a character starfield, and globes drawn as ASCII characters from the NASA imagery, with an ASCII / Image switch in the masthead. It lives in `web/css/theme-ascii.css` and `web/js/ascii.js`; removing the stylesheet link in `index.html` returns the previous look. A line above the globes now says what the site argues and links to Galena Creek.

**Who checks what before the 5 pm freeze**

| Who | Check | Time |
| --- | --- | --- |
| Prince | Read every pair page against its sources. Open the primary paper for Galena Creek (Petersen 2020) and Kamestastin. Read `SUBMISSION.md` | 2 h |
| Mico | Method tab: the metric definitions, the 8° limit and its caveat, the wording of the control results | 45 min |
| Leander | Rerun one window with `run_notebook.py` and confirm the numbers match the site. Decide whether the control window positions are sensible | 45 min |
| Axl | Click through every tab on a phone and on a second laptop. Record the 30-second demo from the script | 1.5 h |
| Everyone | Read the "Use of AI" text on the Method tab and in `SUBMISSION.md`. It must describe what actually happened | 15 min |

## The clock

| When (PHT) | What | You are done when |
| --- | --- | --- |
| Sat 3:30 to 4:30 pm | Step 0, all four together | The repo exists and Axl has a fake data file |
| Sat 4:30 to 8:30 pm | Step 1 in every lane: remove the risk | **Checkpoint A, 8:30 pm:** an Earth crop and a Moon crop both show as images |
| Sat 8:30 pm to Sun 2:00 am | Step 2 in every lane: real numbers | **Checkpoint B, 2:00 am:** one pair works end to end on a public URL, however ugly |
| Sun 2:00 to 8:00 am | Sleep | You slept |
| Sun 8:00 am to 2:00 pm | Step 3: the other candidates, method page | Everything in the Build list exists |
| Sun 2:00 to 5:00 pm | Fix, polish, or the "only if ahead" items | |
| Sun 5:00 pm | **Feature freeze.** No new features after this | |
| Sun 5:00 to 9:00 pm | Step 4: description, demo, credits | |
| Sun 9:00 pm | **Submit.** | Three hours of slack remain for upload trouble |

**If you miss a checkpoint**

- Missed A because the Moon data will not load: Leander keeps trying for one more hour with a coarser file. Meanwhile score Kamestastin against a second Earth crater, so lanes C and D are not blocked.
- Missed B: stop adding. Drop the map and ship the one pair page plus the method page.
- Never trade sleep for a feature. Tired people break working code.

---

## Step 0. Agree, together (one hour)

1. **Read the submission requirements now**, not tomorrow night. Write down exactly what the form asks for (description, demo format, repository link, anything about AI tools). Put the list in the repo.
2. **Repository set up.** Done. The layout is under "Where things stand".
3. **Agree the data format.** Done in practice: the format the site reads is in `web/README.md`, and `export_terrain.py` writes it.

The format had to answer these questions. They are kept here because they still make a good checklist.

- Which Earth site, where, and what box around it?
- Which counterpart, on which body, where?
- Which dimension of analogy? What label (benchmark, established, hypothesis)? What confidence?
- What matches? Each claim with its source link.
- Where does it break? Each point with its source link if it has one.
- How does it rate on each analogy dimension, at what evidence level, and from which source? (See "The parameters". The operations are not stored per site. The code works them out from the ratings and the rule table.)
- If terrain was scored: at what grid size, what relief, slope distribution and roughness on each side, and what score with its three parts? If not scored, how does the record say so?

Why this matters: once the shape is fixed, Axl builds against the fake file while Leander and Mico produce the real one. Nobody waits for anybody. This is called working contract-first, and it is how teams build in parallel everywhere.

<details><summary>Hint: the trap in the contract</summary>

A slope distribution is a list of numbers. The app cannot draw it without knowing the bin edges. Put the bin edges in the record, and use the same bins on both sides.
</details>

---

## Lane A. Science case (Prince)

### A1. Verify the scored pair first

Open the sources behind the Kamestastin claims in the plan: 28 km wide, about 36 million years old, formed in anorthosite. For each, find a primary source (a paper or a database, not a news page) and note whether the number holds.

Done when: each claim has a source you opened yourself, or is struck out.

### A2. Pin the site down

Get the crater's centre coordinates from a primary source. Then work out the box for a 40 km window around it.

Question to answer: how many degrees of latitude is 40 km? How many degrees of longitude is 40 km at 56°N, and why is that a different number?

<details><summary>Hint</summary>

One degree of latitude is about 111 km everywhere on Earth. A degree of longitude shrinks with the cosine of the latitude.
</details>

### A3. Choose the lunar crater

Pick the counterpart and write down why. Criteria to weigh: similar diameter, highland terrain, relevance to the Artemis regions, and whether Leander can get data for it.

Question to answer: the plan says "an Artemis-region crater rim". A crater exactly at the pole is the most relevant and the hardest to handle in the data. Is that worth it?

<details><summary>Hint: a place to start</summary>

Shackleton sits at the south pole and is roughly 21 km across. De Gerlache is nearby and larger. Check their sizes yourself, and tell Leander the latitude and longitude of your choice early. Step B3 depends on it.
</details>

### A4. Verify and write the other nine

For each remaining candidate, in the plan's order: open the primary source, confirm or correct the claim, and write "what matches" and "where it breaks" in your own words. Hand the text to Axl in the agreed JSON shape.

Two candidates are labelled hypothesis (Umm Jirsan and Bodélé). Before calling either new, search for it together with "Mars" or "lunar". If someone already published it, change the label.

Done when: all ten records have verified text. If time runs short, verify the seven chosen pairs and mark the other three "not verified by us".

**What you learn that transfers:** telling a primary source from a retelling, and stating a claim no more strongly than its evidence.

---

## Lane B. Data pipeline (Leander)

Work in Python. B1 and B2 are done in `pipeline/earth_dem.ipynb`, B3 in `pipeline/moon_dem.ipynb`, and B4 and B5 in `pipeline/export_terrain.py`.

### B1. Get one Earth crop on screen

Use the Microsoft Planetary Computer. Its catalogue has the Copernicus 30 m elevation model (collection `cop-dem-glo-30`) and needs no account. Search it for Prince's box, read just that window, and plot it.

Done when: you see a round lake in a crater.

Questions to answer before moving on:

- What coordinate system is the file in? What are its units?
- How many metres is one pixel north to south? East to west? Why are they different?
- What does this elevation model record over a lake, and over forest? (This belongs on the "where it breaks" list. Tell Prince.)

<details><summary>Hint: finding the data</summary>

The catalogue speaks a standard called STAC. There is a Python client for STAC, and a small official Planetary Computer package that signs the download links. Search the Planetary Computer documentation for "reading DEM data".
</details>

<details><summary>Hint: reading only a window</summary>

These files are cloud-optimised. The raster library you use can read a window by bounds without downloading the whole tile.
</details>

### B2. Make the pixels square, in metres

Slope is rise over run. If the run is in degrees and differs by direction, the slope is wrong. Reproject the crop to a local projection in metres, centred on the site.

Done when: the pixel size is the same number of metres in both directions, and the crater looks round, not squashed.

### B3. Get one Moon crop on screen

This is the riskiest step of the whole project. Start it before dinner.

The official Resources list points to the Lunar Reconnaissance Orbiter archive. Its LOLA instrument's gridded elevation files for the south pole are here:

`https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/`

The file names tell you the coverage and the pixel size. For example `ldem_80s_80m` runs from 80°S to the pole at 80 m per pixel. Each product is two files: an `.img` with the numbers and a `.lbl` text file that describes them.

Questions to answer before downloading anything:

- How many kilometres is one degree of latitude on the Moon? (Its radius is 1,737.4 km.)
- Which file covers Prince's crater? Which is the smallest one that still puts at least 100 pixels across it?
- Roughly how big is that file? Work it out from the coverage, the pixel size and 2 bytes per pixel.

Then open the `.lbl` in a text editor and read it. Find the number of lines and samples, the data type, the projection, and two values called the scaling factor and the offset.

Done when: you see craters, and the south pole is where you expect it in the image.

<details><summary>Hint: opening the file</summary>

Your raster library is built on GDAL, and GDAL knows this label format. Try opening the `.lbl` file, not the `.img`.
</details>

<details><summary>Hint: if that fails</summary>

The `.img` is nothing but numbers, row after row. The label tells you how many rows, how many per row, and what type. NumPy can read a file like that directly. This fallback is about ten lines and teaches you what a raster really is.
</details>

<details><summary>Hint: the numbers look wrong</summary>

The stored integers are not metres. Apply the scaling factor from the label. The result is height relative to a reference sphere, not relative to sea level, because the Moon has no sea.
</details>

<details><summary>Hint: finding your crater in the image</summary>

In a polar stereographic file the pole is at the image centre. Distance from the centre is proportional to distance from the pole, close enough near the pole. Longitude is the angle around the centre. Work out where your crater should be before you look.
</details>

### B4. Put both sides on one grid

Cut the same window size on both sides (40 km). Resample both to the same pixel size, the coarser of the two or coarser still.

Question to answer: compute the mean slope of the Earth crop at 30 m, 100 m and 300 m. What happens, and why? This is why the plan says a pair is only comparable at one resolution.

### B5. Compute what Mico defines, and write the file

Compute relief, the slope distribution and roughness exactly as Mico specifies in C1. Write the real JSON record in the agreed shape. Also save one shaded-relief image per side, lit from the same direction and height, with the same vertical exaggeration.

Done when: Axl swaps the fake file for yours and the page still works.

<details><summary>Hint: shaded relief</summary>

The plotting library you already have includes a light-source tool for hillshading. Use the same settings for both images and write the settings down. The app must print them.
</details>

### B6. One more Earth crop, for the test

Mico needs a site that should *not* match a crater, such as a dune field or a flat lake bed. Cut one. It reuses B1 and B2.

**What you learn that transfers:** raster data, coordinate systems and projections, reading only what you need from cloud files, and writing a pipeline someone else can rerun. All of it applies to satellite imagery, maps, and any gridded data.

---

## Lane C. Similarity score (Mico)

### C1. Define three measurements

For relief, slope and roughness, write one sentence and one formula each. Hand them to Leander before 6 pm.

Questions to answer:

- Relief as maximum minus minimum is ruined by one bad pixel. What is a sturdier definition?
- Slope comes from the gradient of elevation. What is the formula from the two partial derivatives to an angle?
- There are several definitions of roughness. Pick one and say what length scale it measures. Does a tilted but perfectly smooth plane count as rough under your definition? Should it?

### C2. Turn two measurements into a similarity

For each of the three, define a number from 0 (nothing alike) to 1 (identical). Slope is a distribution, not a single number, so it needs a way to compare two histograms.

<details><summary>Hint: comparing two histograms</summary>

Two simple options. Overlap: normalise both to sum to 1, take the smaller value in each bin, and add them up. Or the "earth mover's distance", which asks how much you must shift one histogram to get the other. Think about which one treats 5° versus 6° as closer than 5° versus 30°.
</details>

Then decide how the three combine into one overall number.

Question to answer: why is a plain average more defensible here than weights you tuned? What would you need in order to justify weights?

### C3. Test it on shapes with known answers

Before any real data, make small artificial surfaces and predict the score first, then compute it.

- A surface against itself. Expected: 1.
- A flat plane against a rough surface. Expected: low.
- A surface against the same surface with heights doubled. What should happen to each part?
- A surface against the same surface resampled coarser. What does this tell you about B4?

Done when: every prediction matches, or you understand why it did not.

### C4. Test it on real places

The plan requires this: run the score on a pair that should match (crater against crater) and a pair that should not (crater against Leander's dune field or lake bed). Confirm the score separates them, and put both results on the method page.

If it does not separate them, that is a finding. Say so, and say what you would change.

### C5. Write the limits

Write the "what Earth cannot reproduce" strip with real numbers and sources: surface gravity of the Moon and Mars, surface pressure on Mars, and the radiation environment. Add what the elevation data itself cannot see, from B1.

**What you learn that transfers:** turning a physical idea into a measurable quantity, testing a metric before trusting it, and knowing what a number does not say. This is the core of any data analysis.

---

## Lane D. The app (Axl)

The app is `web/`, a static site with no build step (see "Where things stand"). The data argument matters more than any tool.

### D1. A page that reads the fake file

One page that loads the fake JSON and prints the site name and its claims as text.

Done when: changing the file changes the page.

### D2. Put it on a public URL today

Deploy that bare page before Checkpoint A. GitHub Pages is free and needs no card. Deploying early turns the last-hour deploy panic into a non-event.

<details><summary>Hint: blank page after deploying</summary>

If it works locally and shows a blank page online, the page is looking for its files at the wrong path. Search your build tool's documentation for the "base" path setting.
</details>

### D3. The pair page

Lay out one pair: both names, the label, the confidence, what matches with source links, and a "where it breaks" block that looks different from everything else. Then the fixed strip of limits from C5.

### D4. The charts

Two charts from the record: the slope distribution as two lines on shared axes, and the score as an overall bar above its three parts.

Rules that make a chart honest. Check each one:

- Both sides share the same axes and bins.
- Axes are labelled with units.
- The grid size is printed next to the chart.
- The overall score never appears without its three parts.
- The two colours are distinguishable, and each line is also labelled in words.

### D5. The two shaded-relief images

Show Leander's two images side by side at the same size, with a scale bar and the light settings printed underneath.

### D6. The map of all ten

A map with a pin per candidate. Clicking a pin opens its page. The current site uses textured globes instead, which does the same job.

<details><summary>Hint: a flat map without a library</summary>

You do not need a map library. On a plain world image in equirectangular projection, a pin's horizontal position is (longitude + 180) / 360 of the width, and its vertical position is (90 − latitude) / 180 of the height.
</details>

### D7. Method and sources page

How the score works (from Mico), the test results from C4, every dataset with its link, and the credits. Copy the required credit wording from each dataset's own page.

**What you learn that transfers:** building an interface from a data contract, deploying early, and drawing charts that make an argument instead of decoration.

---

## Step 4. Freeze and submit (Sunday 5 pm onward)

1. Click through the public URL on a phone and on a laptop that is not yours.
2. Write the project description. Answer the challenge's own questions: which analog, what makes it analogous, where it breaks down, how it helps exploration, which data you used.
3. Make the demo in the format the form asks for.
4. Credits: NASA as the source with no endorsement implied, the Copernicus notice, and the LOLA data citation.
5. Declare your use of AI tools as the rules require. The plan's research and the mock-up came from an AI assistant. Say so, and say what you verified and built yourselves.
6. Submit by 9 pm. Then stop.

## Building with AI and still learning

Fast code teaches nothing by itself. This loop is how you get both.

1. **Ask for one small step**, not the whole app. "Load the Earth crop and plot it" is a step. "Build the pipeline" is not.
2. **Before any code, ask for the plan and the reasoning:** what it will do, why this way, what could go wrong.
3. **Let it build**, then ask it to walk through what it wrote.
4. **Check it yourself.** Each lane's "done when" and questions are the checks. The AI can be confidently wrong, most of all about facts and numbers.
5. **Change one thing by hand.** If you can change it and predict the result, you understand it.
6. **Write two lines in a build log:** what was asked, what was decided and why. You will need this for the AI disclosure, and it is your notes for next time.

What each person must verify personally, because nobody else can:

- **Prince:** every scientific claim against a primary source. An AI will write a plausible citation that does not exist.
- **Mico:** the score on shapes with known answers (C3), before trusting it on real data.
- **Leander:** that the pipeline's numbers have the right units and scale (B1 to B4).
- **Axl:** that every chart follows the rules in D4.

At each checkpoint, report where every lane stands and we decide together what to cut.

Good questions look like this:

- "My Moon crop is all values near 30,000. What am I missing?"
- "Our score gives 0.9 for a crater against a dune field. Is the metric wrong or the test?"
- "We are an hour behind at Checkpoint A. What do we drop?"
