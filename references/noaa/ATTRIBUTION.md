# NOAA SWPC Attribution

**Canonical citation string** (use verbatim in every derived artifact):

> NOAA Space Weather Prediction Center, U.S. Department of Commerce.

**License:** Public domain under 17 U.S.C. § 105. As a U.S. federal work, no license fee or permission is required to use, redistribute, or build upon this data. See [`../UPSTREAM_TERMS.md`](../UPSTREAM_TERMS.md) for the full rate-limit and legal-status audit.

**Upstream:** [services.swpc.noaa.gov](https://services.swpc.noaa.gov/)

**License identifier (machine-readable):** `public-domain-USG`

## What TO do

- Cite the canonical string above on every ingested value's `source.citation` field, even though no license technically requires it — this is the courtesy attribution called for in `UPSTREAM_TERMS.md`.
- Include `source.fetched_at_utc` on every record — SWPC products update on a fixed cadence and staleness matters.
- Distinguish `kp_index_3h` from `kp_index_1m` in every record's `event_kind` — they are not comparable.

## What NOT to do

- Do not poll faster than the native update cadence of the product (3 hours for planetary K-index; ~1 minute for solar wind).
- Do not present a solar-wind or Kp value without its `timestamp_utc` and product identity.
