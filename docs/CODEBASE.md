# Understanding The Progressbar Np

## Purpose

This is a static, Nepal-focused time dashboard created by Sujeet Khadka. Its main
idea is to make passing time visible. The main display switches between the day,
Sunday–Saturday week, Nepali month, and Bikram Sambat year. A day ring, interactive
year of dots, Nepali date, clock, theme switch, contact form, and public community
board complete the experience. The footer links to the archived original site.

The browser performs all calendar calculations and rendering. Firebase Realtime
Database supplies the two messaging features. There is no application server,
framework, bundler, authentication flow, or package dependency. The Node tools
handle local development, verification, and scheduled calendar data refreshes.

## File map

| File | Responsibility |
| --- | --- |
| `public/index.html` | Main page, accessible controls, metadata, and ordered deferred scripts. |
| `public/index.htm` | Compatibility redirect for bookmarks using the original entry point. |
| `public/assets/css/site.css` | Responsive layout, themes, progress bars, focus indicators, and reduced-motion styles. |
| `public/assets/js/calendar.js` | Pure BS conversion, Nepal boundaries, year windows, progress calculations and data validation. Exported for browsers and Node tests. |
| `public/assets/data/nepali-calendar.js` | Generated Hamro Patro year starts and month lengths, with source and check timestamp. |
| `scripts/sync-calendar.cjs` | Fetches public calendar date facts, checks day/month/year continuity, and atomically replaces the data file. |
| `.github/workflows/sync-nepali-calendar.yml` | Daily refresh, tests, and a commit containing only the validated calendar data. |
| `public/assets/js/dashboard.js` | Renders the clock, period views, day ring, year dots, month selection and themes. |
| `public/assets/js/firebase-config.js` | Firebase project configuration, named app lookup and form-status rendering. |
| `public/assets/js/contact-form.js` | Contact validation, acknowledged saves, pending state and result feedback. |
| `public/assets/js/community-board.js` | Board expansion, lazy subscription, submission and safe rendering. |
| `public/assets/icons/favicon.svg` | Progress mark favicon; the logo and theme controls use inline vector/CSS shapes. |
| `public/assets/images/social-card.svg`, `social-card.png` | Editable vector and 1200 × 630 raster sharing preview. |
| `public/robots.txt`, `public/sitemap.xml` | Crawl discovery and canonical homepage listing. |
| `scripts/serve.cjs` | Local static preview server, defaulting to port 4173. |
| `scripts/browser-check.cjs` | Chrome browser QA, with external services blocked and a deterministic calendar fixture. |
| `tests/*.test.cjs` | Calendar and browser-boundary regression tests using Node's built-in test runner. |
| `public/archive/v1/` | Self-contained original site, original logos/theme images, particle library/configuration, historical experiments and unchanged `original.htm` source snapshot. |
| `docs/CODEBASE.md` | Architecture, maintenance notes, data contracts and verification guidance. |
| `docs/SEO.md` | Creator identity, metadata, canonical URLs, archive indexing and publication steps. |
| `tests/seo.test.cjs` | SEO consistency, structured identity, image and HTTP indexing checks. |
| `netlify.toml` | Publishes `public/`, redirects legacy entry points and sets archive noindex headers. |

Browser URLs are relative to `public/`, the document root. Repository tools and
tests run from the project root. Application files are under `public/assets/`;
historical assets are kept with the archive instead of duplicated at the root.
Generated screenshots and local browser state live in ignored `artifacts/`.

### Historical geolocation experiments

`public/archive/v1/GeoLocations.js` and `public/archive/v1/location.js` are retained
historical experiments, not loaded by `public/index.html`. The former collects
and writes precise coordinates when called;
the latter is unfinished scratch code, including a syntax error. Neither belongs
in the active script list. Nepal time does not require access to the visitor's
position. Reintroducing location features would require a separate product
decision, explicit UI, isolated Firebase configuration, and error handling.

## Runtime flow

1. The browser parses the HTML and loads the CSS.
2. Deferred `assets/data/nepali-calendar.js` loads the local verified date table. `calendar.js`
   validates it and exposes `ProgressCalendar`; `dashboard.js` initializes the dashboard.
   If the data script is missing or rejected, the original 2081–2083 fallback
   keeps the supported dashboard dates working without an external request.
