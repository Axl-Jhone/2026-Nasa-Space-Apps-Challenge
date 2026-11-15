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

Terrain is the only property we could measure the same way on both worlds with open data, so it is the only one we measure, using NASA's LRO LOLA elevation for the Moon and Copernicus DEM for Earth on one 80 m grid. Everything else is shown as cited evidence, with a link to its source beside each claim. Every pair is labelled benchmark, established or hypothesis, carries a confidence percentage with its five parts shown, and ends on where the analogy breaks.

That matters because an analog site is only useful for training crews and testing hardware if its limits are known.

## Link to Project Demo

(the 30-second video; script below)

## Link to Final Project

https://axl-jhone.github.io/2026-Nasa-Space-Apps-Challenge/

Repository: https://github.com/Axl-Jhone/2026-Nasa-Space-Apps-Challenge

## Detailed Project Description

**What it does.** ATLAS shows twelve Earth analog sites on rotatable globes of Earth, the Moon and Mars. One table compares all of them across eight dimensions: geology, terrain, temperature and light, water and ice, dust, biology, subsurface, and operations. Each pair has its own page with what matches (one source link per claim), the published figures on both worlds, how the site could help exploration, and an orange "where it breaks" block. Three pairs are for the Moon and nine are for Mars.

**The lead Mars pair** is the Galena Creek rock glacier in Wyoming and the debris-covered ice of Deuteronilus Mensae. Published work estimates the Galena Creek ice at 80 to 95% pure under 1 to 1.5 m of debris, and orbital radar puts the Martian debris aprons above 80% water ice. It breaks in two places: the Earth figure is a radar estimate that rests on an assumed rock property, and the debris thickness on Mars, which decides how reachable the water is, is not verified.

**The measured pair** is the Kamestastin Lake impact structure in Labrador and de Gerlache crater near the lunar south pole. They share anorthosite, the rock of the lunar highlands, and astronauts have trained at Kamestastin. But on the same 80 m grid de Gerlache has 3,088 m of relief against 216 m, and a median slope of 12.5° against 3.7°. The terrain does not match, and the site says so.

**How it works.** A Python pipeline cuts a 40 km window from Copernicus DEM GLO-30 and from NASA's LRO LOLA polar elevation grid, brings both onto one 80 m grid, and computes relief, slope, roughness, and the share of ground under 8°, the tilt NASA's Human Landing System must tolerate. A terrain similarity percentage is the plain average of three parts (slope overlap, relief, roughness) and is always shown with them: Kamestastin against de Gerlache scores 36%. We tested it on controls. A second lunar crater scores 89% against de Gerlache and a flat lake bed 4%, but a dune field scores 37%, the same as Kamestastin. That showed us the measures capture how rugged the ground is, not its shape, and the site reports it.

**The Mars measured pair** is Lake Salda in Turkey and Jezero crater, on NASA's MOLA elevation and Copernicus DEM. Mars's open global grid is about 463 m, so both windows are 60 km on one 500 m grid: 840 m of relief against 872 m, and a terrain similarity of 73%. The page says these numbers cannot be compared with the Moon pair's.

**Zoom to both places.** From the globes, one button dives to two maps side by side, Earth and its counterpart, drawn at one scale so a kilometre is the same length on both. The pictures are live from NASA GIBS and USGS Astrogeology, with saved copies underneath so it runs with no network. A dashed square marks the window we measured, and one click opens that terrain in 3D with a height profile of both worlds on the same axes. A 30-second tour plays the Galena Creek pair through this view and ends on where it breaks.

**Test any place on Earth.** In the zoom view, click the Earth map or type coordinates. ATLAS reads open elevation tiles for that spot, measures it in the browser with the pipeline's own formulas, and scores it against de Gerlache or Jezero in about two seconds. It is labelled a quick test, and a button runs it at Kamestastin or Lake Salda beside our pipeline's numbers so anyone can see how far it can be trusted (Lake Salda: 841 m of relief against 840 m). It lets a visitor look beyond the well-known sites. A second button lights both terrains with the Sun 1.5° above the horizon, as at the lunar poles.

**Shape, not just ruggedness.** Our controls showed the similarity percentage could not tell a crater from a dune field. We added radial form: the share of a window's height variation explained by distance from its centre. The two lunar craters and Kamestastin score 0.60 to 0.75, the dune field 0.05 and the flat lake bed 0.08. It also exposes a break the similarity hid: Jezero scores 0.66 and Lake Salda 0.15.

