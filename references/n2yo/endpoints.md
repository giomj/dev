# n2yo REST API v1 — Endpoints

**Base URL:** `https://api.n2yo.com/rest/v1/satellite/`
**Auth:** `&apiKey={key}` at end of every URL. Register at n2yo.com → profile page → generate key.
**Method:** GET only.
**Format:** JSON.

## Endpoints

| # | Endpoint | Path | Rate limit / hr |
|---|---|---|---:|
| 1 | Get TLE | `/tle/{id}` | 1000 |
| 2 | Get satellite positions | `/positions/{id}/{lat}/{lng}/{alt}/{seconds}` | 1000 |
| 3 | Get visual passes | `/visualpasses/{id}/{lat}/{lng}/{alt}/{days}/{min_visibility}` | 100 |
| 4 | Get radio passes | `/radiopasses/{id}/{lat}/{lng}/{alt}/{days}/{min_elevation}` | 100 |
| 5 | What's up | `/above/{lat}/{lng}/{alt}/{search_radius}/{category_id}` | 100 |

### Parameters (positions)

- `id` (int, req) — NORAD ID
- `observer_lat` (float, req) — decimal degrees
- `observer_lng` (float, req) — decimal degrees
- `observer_alt` (float, req) — meters ASL
- `seconds` (int, req) — future positions, one per second. **Max 300.**

### Parameters (visualpasses / radiopasses)

- Same first 4 params
- `days` (int, req, max 10) — prediction window
- Visual: `min_visibility` (int, req) — minimum seconds optically visible
- Radio: `min_elevation` (int, req) — minimum elevation degrees for pass peak

### Parameters (above)

- Same first 3 params
- `search_radius` (int, req, 0-90) — degrees from zenith
- `category_id` (int, req) — 0 = all, else see category table

## Category table (n2yo taxonomy)

| ID | Category | ID | Category |
|---:|---|---:|---|
| 1 | Brightest | 30 | Military |
| 2 | ISS | 31 | Radar Calibration |
| 3 | Weather | 32 | CubeSats |
| 4 | NOAA | 33 | XM and Sirius |
| 5 | GOES | 34 | TV |
| 6 | Earth resources | 35 | Beidou Navigation |
| 7 | Search & rescue | 36 | Yaogan |
| 8 | Disaster monitoring | 37 | Westford Needles |
| 9 | TDRSS | 38 | Parus |
| 10 | Geostationary | 39 | Strela |
| 11 | Intelsat | 40 | Gonets |
| 12 | Gorizont | 41 | Tsiklon |
| 13 | Raduga | 42 | Tsikada |
| 14 | Molniya | 43 | O3B Networks |
| 15 | Iridium | 44 | Tselina |
| 16 | Orbcomm | 45 | Celestis |
| 17 | Globalstar | 46 | IRNSS |
| 18 | Amateur radio | 47 | QZSS |
| 19 | Experimental | 48 | Flock |
| 20 | GPS Operational | 49 | Lemur |
| 21 | Glonass Operational | 50 | GPS Constellation |
| 22 | Galileo | 51 | Glonass Constellation |
| 23 | SBAS | 52 | Starlink |
| 24 | Navy NSS | 53 | OneWeb |
| 25 | Russian LEO Nav | 54 | Chinese Space Station |
| 26 | Space & Earth Sci | 55 | Qianfan |
| 27 | Geodetic | 56 | Leo |
| 28 | Engineering | 57 | GeeSAT |
| 29 | Education | | |

## Response schemas — see `samples/`
