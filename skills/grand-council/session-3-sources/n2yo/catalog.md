# n2yo.com — Source Catalog

**Site:** https://www.n2yo.com/
**API base:** `https://api.n2yo.com/rest/v1/satellite/`
**Ingested:** 2026-07-18

## Scope

- **Objects tracked:** 34,799 (as of 2026-07-18)
- **N2YO-owned objects:** 3,475
- **Category count:** 57 (see `endpoints.md`)
- **Time domain:** Real-time positions, near-term pass predictions (≤ 10 days), current TLEs

## Site sections

| Section | Purpose |
|---|---|
| **What's Up?** | Live pass listings for amateur radio, GPS, Glonass, Beidou, Galileo, Iridium, Globalstar |
| **Find a Satellite** | Search database, browse by launch date / category / country |
| **Alerts** | ISS predictions by voice, email/SMS notifications |
| **Live tracking** | Draw orbits, footprint, keep selection centered |
| **API access** | Documented REST v1 with key required |

## Data model

- Every object identified by **NORAD ID** (integer) and **International Designator** (YYYY-NNNAAA)
- Positions returned in decimal degrees + altitude in km
- Passes: startAz / maxAz / endAz (with compass point), UTC timestamps, magnitude (visual only), duration
- Uses **standard SGP4-propagated TLEs** — the canonical two-line element format

## Evidence tier

- **Aggregator / operational**. Not primary — TLEs are sourced from USSPACECOM/Space-Track. n2yo is a convenient real-time skin.
- Correct for real-time operational use (radio-passes for amateur ops, ISS pass alerts) but not the source of record.

## Claims Under Review (for council)

- **C1** — n2yo tracks the same NORAD catalog as Space-Track / Celestrak; TLE format is standard SGP4 two-line elements.
- **C2** — REST API is rate-limited per-verb (1000/hr for tle+positions, 100/hr for visualpasses+radiopasses+above) — sufficient for a single-user client but not a public app backend.
- **C3** — Category taxonomy (57 categories, integer IDs 1-57) is n2yo-editorial, not an official NORAD schema.