**From a need to a site.** On the All pairs tab, pick what a mission must test (reaching water ice, cold and lighting, dust on hardware and so on) and the atlas lists the sites with evidence on it and the sites that do not match, each with its note and sources. The quick test can also scan the eight windows around a tested place, adds NASA POWER climate for the spot, and gives a link that reopens the same test.

**The negative result.** We found no Earth site that reproduces the cold, the lighting or the volatiles of the lunar south pole. The Moon candidates match rock and caves only.

**What is new and what is not.** Two pairings are our own hypotheses and are labelled as such: the Umm Jirsan lava tube for lunar pits, and the Bodélé Depression for dust lifting on Mars. The rest are established or benchmark analogs. A method page lists every source and how much of it was read.

**Tools.** Static HTML, CSS and JavaScript with no framework and no build step; Python with NumPy, Rasterio and PyProj; Microsoft Planetary Computer for the Earth elevation and temperature (a Space Apps Global Offer); Leaflet (open source) for the maps; NASA GIBS and USGS Astrogeology map services; GitHub Pages for hosting.

## Use of Super Intelligence (SI)

> Check this against what actually happened before pasting. The guide also says SI "should not be used to (come up with your idea of how to solve the challenge)", so say plainly which ideas were the team's.

Yes. We used Claude (by Anthropic), a large language model, as a research and coding assistant. It searched and summarised the literature for candidate analog sites, checked 416 research claims against the sources they cited, drafted the site's text, and wrote most of the code for the terrain pipeline and the website. The team directed the work.

No image, video or audio in the project is AI-generated: the globes are NASA imagery and the terrain views are drawn from elevation data. The site acknowledges the AI use on its Method and sources page, in the page metadata and in the code comments. Because an AI assistant can state a wrong fact with confidence, every claim on the site links to its source and the source list says how much of each source was read.

## NASA Data

- LRO LOLA gridded elevation, product LDEM_80S_80M (NASA Planetary Data System, data set LRO-L-LOLA-4-GDR-V1.0). The Moon side of every terrain measure. https://pds-geosciences.wustl.edu/missions/lro/lola.htm
- MODIS/Terra land surface temperature (MOD11A2), one year at each Earth site, set against published lunar and Martian temperatures.
- NASA POWER climatology (MERRA-2 reanalysis): air temperature, wind and rainfall at each Earth site.
- NASA GIBS, Blue Marble imagery, for the Earth globe. https://nasa-gibs.github.io/gibs-api-docs/
- LRO WAC global mosaic and the Mars Viking Colorized Global Mosaic, through NASA Trek, for the Moon and Mars globes. https://trek.nasa.gov/
- NASA Planetary Fact Sheets, for gravity, pressure and temperature figures. https://nssdc.gsfc.nasa.gov/planetary/factsheet/
- IAU and USGS Gazetteer of Planetary Nomenclature, and the LROC lunar pits list, for coordinates.
- LRO Diviner results, cited as published (Paige et al. 2010, Science; Horvath et al. 2022, Geophysical Research Letters). We did not process Diviner data.
- NASA and JPL pages cited as evidence: lunar pit temperatures (LRO Diviner), Artemis III landing regions, Mars ice mapping, the Human Landing System requirements paper on NTRS.

## Space Agency Partner Data and Other References

- Copernicus DEM GLO-30 (European Union and ESA Copernicus programme), read through Microsoft Planetary Computer. The Earth side of every terrain measure. https://doi.org/10.5270/ESA-c5d3d65
- ISRO results cited as evidence: the Chandrayaan-3 soil analysis and the LSS-ISAC-1 lunar soil simulant.
- Typeface: IBM Plex Mono (SIL Open Font License), served by Google Fonts.
- No third-party JavaScript library is used.
- Full source list: the Method and sources tab of the app, and the list at the end of this file.

## 30-second demo script

**Fastest way to record it:** open the Three worlds tab, press **Play the 30-second tour**, and record the screen. It selects Galena Creek, dives from the globes to the two maps, shows two "alike" claims and two "where it stops" claims with their sources, and ends at 30 seconds. Read the captions aloud or leave them as the on-screen text. The table below is the manual version.

The video must be **30 seconds or less**. Aim for 28. Record at 1366 by 768 or larger, in a browser window with no bookmarks bar.