3. The year map renders one dot per day, and month buttons highlight the selected
   month's days. It is rebuilt only when the Nepal date changes. No particle
   effects are loaded by the redesigned page.
4. A matching pair of Firebase **13.2.0 compat** app/database scripts loads from
   Google's CDN. The compat API preserves the project's namespaced integration.
5. `firebase-config.js` exposes `ProgressFirebase`. The contact handler initializes
   its named app. The public board initializes its separate app on first expansion.

The dashboard scripts appear before Firebase, so Firebase loading or initialization
failures do not stop the clock, themes, or progress bars. A missing SDK disables
the affected form and displays an explanation. Google Analytics runs separately.

## Calendar calculations

All displays use **Asia/Kathmandu**, rather than the machine's local timezone.
Day calculations use a fixed modern Nepal offset of **UTC+05:45**; the clock and
message timestamps use `Intl.DateTimeFormat`/`toLocaleString` with that timezone.
The supported dates are modern, so historical timezone changes are outside scope.

The BS lookup table contains 12 month lengths per year, in this order:
Baisakh, Jestha, Asar, Shrawan, Bhadra, Aswin, Kartik, Mangsir, Poush, Magh,
Falgun, and Chaitra. The current generated file contains 2081–2084, checked
against Hamro Patro's published date mappings. The existing 2081–2083 month
lengths matched the source and did not need correction.

The anchor is **1 Baisakh 2081 = 13 April 2024 at midnight in Nepal**. Generated
rows include the Gregorian start from the source, which must agree with the
previous year's end. Totals are 366 for 2081 and 365 for 2082–2084. The code
rejects invalid month lengths, impossible dates, gaps and inconsistent totals.

For each update:

```text
day percentage  = elapsed milliseconds since Nepal midnight / 86,400,000 × 100
year percentage = elapsed milliseconds since BS year start / milliseconds in that BS year × 100
```

BS date conversion counts complete days from the current year start, then walks
the month's lengths. Year windows include the start and exclude the end, so
New Year resets correctly at midnight. Percentages remain within 0–100.

The supported interval is **2024-04-13T00:00:00+05:45**, inclusive, to
**2028-04-13T00:00:00+05:45**, exclusive. This range grows with validated source
updates. Outside it, conversion and year progress
return `null`. The page displays an unavailable notice and a Gregorian date;
it continues displaying Nepal day progress and time.

The redesigned display uses consistent terracotta/peach progress colors. The
original threshold utility remains available for compatibility. The main display
and year summary show two decimals; the day ring shows one, while its accessible
progress value retains five. One one-second timer drives the dashboard, pauses
while the tab is hidden, and refreshes immediately when the visitor returns.

Week boundaries use Sunday at midnight in Nepal, with seven equal days. Month
boundaries come from the same BS table as date conversion. Day/week views remain
available outside the BS table's support interval. Remaining day counts exclude
the current partial day. The hour/minute countdown rounds up to the next minute.

### Maintaining the calendar

Run `npm run calendar:sync` to refresh the previous, current and following BS
year. For a specific range, run `npm run calendar:sync -- --from 2081 --through
2084` (one to four consecutive years). Do not edit the generated date rows or
assume that next year's month lengths match this year's.

The updater reads `hp-bootstrap`, the JSON embedded in Hamro Patro's public
English calendar pages. Each page supplies three months, so four requests cover
a year. Every in-month BS day must map to a consecutive Gregorian date, all 12
months must be complete, and year boundaries must agree with the preserved
history. The replacement is written only after the whole candidate passes
validation. Network, source-format or validation failures preserve the old file.

The GitHub workflow runs daily at approximately **00:22 Nepal time** (18:37 UTC),
with a manual dispatch option. It commits only `public/assets/data/nepali-calendar.js` after `npm test`
passes. It must be pushed to the default branch, Actions must be enabled, and
repository/branch permissions must allow the data commit. Calendar commits use
`[skip netlify]` so refreshes do not change the existing live deployment. Remove
that marker from the workflow only when automatic publication is intended.
The tracked `netlify.toml` declares `public/` as the publish folder. Netlify
account settings are unchanged.

