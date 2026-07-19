# USGS Earthquake Hazards Program Attribution

**Canonical citation string** (use verbatim in every derived artifact):

> USGS Earthquake Hazards Program, U.S. Geological Survey.

**License:** Public domain, U.S. federal work. "You can copy, modify, distribute and perform the work, even for commercial purposes, all without asking permission." See [`../UPSTREAM_TERMS.md`](../UPSTREAM_TERMS.md) for the full audit.

**Upstream:** [earthquake.usgs.gov](https://earthquake.usgs.gov/)

**License identifier (machine-readable):** `public-domain-USG`

## What TO do

- Cite the canonical string above on every ingested value's `source.citation` field.
- Always report `magnitude_type` alongside `earthquake_magnitude` — mww, ml, md, mb, and ms are not interchangeable scales.
- Respect the documented 60-second cache window and the 20,000-event FDSN query cap if that endpoint is ever used.
- Abort cleanly on HTTP 429; do not retry-hammer.

## What NOT to do

- Do not present a bare magnitude number without its scale.
- Do not treat a fresh feed timestamp as proof of a new event — the summary feed is cached 60s server-side and may return a cached copy.