| Time | On screen | Voice-over |
| --- | --- | --- |
| 0:00 to 0:04 | Three worlds tab, globes in ASCII view. Title text over it: team name, the challenge name, "ATLAS". Click **Mars** so the Mars globe shows | "ATLAS asks of every Earth analog: where does it hold, and where does it break?" |
| 0:04 to 0:09 | Click the **Galena Creek** pin on the Earth globe, then **Open the full case** in the panel | "Galena Creek, Wyoming, stands in for the buried ice of Deuteronilus Mensae on Mars." |
| 0:09 to 0:17 | The pair page. Scroll to the two-column figures table and hover a source link | "Both are ice under rock debris: eighty to ninety-five percent pure here, over eighty percent there." Caption: every number links to its source |
| 0:17 to 0:27 | Scroll to the orange **Where it breaks** block and hold | "Here it breaks. The Earth figure is a radar estimate resting on an assumption. Debris thickness on Mars is unverified. And no Earth site has Mars's gravity, air or radiation." |
| 0:27 to 0:29 | End card: "ATLAS. Where Earth stands in, and where it stops." and the URL | (silence) |

The voice-over is 75 words. Read it once against a timer before recording. If it runs long, cut the caption hover, not the last line: the video has to end on where it breaks.

If nobody speaks on the video, put the same lines on screen as English captions.

## Source list (for the references field)

Generated from `web/data/sites.json`. Ids match the small links beside each claim in the app.