This is a public-page integration rather than a documented calendar API. A source
layout change fails visibly in GitHub Actions instead of silently accepting
guessed dates. Future published dates may be revised; subsequent successful
checks pick up revisions. Visitors load the local copy and never scrape the
provider. The UI links to the current Hamro Patro month and shows its check date.

Useful references:

- [Hamro Patro: Baisakh 2081](https://www.hamropatro.com/calendar/2081/1), the anchor calendar.
- [Hamro Patro: Aswin 2083](https://www.hamropatro.com/calendar/2083/6), including Aswin 31 on 17 October 2026.
- [Hamro Patro: Mangsir 2083](https://www.hamropatro.com/calendar/2083/8), starting on 17 November 2026.
- [Hamro Patro: Baisakh 2084](https://www.hamropatro.com/en/calendar/2084/1), starting on 14 April 2027.
- [Hamro Patro: Baisakh 2085](https://www.hamropatro.com/en/calendar/2085/1), the end boundary on 13 April 2028.
- [Nepali-Date's calendar table](https://github.com/subeshb1/Nepali-Date/blob/master/src/date-config.ts), a cross-check matching the retained rows.

## Firebase data and behavior

The projects remain separate and retain their original configuration. Each app
is initialized once by name and reused. The active page does not initialize a
default Firebase app or the historical geolocation project.

| Named app | Firebase project | Path | Intended use |
| --- | --- | --- | --- |
| `contact` | `the-progressbar-form-database` | `/messages/{pushId}` | Contact submissions for the owner. |
| `publicMessages` | `form-firebase-realtimedata` | `/messages/{pushId}` | Messages visible to visitors. |

Contact record:

```json
{ "email": "person@example.com", "message": "Hello" }
```

Public record after Firebase resolves its server timestamp:

```json
{ "text": "Make today count.", "timestamp": 1794420900000 }
```

The board also accepts historical string timestamps when reading records.
Malformed records are skipped and invalid timestamps display `Date unavailable`.

Forms reject empty/whitespace-only messages, disable duplicate submission while
pending, and announce a result. Success is shown only after Firebase acknowledges
the write. Failed submissions preserve the visitor's input. An offline SDK can
leave a write pending until connectivity returns; the page does not falsely
report success or automatically retry a second write.

Public subscriptions use `orderByKey().limitToLast(50)`. The displayed set is
ordered by Firebase push keys, with the newest messages last. Added, changed,
and removed records are handled, and the DOM is bounded to 50 entries. Visitor
content is always assigned through `textContent`, never interpreted as HTML.
The board supports 2,000-character messages; contact fields allow 254-character
emails and 5,000-character messages.

Client validation and named apps do not enforce database privacy. Firebase Rules
must enforce the intended contact read restrictions, public board permissions,
types, and length limits. Rules, quotas, moderation, and App Check configuration
are external to this repository and have not been inspected or changed here.
There is no built-in authentication, moderation, or server-side spam control.

References: [Firebase multiple projects](https://firebase.google.com/docs/web/learn-more#multiple-projects),
[write acknowledgements](https://firebase.google.com/docs/database/web/read-and-write),
and [SDK release notes](https://firebase.google.com/support/release-notes/js).

## Browser state and external services

- `localStorage.darkmode`: `enabled` or `disabled`; absent means follow the system theme.
- `localStorage.visitorCount`: visits in this browser profile and origin, including the current load.
- Storage exceptions are caught; the dashboard and theme switch still work.
- The legacy visit number is retained locally for continuity and no longer displayed.
- Google Analytics retains the original `G-K4R6YR707D` integration.
- Google Fonts (Manrope and DM Sans) are optional; system sans-serif fallbacks
  keep text readable if they fail.
- The active page does not call geolocation APIs or send coordinates.

## Development and verification

Run `npm run dev` for local preview and `npm test` for automated checks. Both use
Node.js 22+ with no install step. The server binds to loopback, serves `/` as
`public/index.html`, supports GET/HEAD, and serves only files below `public/`.
It excludes hidden paths and unsupported file
types (including SVG). It is a development tool, not a production server.
On Windows, `npm.cmd` can be used when PowerShell blocks `npm.ps1`.

Calendar tests verify known dates, every supported month boundary, New Year,
midnight, exact color thresholds, invalid dates, unsupported dates, and results
under several machine timezones. Integration tests execute production scripts
against controlled DOM/Firebase boundaries, including failed writes, duplicate
submissions, blocked SDK/storage, malicious message text, subscription limits,
and timer visibility. These checks never write to live databases. They do not
prove that deployed Firebase Rules permit or restrict the intended operations.
Calendar refresh tests also check a reduced real Hamro Patro date fixture,
changed formats, malformed dates, atomic failure behavior, successful updates,
fallback data and the 2084 New Year/leap-year boundary. Automated tests use
fixtures; only the explicit sync command fetches live calendar pages.

`npm run test:browser` runs Chrome checks at 320, 375, 480, 768, 1024, and 1440
pixels, all four period controls, month selection, theme persistence, keyboard
activation, offline services, board expansion, and archive navigation. Set
`CHROME_PATH` when Chrome is not at its usual Windows path. Screenshots are written
to ignored `artifacts/`. The browser suite fixes its date to 12 November 2026 and
blocks external services; it never submits to a live database.

## Original site archive

The footer's **The original site / ARCHIVE** link opens `/archive/v1/index.htm`
(repository path: `public/archive/v1/index.htm`).
Its local CSS, scripts, and images were copied before the redesign. `original.htm`
preserves the original HTML byte-for-byte. The browsable entry point adds a
return banner, disables historical forms, and does not load the old analytics,
Firebase, or automatic geolocation scripts. Its clock and bars retain historical
calendar behavior. The redesigned site consistently uses Nepal time.

For manual checks, inspect narrow and wide screens, use Tab/Enter on the theme
and board controls, submit valid and whitespace-only forms, and test with external
services blocked. Publish only `public/`; it is the complete static site and
requires no build output. `index.html` is the canonical entry point, while
`index.htm` redirects old bookmarks and preserves query parameters and hashes.

## Search metadata and creator identity

The homepage identifies Sujeet Khadka in the title, description, visible byline
and creator section. Links point to his separate portfolio at
`https://www.sujeetkhadka.com.np/`. Static JSON-LD connects the project `WebSite`
and `WebPage` to a `Person`; it does not treat the dashboard as a portfolio page.
The canonical URL remains `https://the-progressbar-np.netlify.app/`, consistent
with the sitemap and Open Graph URL. Search content is present in the initial
HTML and does not depend on the clock or Firebase scripts.

The archive stays crawlable but receives `X-Robots-Tag: noindex, follow` from
Netlify and the local server, including the unmodified source snapshot. Its
browsable entry point also carries noindex metadata. Both legacy homepage paths
redirect to `/` with HTTP 301 responses and preserve query parameters.

See [SEO.md](SEO.md) for the asset regeneration command, canonical-domain changes
and live Search Console steps. Structured data and metadata do not guarantee
rankings; publication, crawling and measured search performance remain separate
from local verification.

## Improvements in this pass

- Separated calendar logic from DOM code, aligned timezones, and made unsupported
  dates explicit rather than silently freezing at the table's last date.
- Fixed midnight's 12-hour representation; retained the legacy local visit
  counter without displaying it as a visitor statistic.
- Replaced conflicting default Firebase initialization with isolated named apps
  and a matching compat SDK pair; added acknowledged saves and error feedback.
- Removed HTML injection from the message board, bounded its query and rendering,
  and retained compatibility with historical timestamp strings.
- Replaced fixed overflowing widths and redundant CSS with responsive layouts,
  real labels/buttons, progress semantics, keyboard focus, and dark form surfaces.
- Removed automatic geolocation from the active page and redundant icon/font
  dependencies, while retaining the historical source files.
- Added a dependency-free preview command and focused regression coverage.
- Added a warm responsive redesign, four live period views, a day ring,
  selectable months and a year of dots, with no production dependencies.
- Archived the original site with a footer link and return banner.
