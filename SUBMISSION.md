# ATLAS: submission pack

Drafts for the NASA Space Apps project form. Written 15 November 2026 from the app as it stands; **every draft needs a team member's read before it is pasted**.

Checked on the official Project Submission Guide (dated 13 November 2026):

- The form closes **Sunday 15 November, 11:59 pm**, local event time. Late saves are not judged.
- The guide gives **no word or character limit** for any field. Everything must be in English.
- The demo is **either** a video of 30 seconds or less **or** a deck of up to 7 slides. Going over either limit makes the project ineligible for Global Judging. Host it somewhere public with no login (YouTube, Google Drive, GitHub).
- The form calls AI "Super Intelligence (SI)". That field is the AI-use declaration.
- Judges score Impact, Creativity, Validity, Relevance and Presentation, each from 1 to 5.

Sources: https://www.spaceappschallenge.org/resources/project-submission-guide/ and https://www.spaceappschallenge.org/resources/judging-awards-guide/

## Project Name

ATLAS: Earth Analog Atlas

## High-Level Project Summary

ATLAS is a web atlas of twelve Earth sites that stand in for places or processes on the Moon and Mars. For each pair it argues one thing: this place is like that one in these ways, and unlike it in these.

Terrain is the only property we could measure the same way on both worlds with open data, so it is the only one we measure, using NASA's LRO LOLA elevation for the Moon and Copernicus DEM for Earth on one 80 m grid. Everything else is shown as cited evidence, with a link to its source beside each claim. Every pair is labelled benchmark, established or hypothesis, and every pair page ends on where the analogy breaks.

That matters because an analog site is only useful for training crews and testing hardware if its limits are known.

## Link to Project Demo

(the 30-second video; script below)

## Link to Final Project

https://axl-jhone.github.io/2026-Nasa-Space-Apps-Challenge/

Repository: https://github.com/Axl-Jhone/2026-Nasa-Space-Apps-Challenge

## Detailed Project Description

**What it does.** ATLAS shows twelve Earth analog sites on rotatable globes of Earth, the Moon and Mars. One table compares all of them across eight dimensions: geology, terrain, temperature and light, water and ice, dust, biology, subsurface, and operations. Each pair has its own page with what matches (one source link per claim), the published figures on both worlds, how the site could help exploration, and an orange "where it breaks" block. Three pairs are for the Moon and nine are for Mars.

**The lead Mars pair** is the Galena Creek rock glacier in Wyoming and the debris-covered ice of Deuteronilus Mensae. Published work estimates the Galena Creek ice at 80 to 95% pure under 1 to 1.5 m of debris, and orbital radar puts the Martian debris aprons above 80% water ice. It breaks in two places: the Earth figure is inferred from flow speed, not from cores, and the debris thickness on Mars, which decides how reachable the water is, is not verified.

**The measured pair** is the Kamestastin Lake impact structure in Labrador and de Gerlache crater near the lunar south pole. They share anorthosite, the rock of the lunar highlands, and astronauts have trained at Kamestastin. But on the same 80 m grid de Gerlache has 3,088 m of relief against 216 m, and a median slope of 12.5° against 3.7°. The terrain does not match, and the site says so.

**How it works.** A Python pipeline cuts a 40 km window from Copernicus DEM GLO-30 and from NASA's LRO LOLA polar elevation grid, brings both onto one 80 m grid, and computes relief, slope, roughness, and the share of ground under 8°, the tilt NASA's Human Landing System must tolerate. There is no combined score: each measure is shown on its own. We tested the measures on controls. Two lunar craters measure alike and a flat lake bed is clearly different, but a dune field is not separated from Kamestastin. That showed us the measures capture how rugged the ground is, not its shape, and the site reports it.

**The negative result.** We found no Earth site that reproduces the cold, the lighting or the volatiles of the lunar south pole. The Moon candidates match rock and caves only.

**What is new and what is not.** Two pairings are our own hypotheses and are labelled as such: the Umm Jirsan lava tube for lunar pits, and the Bodélé Depression for dust lifting on Mars. The rest are established or benchmark analogs. A method page lists every source and how much of it was read.

