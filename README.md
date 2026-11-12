# The Progressbar Np

A live perspective on time, rooted in Nepal and the Bikram Sambat calendar.
Includes day, week, Nepali month and year progress, an interactive year of dots,
light/dark themes, a community board, and a contact form.

## Project layout

```text
.
├── public/                         # Complete deployable website
│   ├── index.html                  # Main page
│   ├── index.htm                   # Redirect for old bookmarks
│   ├── assets/
│   │   ├── css/site.css
│   │   ├── data/nepali-calendar.js  # Generated and validated date data
│   │   ├── icons/favicon.svg
│   │   ├── images/                 # Sharing preview PNG and editable SVG
│   │   └── js/
│   │       ├── calendar.js          # Date and progress calculations
│   │       ├── dashboard.js         # Clock, themes and dashboard UI
│   │       ├── firebase-config.js
│   │       ├── contact-form.js
│   │       └── community-board.js
│   └── archive/v1/                  # Self-contained original site
├── scripts/
│   ├── serve.cjs                    # Local server, serves public/ only
│   ├── sync-calendar.cjs            # Hamro Patro data refresh
│   └── browser-check.cjs            # Desktop/mobile browser QA
├── tests/                          # Calendar and integration checks
│   └── fixtures/                   # Isolated source date fixtures
├── docs/                           # Architecture, maintenance and SEO guides
├── .github/workflows/               # Daily calendar refresh automation
├── .editorconfig                   # Formatting conventions
├── netlify.toml                     # Publish directory: public/
└── package.json                     # Development commands
```

`artifacts/` contains generated screenshots and local browser state. It is ignored
by Git and is not published. All historical scripts, experiments, logos and
particle effects live with the original site in `public/archive/v1/`.

## Local development

Use Node.js 22 or newer. No installation or build step is needed.

```sh
npm run dev
npm test
npm run test:browser
```

Open **http://127.0.0.1:4173**. On Windows with PowerShell script restrictions,
use `npm.cmd` instead of `npm`.

Browser QA uses Chrome; set `CHROME_PATH` if it is installed elsewhere. External
services are blocked during browser checks, and tests never submit to live
Firebase databases. Screenshots are saved to `artifacts/`.

## Calendar data

The current table covers **2081–2084 BS** (13 April 2024 through 12 April 2028),
using month lengths and Gregorian mappings verified against
[Hamro Patro](https://www.hamropatro.com/en/calendar/2083/7). Date and progress
calculations run locally in Nepal time, including midnight and New Year changes.
Outside the available table, Nepal time and day/week progress remain available.

```sh
npm run calendar:sync
```

This refreshes the previous, current and following BS year. It reads date facts
embedded in Hamro Patro's public calendar pages, checks day/month/year boundaries,
and replaces `public/assets/data/nepali-calendar.js` only after validation.
If the source is unavailable or changes format, the last working data is kept.
Do not manually edit generated rows. Visitors never contact Hamro Patro to run
the dashboard; no paid API or calendar API key is needed.

The [GitHub workflow](.github/workflows/sync-nepali-calendar.yml) checks daily at
approximately **00:22 Nepal time** and commits validated data after tests pass.
It becomes active when these changes reach the default branch with Actions
and repository writes enabled. Branch protection must allow the data commit.
Use **Actions → Refresh Nepali calendar from Hamro Patro → Run workflow** for
an immediate check. Scheduled runs may be delayed; live progress does not depend
on the precise refresh time.

Hamro Patro's page JSON is published data, not a documented API contract. A format
change produces a failed check instead of guessed dates.

## Deployment and archive

Publish **`public/`**, with `index.html` as the entry point. The included
`netlify.toml` sets this directory for Netlify. Other static hosts should use the
same document root. Old `/index.htm` bookmarks redirect to the home page.

Existing public site: https://the-progressbar-np.netlify.app/

The project identifies **Sujeet Khadka** as its creator and links to
[his portfolio](https://www.sujeetkhadka.com.np/). Search metadata, structured
authorship, a sitemap and sharing previews belong to the project domain; its
canonical URL is separate from the portfolio. Archive pages remain browsable
and are excluded from search indexing through Netlify headers.
See [the SEO guide](docs/SEO.md) for verification, publishing and Search Console
steps. These local changes affect live search only after deployment and crawling.

Calendar refresh commits currently include `[skip netlify]`: they update the
repository without changing the existing live deployment. Once publishing is
approved, remove that marker from the calendar workflow to let subsequent data
commits deploy through a connected Netlify production branch. A local checkout
or manually uploaded deployment does not update from Actions.

The footer's **Archive** link opens `/archive/v1/index.htm`. The old design and
assets are preserved, its forms are read only, and `original.htm` retains the
unchanged HTML source snapshot. The return link opens the current home page.

See [the codebase guide](docs/CODEBASE.md) for architecture, data contracts,
calendar sources, Firebase behavior, and maintenance details.
