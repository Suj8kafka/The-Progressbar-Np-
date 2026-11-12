# Search visibility for Sujeet Khadka

This project is optimized to identify **Sujeet Khadka** as the creator of
The Progressbar Np and connect that work to his personal portfolio. The scope
is this repository; the separate portfolio's source and hosting are unchanged.

| Purpose | URL |
| --- | --- |
| Canonical project homepage | https://the-progressbar-np.netlify.app/ |
| Creator's portfolio | https://www.sujeetkhadka.com.np/ |
| Design notes | https://blog.sujeetkhadka.com.np/ |
| Project sitemap | https://the-progressbar-np.netlify.app/sitemap.xml |

The project and portfolio are different pages. Do not canonicalize this
dashboard to the portfolio: its canonical belongs to the project homepage.

## Implemented signals

- The HTML title is **The Progressbar Np by Sujeet Khadka — Nepal Time**.
- The description and author metadata identify the project and creator.
- A visible byline and creator section link to the portfolio with `rel="author"`.
- The creator biography describes the UI/UX and visual design role presented on
  the public portfolio. It adds no unverified awards, credentials or ratings.
- JSON-LD links `WebSite` and `WebPage` to a `Person` identified as Sujeet Khadka.
  This describes the actual page and its visible authorship; the dashboard is
  not marked as a personal profile page.
- Open Graph and Twitter metadata share the canonical project URL and a
  1200 × 630 PNG preview. Its editable source is
  `public/assets/images/social-card.svg`.
- `public/sitemap.xml` lists the canonical homepage only.
- `public/robots.txt` permits crawling and points to the sitemap.
- Netlify redirects `/index.htm` and `/index.html` permanently to `/`.
- The archive has `noindex, follow` through a Netlify HTTP header. Its browsable
  entry point also carries a robots meta tag. The raw `original.htm` snapshot is
  unchanged; its exclusion is supplied by the HTTP header.

The local preview server mirrors those redirects and archive headers, and serves
robots.txt and sitemap.xml with the correct content types. Other static hosts
must reproduce the HTTP rules in `netlify.toml`.

Keep the archive crawlable so search engines can read the `noindex` response.
Do not add a robots.txt disallow rule for it.

## Verification and publication

Netlify should deploy `main` automatically and publish `public/`, with a blank
base directory and build command. Scheduled calendar commits follow this same
deployment flow. Avoid `[skip netlify]` and `[skip ci]` in production commit
messages; either marker prevents deployment. After a skipped push, push a new
commit without those markers or use **Deploys → Trigger deploy → Deploy site**
in Netlify to publish the latest `main` revision.

Run `npm test` for metadata, canonical/sitemap consistency, structured-data
relationships, image dimensions, redirects and archive headers, alongside the
calendar and integration checks. `npm run test:browser` checks creator links,
responsive layouts and the rest of the live dashboard.

After editing the preview SVG, regenerate the PNG explicitly:

```sh
node scripts/browser-check.cjs --export-social-image
```

Chrome is required; set `CHROME_PATH` if necessary. This also runs browser QA.
Normal tests do not regenerate deployable image assets.

Once the changes are deployed to the project's production site:

1. Check the homepage, `/robots.txt` and `/sitemap.xml` on the live domain.
2. In the project's verified Google Search Console property, use URL Inspection
   on the canonical homepage and request indexing.
3. Submit `/sitemap.xml` in that property's Sitemaps report.
4. Filter Search Console's Search results report by the query **Sujeet Khadka**
   to monitor impressions, clicks and average position.

The existing Search Console verification meta tag is preserved. Possessing that
tag does not establish access to the user's private Search Console account.
This implementation does not submit requests or change account settings.

An appropriate project link from the main portfolio can support discovery and
make the relationship clear to visitors. That change belongs in the portfolio's
own repository, not in this dashboard's canonical metadata.

If the project moves to a custom domain, update the canonical, Open Graph URLs,
JSON-LD project URLs, sitemap and robots sitemap address together. Also update
the expected project domain in `tests/seo.test.cjs`. Keep the creator's portfolio
URL separate. The main portfolio's `www` address is used because it was the
publicly accessible version verified for this change.

Search engines must crawl and process the published changes. These improvements
clarify relevance and authorship; they do not promise a position, a knowledge
panel, or a rich result.

## References

- [Google: title links](https://developers.google.com/search/docs/appearance/title-link)
- [Google: canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google: structured data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [Google: noindex and crawling](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
- [Google: request a recrawl](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl)
- [Google: Search Console performance](https://support.google.com/webmasters/answer/7576553)
