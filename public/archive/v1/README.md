# The original Progressbar Np

Snapshot taken before the November 2026 redesign. `original.htm` and the original
assets preserve the source as it existed in the working directory.

The browsable `index.htm` keeps the original layout, clock, progress bars, theme,
and particles. A small banner returns to the current site. Historical contact
and message forms are read only; obsolete Firebase scripts, analytics and automatic
geolocation are not loaded by this archive page. This avoids sending new visitor
data from an archival experience. These adjustments do not modify `original.htm`.

Calendar calculations in this historical version use the visitor's local timezone
and the original date table. The current dashboard uses Nepal time consistently.

The archive remains accessible from the footer but is excluded from search
indexing. The browsable entry has a noindex meta tag; Netlify and the local server
also send `X-Robots-Tag: noindex, follow` for every archive resource, including
the unchanged `original.htm`. Other hosts should reproduce that HTTP rule.