**Tools.** Static HTML, CSS and JavaScript with no framework and no build step; Python with NumPy, Rasterio and PyProj; Microsoft Planetary Computer for the Earth elevation; GitHub Pages for hosting.

## Use of Super Intelligence (SI)

> Check this against what actually happened before pasting. The guide also says SI "should not be used to (come up with your idea of how to solve the challenge)", so say plainly which ideas were the team's.

Yes. We used Claude (by Anthropic), a large language model, as a research and coding assistant. It searched and summarised the literature for candidate analog sites, checked 416 research claims against the sources they cited, drafted the site's text, and wrote most of the code for the terrain pipeline and the website. The team directed the work.

No image, video or audio in the project is AI-generated: the globes are NASA imagery and the terrain views are drawn from elevation data. The site acknowledges the AI use on its Method and sources page, in the page metadata and in the code comments. Because an AI assistant can state a wrong fact with confidence, every claim on the site links to its source and the source list says how much of each source was read.

## NASA Data

- LRO LOLA gridded elevation, product LDEM_80S_80M (NASA Planetary Data System, data set LRO-L-LOLA-4-GDR-V1.0). The Moon side of every terrain measure. https://pds-geosciences.wustl.edu/missions/lro/lola.htm
- NASA GIBS, Blue Marble imagery, for the Earth globe. https://nasa-gibs.github.io/gibs-api-docs/
- LRO WAC global mosaic and the Mars Viking Colorized Global Mosaic, through NASA Trek, for the Moon and Mars globes. https://trek.nasa.gov/
- NASA Planetary Fact Sheets, for gravity, pressure and temperature figures. https://nssdc.gsfc.nasa.gov/planetary/factsheet/
- IAU and USGS Gazetteer of Planetary Nomenclature, and the LROC lunar pits list, for coordinates.
- NASA and JPL pages cited as evidence: lunar pit temperatures (LRO Diviner), Artemis III landing regions, Mars ice mapping, the Human Landing System requirements paper on NTRS.

## Space Agency Partner Data and Other References

- Copernicus DEM GLO-30 (European Union and ESA Copernicus programme), read through Microsoft Planetary Computer. The Earth side of every terrain measure. https://doi.org/10.5270/ESA-c5d3d65
- ISRO results cited as evidence: the Chandrayaan-3 soil analysis and the LSS-ISAC-1 lunar soil simulant.
- Typeface: IBM Plex Mono (SIL Open Font License), served by Google Fonts.
- No third-party JavaScript library is used.
- Full source list: the Method and sources tab of the app, and the list at the end of this file.

## 30-second demo script

The video must be **30 seconds or less**. Aim for 28. Record at 1366 by 768 or larger, in a browser window with no bookmarks bar.

| Time | On screen | Voice-over |
| --- | --- | --- |
| 0:00 to 0:04 | Three worlds tab, globes in ASCII view. Title text over it: team name, the challenge name, "ATLAS". Click **Mars** so the Mars globe shows | "ATLAS asks of every Earth analog: where does it hold, and where does it break?" |
| 0:04 to 0:09 | Click **Start with Galena Creek** above the globes | "Galena Creek, Wyoming, stands in for the buried ice of Deuteronilus Mensae on Mars." |
| 0:09 to 0:17 | The pair page. Scroll to the two-column figures table and hover a source link | "Both are ice under rock debris: eighty to ninety-five percent pure here, over eighty percent there." Caption: every number links to its source |
| 0:17 to 0:27 | Scroll to the orange **Where it breaks** block and hold | "Here it breaks. The Earth figure comes from flow speed, not cores. Debris thickness on Mars is unverified. And no Earth site has Mars's gravity, air or radiation." |
| 0:27 to 0:29 | End card: "ATLAS. Where Earth stands in, and where it stops." and the URL | (silence) |

The voice-over is 73 words. Read it once against a timer before recording. If it runs long, cut the caption hover, not the last line: the video has to end on where it breaks.

If nobody speaks on the video, put the same lines on screen as English captions.

## Source list (for the references field)

Generated from `web/data/sites.json`. Ids match the small links beside each claim in the app.