- S8. JPL, Mars ice mapping. Agency or government page. https://www.jpl.nasa.gov/news/where-should-future-astronauts-land-on-mars-follow-the-water/
- S10. Garczynski, Lake Salda field report. Report. https://astrobiology.nasa.gov/uploads/filer_public/29/d1/29d15953-db5c-4e96-aff3-e190686acfa3/report_lc_garczynski_project.pdf
- S11. NASA Earth Matters, Lake Salda. Agency or government page. https://science.nasa.gov/blogs/earth-matters/2021/02/17/what-a-lake-in-turkey-can-tell-us-about-mars
- S12. Anbazhagan et al. 2021, A lunar soil simulant (LSS-ISAC-1) for the lunar exploration programme of the Indian Space Research Organisation, Icarus 366, 114511. Peer-reviewed paper. https://doi.org/10.1016/j.icarus.2021.114511
- S14. Osinski, IAC 2021 abstract. Conference abstract or paper. https://p.iafastro.directory/iac/paper/id/66087/abstract-pdf/IAC-21,B3,8,11,x66087.brief.pdf
- S17. Stewart et al. 2024, First evidence for human occupation of a lava tube in Arabia: the archaeology of Umm Jirsan Cave, PLOS ONE 19(4), e0299292. Peer-reviewed paper. https://doi.org/10.1371/journal.pone.0299292
- S18. Astrobiology.com, Saudi environments review. Summary of a paper. https://astrobiology.com/2026/04/13/extreme-arabian-environments-and-their-microbiomes-new-frontiers-for-astrobiology-and-biosignature-discovery/
- S20. Petersen et al. 2020, New insights into ice accumulation at Galena Creek Rock Glacier from radar imaging of its internal structure, Journal of Glaciology 66(255), 1–10. Peer-reviewed paper. https://doi.org/10.1017/jog.2019.67
- S22. Astrobiology.com, Aguilar et al.. Summary of a paper. https://astrobiology.com/2026/04/06/revealing-the-internal-structure-of-mars-analog-glaciers-from-drone-based-radar-sounding/
- S23. Petersen, Holt and Levy 2018, High ice purity of Martian lobate debris aprons at the regional scale, Geophysical Research Letters 45(21), 11,595–11,604. Peer-reviewed paper. https://doi.org/10.1029/2018GL079759
- S24. Mitra et al., AGU 2014. Conference abstract or paper. https://studio.m-anage.com/agu/fm14/webprogram/Paper20956.html
- S25. Ray et al. 2025, Natrojarosite formed in the Matanomadh Formation, Kutch, India: a Na analog of jarosite on Mars, American Mineralogist 110(10), 1516–1526. Peer-reviewed paper. https://doi.org/10.2138/am-2024-9360
- S26. Komatsu, EPSC 2010. Conference abstract or paper. https://meetingorganizer.copernicus.org/EPSC2010/EPSC2010-131-4.pdf
- S27. Allen and Oehler, NASA NTRS. Conference abstract or paper. https://ntrs.nasa.gov/citations/20100033209
- S28. Komatsu et al., EPSC 2022. Conference abstract or paper. https://meetingorganizer.copernicus.org/EPSC2022/EPSC2022-468.html
- S29. National Park Service, Kobuk dunes. Agency or government page. https://www.nps.gov/kova/blogs/the-great-kobuk-sand-dunes-a-cloudy-and-warming-crystal-ball-for-mars.htm
- S30. NASA Earthdata, Unearthly dunes. Agency or government page. https://earthdata.nasa.gov/news/feature-articles/unearthly-dunes
- S31. NASA Earth Observatory, Bodélé. Agency or government page. https://science.nasa.gov/earth/earth-observatory/another-dusty-day-in-the-bodele-depression-150991
- S32. Tegen et al. 2006, Modelling soil dust aerosol in the Bodélé depression during the BoDEx campaign, Atmospheric Chemistry and Physics 6(12), 4345–4359. Peer-reviewed paper. https://doi.org/10.5194/acp-6-4345-2006
- S33. Wikipedia, Bodélé Depression. Encyclopedia. https://en.wikipedia.org/wiki/Bod%C3%A9l%C3%A9_Depression
- S35. EPSC2026-1096, Makgadikgadi. Conference abstract or paper. https://meetingorganizer.copernicus.org/EPSC2026/EPSC2026-1096.html
- T1. Fernández-Remolar et al. 2005, The Río Tinto Basin, Spain, Earth and Planetary Science Letters 240, 149–167. Peer-reviewed paper. https://doi.org/10.1016/j.epsl.2005.09.043
- T2. Navarro-González et al. 2003, Mars-like soils in the Atacama Desert, Science 302, 1018–1021. Peer-reviewed paper. https://doi.org/10.1126/science.1089143
- G1. IAU and USGS, Gazetteer of Planetary Nomenclature. Dataset or database. https://planetarynames.wr.usgs.gov/
- F1. NASA, Planetary Fact Sheets (Earth, Moon, Mars). Agency or government page. https://nssdc.gsfc.nasa.gov/planetary/factsheet/
- R1. Marion 2009, Mistastin Lake impact crater, M.Sc. thesis, Memorial University. Thesis. https://memorial.scholaris.ca/items/7fb0509d-5d7d-47ef-ab6b-2187f67ec432
- R2. Naidu 1963, A layered complex in Sittampundi, Mineralogical Society of America Special Paper 1. Peer-reviewed paper. https://msaweb.org/wp-content/uploads/2022/07/MSA_SP1_116-123.pdf
- R3. Wikipedia, Mata no Madh. Encyclopedia. https://en.wikipedia.org/wiki/Mata_no_Madh
- R4. Schmidt et al. 2023, Structural influences on groundwater circulation in the Makgadikgadi salt pans of Botswana? Implications for martian playa environments, Frontiers in Astronomy and Space Sciences 10. Peer-reviewed paper. https://doi.org/10.3389/fspas.2023.1108386
- R5. Fenske, Brož and Mazzini 2026, Mud volcano dynamics in Azerbaijan, Earth Surface Dynamics 14. Peer-reviewed paper. https://esurf.copernicus.org/articles/14/433/2026/
- R6. LROC, lunar pits list. Dataset or database. https://lroc.im-ldi.com/atlases/pits/list
- R7. NASA NSSDCA, Mars Exploration Rover Opportunity. Agency or government page. https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2003-032A
- R8. Urso, Chojnacki and Vaz 2018, Dune-yardang interactions in Becquerel crater, Mars, JGR Planets 123. Peer-reviewed paper. https://pmc.ncbi.nlm.nih.gov/articles/PMC5857962/
- R9. Davis, Grindrod and Boazman 2020, linear dunes at Hellespontus Montes, 51st LPSC abstract 1884. Conference abstract or paper. https://www.hou.usra.edu/meetings/lpsc2020/pdf/1884.pdf
- R10. Chavers et al. 2020, NASA's Human Landing System: the strategy for the 2024 mission, IEEE Aerospace Conference. Conference abstract or paper. https://ntrs.nasa.gov/citations/20200001606
- R11. NASA Office of Inspector General, IG-26-004, Human Landing System contracts. Agency or government page. https://oig.nasa.gov/wp-content/uploads/2026/03/final-report-ig-26-004-nasas-management-of-the-human-landing-system-contracts.pdf
- P1. Aguilar et al. 2026, Revealing the internal structure of Mars-analog glaciers from drone-based radar sounding, JGR Planets 131(3), e2025JE009208. Peer-reviewed paper. https://doi.org/10.1029/2025JE009208
- P2. Morgan et al. 2021, Availability of subsurface water-ice resources in the northern mid-latitudes of Mars, Nature Astronomy 5(3), 230–236. Peer-reviewed paper. https://doi.org/10.1038/s41550-020-01290-z
- P3. Dinwiddie et al. 2010, Sand, wind, and ice: Mars analog aeolian studies at the Great Kobuk Sand Dunes, Alaska, Second International Planetary Dunes Workshop, abstract 2029. Conference abstract or paper. https://www.lpi.usra.edu/meetings/dunes2010/pdf/2029.pdf
- P4. Necsoiu et al. 2009, Monitoring migration rates of an active subarctic dune field using optical imagery, Remote Sensing of Environment 113(11), 2441–2447. Peer-reviewed paper. https://doi.org/10.1016/j.rse.2009.07.004
- P5. Dinwiddie et al. 2012, Internal sedimentary structure and aqueous-phase distribution of the Great Kobuk Sand Dunes, Third International Planetary Dunes Workshop, abstract 7034. Conference abstract or paper. https://www.lpi.usra.edu/meetings/dunes2012/pdf/7034.pdf
- P6. Koren et al. 2006, The Bodélé depression: a single spot in the Sahara that provides most of the mineral dust to the Amazon forest, Environmental Research Letters 1, 014005. Peer-reviewed paper. https://doi.org/10.1088/1748-9326/1/1/014005
- P7. Braithwaite and Zedef 1996, Hydromagnesite stromatolites and sediments in an alkaline lake, Salda Gölü, Turkey, Journal of Sedimentary Research 66(5), 991–1002. Peer-reviewed paper. https://doi.org/10.1306/d426845f-2b26-11d7-8648000102c1865d
- P8. Goudge et al. 2015, Assessing the mineralogy of the watershed and fan deposits of the Jezero crater paleolake system, Mars, JGR Planets 120(4), 775–808. Peer-reviewed paper. https://doi.org/10.1002/2014JE004782
- P9. Horgan et al. 2020, The mineral diversity of Jezero crater: evidence for possible lacustrine carbonates on Mars, Icarus. Peer-reviewed paper. https://doi.org/10.1016/j.icarus.2019.113526
- P10. Bhattacharya et al. 2016, Jarosite occurrence in the Deccan Volcanic Province of Kachchh, western India: spectroscopic studies on a Martian analog locality, JGR Planets 121(3), 402–431. Peer-reviewed paper. https://doi.org/10.1002/2015JE004949
- P11. NASA NSSDCA, Viking 1 Lander. Agency or government page. https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1975-075C
- Q1. Mader and Osinski 2018, Impactites of the Mistastin Lake impact structure: insights into impact ejecta emplacement, Meteoritics and Planetary Science 53(12), 2492–2518. Peer-reviewed paper. https://doi.org/10.1111/maps.13173
- Q2. Canadian Space Agency, Training in geology. Agency or government page. https://www.asc-csa.gc.ca/eng/astronauts/about-the-job/space-mission-simulations/training-in-geology.asp
- Q3. Mader 2015, The Mistastin Lake impact structure as a terrestrial analogue site for lunar science and exploration, thesis, Western University. Thesis. https://ir.lib.uwo.ca/etd/3485
- Q4. Xie, Osinski and Shieh 2020, Raman study of shock features in plagioclase feldspar from the Mistastin Lake impact structure, Canada, Meteoritics and Planetary Science 55(7), 1471–1490. Peer-reviewed paper. https://doi.org/10.1111/maps.13523
- Q5. Venugopal et al. 2020, Development of a novel lunar highland soil simulant (LSS-ISAC-1) and its geotechnical properties for Chandrayaan missions, Planetary and Space Science 194, 105116. Peer-reviewed paper. https://doi.org/10.1016/j.pss.2020.105116
- Q6. Venugopal et al. 2020, Invention of Indian Moon soil (lunar highland soil simulant) for Chandrayaan missions, International Journal of Geosynthetics and Ground Engineering 6, 44. Peer-reviewed paper. https://doi.org/10.1007/s40891-020-00231-0
- Q7. Vadawale et al. 2024, Chandrayaan-3 APXS elemental abundance measurements at lunar high latitude, Nature 633, 327–331. Peer-reviewed paper. https://doi.org/10.1038/s41586-024-07870-7
- Q8. ISRO, note on the Chandrayaan-3 APXS results, 21 August 2024. Agency or government page. https://www.isro.gov.in/media_isro/pdf/APXS_CH3.pdf
- Q9. Wagner and Robinson 2014, Distribution, formation mechanisms, and significance of lunar pits, Icarus. Peer-reviewed paper. https://doi.org/10.1016/j.icarus.2014.04.002
- Q10. Horvath, Hayne and Paige 2022, Thermal and illumination environments of lunar pits and caves, Geophysical Research Letters 49(14), e2022GL099710. Peer-reviewed paper. https://doi.org/10.1029/2022GL099710
- Q11. Paige et al. 2010, Diviner Lunar Radiometer observations of cold traps in the Moon's south polar region, Science 330(6003), 479–482. Peer-reviewed paper. https://doi.org/10.1126/science.1187726
