# Small Data

**Visualising the archives of Bourges's Institute of Electroacoustic Music (IMEB)**

Small Data is a data visualisation application designed to retrace the story and evolution of the international electroacoustic music and sonic art competitions held in Bourges, France, from 1973 to 2009. Through a set of complementary interactive visualisations, it makes this history legible: within a single space, it renders visible the entries, the award-winning works, the competition's successive categories, and the trajectories of participating countries.

The application was created as part of a research project on the IMEB archives directed by Geneviève Mathon and supported by the Labex Arts-H2H. Founded in 1970 as the *Groupe de musique électroacoustique de Bourges* (GMEB) and directed by the composers Françoise Barrière and Christian Clozier until its closure in 2011, the IMEB donated its complete archives to the *Bibliothèque nationale de France* (BnF) between 2005 and 2011 — a unique multimedia record of the history of electroacoustic music and its worldwide diffusion. Small Data was designed as an interface to this collection: it highlights the structure of the Bourges competitions, gives visibility to award-winning works (such as the *Euphonies d'Or*), and links composers to their records on [data.bnf.fr](https://data.bnf.fr) through ISNI persistent identifiers.

The project starts from a simple observation: the data documenting this activity is neither large nor complex — a few thousand records. Its interest lies in its historical density rather than its volume. The approach is one of exploratory programming: the visualisations are not final renderings but reading instruments, built in the course of analysing the collection.

The application is available online at [webodrome.fr/small_data](https://www.webodrome.fr/small_data/). A [video walkthrough](https://vimeo.com/237232737) presents the visualisations.

## The visualisations

The web application (in `small_data/`) offers several views of the same database, each focusing on one property of the collection:

- **Overview** — an interactive index of the 2,590 identified participants. Each composer is represented by a grey square followed by one coloured square per participation, the hue encoding the edition year (from red for 1973 to purple for 2009). Semi-transparent squares mark composers whose works are absent from the archive, making visible what is missing as well as what is preserved. The index can be filtered by name or by number of archived records, following Ben Shneiderman's mantra: *overview first, zoom and filter, then details-on-demand*.
- **Network** — a "live visualisation" driven by a multi-agent system. Each record consulted through the index spawns an autonomous agent; agents interact locally (a behaviour inspired by firefly synchronisation) to detect the properties their information nodes share, and regroup accordingly — by country, by category — drawing an evolving map of the user's own navigation path through the corpus.
- **Line Charts** — the evolution of the number of participants by country and by year, based on the minutes of each competition. Any country can be isolated to follow its own curve.
- **Categories** — a Sankey flow diagram retracing how the competition's categories appeared, merged and disappeared across the 36 editions (e.g. the appearance in 1988 of "Magister", "Residency" and "Quadrivium").
- **Award-Winning Works** — the complete table of the 728 award-winning works, with composer, duration, year and award category.
- **Sound Archives catalogues** — the two phonothèques assembled by the IMEB: the International Sound Archives and the IMEB Sound Archives (765 works produced in the institute's studios by 274 composers from 42 countries).
- **Euphonies d'Or** — the roll of honour of the 35 works distinguished across the competition's history, linked to their records at the BnF through ISNI identifiers.

To respect copyright law, the online version references the archived compositions without giving access to the audio recordings; only the version intended for the BnF premises grants listening access.

## Repository structure

```
smallData/
├── small_data/            Main web application (PHP + JavaScript)
│   ├── index.php          Landing page
│   ├── data/smallData.csv Award-winning works dataset
│   └── demo/              The visualisations
│       ├── index.php      Overview (interactive index)
│       ├── network.php    Multi-agent system / live visualisation
│       ├── animated_data.php  Line charts
│       ├── categories.php Sankey diagram of categories
│       ├── award-winning_works.php
│       ├── catalog.php    Sound archives catalogues
│       ├── euphonies.php  Euphonies d'Or
│       ├── js/            Visualisation code (D3.js, canvas, particles)
│       └── php/           Server-side data retrieval (MySQL)
├── imeb/                  Earlier companion site: award-winning works
│   ├── script.js          D3 pie charts (countries, studios, categories)
│   ├── sankey/            Standalone Sankey diagram
│   └── data/smallData.csv
├── rebuild_database/      Processing sketch: builds the MySQL database by
│                          parsing the 6,292 "capsule" folders (.mtd metadata
│                          files) archived by the IMEB
├── update_db_with_csv/    Processing sketch: updates the database from the
│                          award-winning works CSV
└── sma_database/          Processing sketch: multi-agent system used to clean
                           the database (detecting spelling errors and merging
                           duplicate composer records)
```

## Data sources

The database was built from several types of documents held at the BnF:

- the **minutes** of each competition (1973–2009), which record the name, first name and country of every participant;
- **6,292 digital folders** ("capsules") created by Françoise Barrière and Christian Clozier, each documenting a single electroacoustic composition (audio recording, composer's photograph and biographical record, metadata such as duration and number of tracks);
- the **list of the 728 award-winning works** compiled by Christian Clozier, which also covers works absent from the capsules (dance and theatre pieces, interactive installations).

A multi-agent system (`sma_database/`) was used to consolidate this data: created from database records, its agents interact to compare entries, detect spelling and formatting errors, and merge records referring to the same composer — a form of computational emergence applied to the construction of a knowledge base.

## Running the application

The web application requires a PHP server with a MySQL database.

1. Serve the `small_data/` directory with PHP (the pages also include optional site-wide files — `analyticstracking.php`, `footer.php` — expected at the document root; remove or provide them as needed).
2. Create a MySQL database named `imeb` and provide a PDO connection script at `../access/connexion.php` (relative to the document root) exposing a `$dbh` handle used by the scripts in `small_data/demo/php/`.
3. Populate the database with the Processing sketches (`rebuild_database/`, `update_db_with_csv/`), or adapt them to your own data. They require [Processing](https://processing.org) with the BezierSQLib library, and read the MySQL credentials from an `access.txt` file placed in each sketch folder. The `sma_database/` sketch additionally requires the Box2D for Processing, ControlP5 and The MidiBus libraries.

The `imeb/` pages only require PHP and read their data directly from `imeb/data/smallData.csv`.

## Publications

The project is documented in the following publications:

- Di Bartolo, F. (2017). Visualising the Multimedia Archives of Bourges's Institute of Electroacoustic Music. In *EVA London 2017: Electronic Visualisation and the Arts*, BCS, London, pp. 138–143. DOI: [10.14236/ewic/EVA2017.33](https://doi.org/10.14236/ewic/EVA2017.33) — HAL: [hal-01561573](https://hal.science/hal-01561573)
- Di Bartolo, F. (2017). Retracing the story of Bourges's Institute of Electroacoustic Music through exploratory programming and live visualizations. In *Proceedings of ISEA2017 — 23rd International Symposium on Electronic Art*, Manizales, Colombia, pp. 391–397. HAL: [hal-01541237](https://hal.science/hal-01541237)
- Di Bartolo, F. (2019). Exploration du fonds IMEB : l'émergence computationnelle au service de la recherche d'informations. In *L'émergence en musique*, Delatour France, pp. 139–156. HAL: [hal-02299684](https://hal.science/hal-02299684)

## License

The **source code** of this project (the PHP pages, the JavaScript visualisations and the Processing sketches written for it) is released under the MIT License — see [`LICENSE`](LICENSE).

The **data** (`small_data/data/`, `imeb/data/`) is made available under the [Creative Commons Attribution 4.0 International licence (CC-BY 4.0)](https://creativecommons.org/licenses/by/4.0/): you may reuse and adapt it provided you give appropriate credit. Note that this dataset was compiled from the records of the international competitions organised by the IMEB, gathered by Christian Clozier and Françoise Barrière, whose archives were donated to the *Bibliothèque nationale de France*. The underlying documents and works remain the property of their respective rights holders, and any reuse should respect those rights.

Bundled third-party libraries (jQuery, D3.js, and others under `lib/`, as well as the Box2D, ControlP5 and MidiBus libraries used by the Processing sketches) are distributed under their own respective licenses.

## Acknowledgments

Thanks to Françoise Barrière and Christian Clozier for their lifework and for the documents and insights they shared; to the Audiovisual Department of the *Bibliothèque nationale de France* (Audrey Viault, Pascal Cordereix) and the Conservation service of the Music Department (Catherine Vallet-Collot); and to Geneviève Mathon and Azadeh Nilchiani for their support. The project was financially supported by the Labex Arts-H2H.

---

Application designed and developed by [Florent Di Bartolo](https://github.com/fdiba), Université Gustave Eiffel.