- S1. NASA, Artemis III landing regions update. https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/
- S2. NASA, Moon Base: Blue Moon Mark 1 flight. https://www.nasa.gov/event/clps-flight-blue-origins-blue-moon-mark-1/
- S3. EarthSky, Moon Base update. https://earthsky.org/space/moon-base-update-nasa-unveils-next-steps/
- S4. NASA NTRS, polar illumination study. https://ntrs.nasa.gov/archive/nasa/casi.ntrs.nasa.gov/20170007365.pdf
- S5. EurekAlert, Diviner cold traps. https://www.eurekalert.org/news-releases/648084
- S6. NASA, lunar pit temperatures. https://www.nasa.gov/solar-system/nasas-lro-finds-lunar-pits-harbor-comfortable-temperatures/
- S7. Phys.org, Chandrayaan-3 soil analysis. https://phys.org/news/2024-08-analysis-soil-moon-south-pole.html
- S8. JPL, Mars ice mapping. https://www.jpl.nasa.gov/news/where-should-future-astronauts-land-on-mars-follow-the-water/
- S9. Universe Today, Tianwen-3. https://www.universetoday.com/articles/china-plans-to-retrieve-mars-samples-by-2031
- S10. Garczynski, Lake Salda field report. https://astrobiology.nasa.gov/uploads/filer_public/29/d1/29d15953-db5c-4e96-aff3-e190686acfa3/report_lc_garczynski_project.pdf
- S11. NASA Earth Matters, Lake Salda. https://science.nasa.gov/blogs/earth-matters/2021/02/17/what-a-lake-in-turkey-can-tell-us-about-mars
- S12. LSS-ISAC-1 lunar simulant, Icarus 2021. https://cosmochemistry-papers.com/2021/05/07/a-lunar-soil-simulant-lss-isac-1-for-the-lunar-exploration-programme-of-the-indian-space-research-organisation/
- S13. Onmanorama, ISRO simulant patent. https://www.onmanorama.com/news/india/2020/05/20/moon-soil-patent-isro.html
- S14. Osinski, IAC 2021 abstract. https://p.iafastro.directory/iac/paper/id/66087/abstract-pdf/IAC-21,B3,8,11,x66087.brief.pdf
- S15. Western News, astronaut training. https://news.westernu.ca/2021/08/astronaut-training/
- S16. Global News, Labrador crater. https://globalnews.ca/news/9427987/labrador-crater-artemis-astronaut-training
- S17. Stewart et al. 2024, PLOS ONE. https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0299292
- S18. Astrobiology.com, Saudi environments review. https://astrobiology.com/2026/04/13/extreme-arabian-environments-and-their-microbiomes-new-frontiers-for-astrobiology-and-biosignature-discovery/
- S19. Xu et al. 2024, lava-tube radar study. https://journal.hep.com.cn/jdse/EN/10.15982/j.issn.2096-9287.2024.20230138
- S20. Petersen et al. 2020, Journal of Glaciology. https://www.cambridge.org/core/product/7431C35C2CD05B5C67F463B0AE5C8EFF
- S21. EurekAlert, drone radar on glaciers. https://www.eurekalert.org/news-releases/1126400
- S22. Astrobiology.com, Aguilar et al.. https://astrobiology.com/2026/04/06/revealing-the-internal-structure-of-mars-analog-glaciers-from-drone-based-radar-sounding/
- S23. Petersen et al., debris-apron ice purity. https://experts.arizona.edu/en/publications/high-ice-purity-of-martian-lobate-debris-aprons-at-the-regional-s/
- S24. Mitra et al., AGU 2014. https://studio.m-anage.com/agu/fm14/webprogram/Paper20956.html
- S25. Ray et al. 2025, natrojarosite. https://cosmochemistry-papers.com/2025/10/10/natrojarosite-formed-in-the-matanomadh-formation-kutch-india-a-na-analog-of-jarosite-on-mars/
- S26. Komatsu, EPSC 2010. https://meetingorganizer.copernicus.org/EPSC2010/EPSC2010-131-4.pdf
- S27. Allen and Oehler, NASA NTRS. https://ntrs.nasa.gov/citations/20100033209
- S28. Komatsu et al., EPSC 2022. https://meetingorganizer.copernicus.org/EPSC2022/EPSC2022-468.html
- S29. National Park Service, Kobuk dunes. https://www.nps.gov/kova/blogs/the-great-kobuk-sand-dunes-a-cloudy-and-warming-crystal-ball-for-mars.htm
- S30. NASA Earthdata, Unearthly dunes. https://earthdata.nasa.gov/news/feature-articles/unearthly-dunes
- S31. NASA Earth Observatory, Bodélé. https://science.nasa.gov/earth/earth-observatory/another-dusty-day-in-the-bodele-depression-150991
- S32. Atmospheric Chemistry and Physics 2006, Bodélé dust model. https://acp.copernicus.org/articles/6/4345/2006/
- S33. Wikipedia, Bodélé Depression. https://en.wikipedia.org/wiki/Bod%C3%A9l%C3%A9_Depression
- S34. Franzese, arXiv 1812.10480. https://arxiv.org/abs/1812.10480
- S35. EPSC2026-1096, Makgadikgadi. https://meetingorganizer.copernicus.org/EPSC2026/EPSC2026-1096.html
- S36. EPSC2026-568, Oxia Planum analog library. https://meetingorganizer.copernicus.org/EPSC2026/EPSC2026-568.html
- T1. Fernández-Remolar et al. 2005, The Río Tinto Basin, Spain, Earth and Planetary Science Letters 240, 149–167. https://doi.org/10.1016/j.epsl.2005.09.043
- T2. Navarro-González et al. 2003, Mars-like soils in the Atacama Desert, Science 302, 1018–1021. https://doi.org/10.1126/science.1089143
- G1. IAU and USGS, Gazetteer of Planetary Nomenclature. https://planetarynames.wr.usgs.gov/
- F1. NASA, Planetary Fact Sheets (Earth, Moon, Mars). https://nssdc.gsfc.nasa.gov/planetary/factsheet/
- R1. Marion 2009, Mistastin Lake impact crater, M.Sc. thesis, Memorial University. https://memorial.scholaris.ca/items/7fb0509d-5d7d-47ef-ab6b-2187f67ec432
- R2. Naidu 1963, A layered complex in Sittampundi, Mineralogical Society of America Special Paper 1. https://msaweb.org/wp-content/uploads/2022/07/MSA_SP1_116-123.pdf
- R3. Wikipedia, Mata no Madh. https://en.wikipedia.org/wiki/Mata_no_Madh
- R4. Schmidt et al. 2023, Makgadikgadi salt pans and martian playa environments, Frontiers in Astronomy and Space Sciences. https://www.frontiersin.org/journals/astronomy-and-space-sciences/articles/10.3389/fspas.2023.1108386/full
- R5. Fenske, Brož and Mazzini 2026, Mud volcano dynamics in Azerbaijan, Earth Surface Dynamics 14. https://esurf.copernicus.org/articles/14/433/2026/
- R6. LROC, lunar pits list. https://lroc.im-ldi.com/atlases/pits/list
- R7. NASA NSSDCA, Mars Exploration Rover Opportunity. https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2003-032A
- R8. Urso, Chojnacki and Vaz 2018, Dune-yardang interactions in Becquerel crater, Mars, JGR Planets 123. https://pmc.ncbi.nlm.nih.gov/articles/PMC5857962/
- R9. Davis, Grindrod and Boazman 2020, linear dunes at Hellespontus Montes, 51st LPSC abstract 1884. https://www.hou.usra.edu/meetings/lpsc2020/pdf/1884.pdf
- R10. Chavers et al. 2020, NASA's Human Landing System: the strategy for the 2024 mission, IEEE Aerospace Conference. https://ntrs.nasa.gov/citations/20200001606
- R11. NASA Office of Inspector General, IG-26-004, Human Landing System contracts. https://oig.nasa.gov/wp-content/uploads/2026/03/final-report-ig-26-004-nasas-management-of-the-human-landing-system-contracts.pdf
