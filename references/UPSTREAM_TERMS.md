# Public-Data Sources — Terms & Rate-Limit Audit

**Audited:** 2026-07-18
**Scope:** NOAA SWPC, USGS Earthquake, JPL HORIZONS
**Governance:** These are U.S. federal / NASA sources. Data is in the public domain
under U.S. copyright law (17 U.S.C. § 105 / NASA data policy). No license attribution
is legally required, but courteous attribution is customary and each source has
usage guidelines and rate-limit expectations documented below.

---

## NOAA Space Weather Prediction Center (SWPC)

### Legal status
NOAA does not post a source-specific public-domain statement on the SWPC site itself, but the
governing NOAA-wide policy is the **NOAA Open Data Dissemination (NODD)** program, which frames
NOAA data as unrestricted open data:

> "Open data with value to the public" / "No use restrictions or user registration" / "FULL & OPEN PUBLIC ACCESS" / "Open & Free" / "No egress costs"
([NOAA Open Data Dissemination Overview, weather.gov](https://www.weather.gov/media/climateservices/CPASW/2023/Thursday/Keown-NODD-CPASW.pdf))

The sibling NWS API (same agency, same open-data posture as SWPC) states the underlying legal
theory directly:

> "All of the information presented via the API is intended to be open data, free to use for any purpose."
> "As a public service of the United States Government, we do not charge any fees for the usage of this service, although there are reasonable rate limits in place to prevent abuse and help ensure that everyone has access."
([NWS API Web Service docs, weather.gov](https://www.weather.gov/documentation/services-web-api))

As a U.S. federal work, SWPC data is public domain under 17 U.S.C. § 105 ([Cornell LII](https://www.law.cornell.edu/uscode/text/17/105)); no license fee or permission is required.

### Endpoints of interest
- **Planetary K-index (observed, 3-hour cadence):** `https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json` — part of the JSON products directory ([services.swpc.noaa.gov/products/](https://services.swpc.noaa.gov/products/)). NOAA's service-change notice documents the 3-hour cadence directly: "Observed Planetary K Index (3-hour intervals)" ([NWS Service Change Notice SCN22-101](https://www.weather.gov/media/notification/pdf2/scn22-101_kp9m.pdf)).
- **Planetary K-index (forecast):** `https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json`.
- **Estimated Planetary K-index (1-minute):** `https://services.swpc.noaa.gov/json/planetary_k_index_1m.json` — "Estimated Planetary K Index (1 minute)" ([SCN22-101](https://www.weather.gov/media/notification/pdf2/scn22-101_kp9m.pdf)). The legacy Kp product page confirms: "This chart updates every minute." ([SWPC Planetary K-index product page](https://www.swpc.noaa.gov/index.php/products/planetary-k-index)).
- **Solar wind (ACE/DSCOVR real-time in-situ mag/plasma/ephemeris):** `https://services.swpc.noaa.gov/products/solar-wind/` — separate JSON files for mag, plasma, and ephemeris, each covering roughly the last 24 hours to 7 days at 1-minute resolution: "Real-time Solar Wind and Magnetometer data is now available in JSON format for up to the past 7 days from the SWPC Data Service." ([SWPC Real-Time Solar Wind](https://www.swpc.noaa.gov/products/real-time-solar-wind)). "The last 24 hours of in situ data is available via static JSON files. There are separate files for mag, plasma and ephemeris" ([spaceweather.gov Solar Wind Observations](https://www.spaceweather.gov/products/solar-wind)). Ground-station tracking plots update on a fixed cadence: "The 48 hour plot is updated every fifteen minutes and the 6 hour plot is updated every minute." ([DSCOVR Schedule Tracking](https://www.spaceweather.gov/products/ace-ground-station-tracking-plots)).
- **Root API / data service base:** `https://services.swpc.noaa.gov/` with sub-paths `/products`, `/json`, `/text`, `/images`, and an FTP archive `ftp.swpc.noaa.gov/pub/warehouse` ([SWPC Data Access page](https://www.spaceweather.gov/content/data-access)).
- **Long-term archive:** NOAA National Centers for Environmental Information (NCEI) is "the official long-term archive for SWPC data products" ([SWPC Data Access page](https://www.spaceweather.gov/content/data-access)).

### Rate limits (verbatim, with URL)
SWPC itself publishes no numeric rate-limit figure on its own docs. The clearest documented NOAA
posture (from the sibling NWS API, operated by the same parent agency under the same open-data
philosophy) is:

> "there are reasonable rate limits in place to prevent abuse and help ensure that everyone has access. The rate limit is not public information, but allows a generous amount for typical use. If the rate limit is execeed a request will return with an error, and may be retried after the limit clears (typically within 5 seconds). Proxies are more likely to reach the limit, whereas requests directly from clients are not likely."
([NWS API Web Service docs, weather.gov](https://www.weather.gov/documentation/services-web-api))

A third-party API-cataloging service corroborates SWPC's own posture specifically:

> "services.swpc.noaa.gov serves static JSON, text, and image files updated on cadence (1 minute to daily). No published rate limit; clients should cache responses and respect refresh intervals to avoid edge throttling."
([APIs.io NOAA rate-limit profile](https://apis.io/rate-limits/noaa-gov/noaa-gov-rate-limits/))

**Practical implication:** treat SWPC files as static-by-URL resources refreshed on a fixed
schedule (1 minute for solar wind/1-min Kp, 3 hours for observed/forecast Kp) — polling more often
than the update cadence returns identical data and wastes requests/bandwidth.

### Recommended attribution string
No SWPC-specific attribution template is published. Following NOAA-wide convention and the NODD
program's ask for "appropriate metadata" alongside redistributed open data ([NOAA NODD Overview](https://www.weather.gov/media/climateservices/CPASW/2023/Thursday/Keown-NODD-CPASW.pdf)), use:

> "Data: NOAA / NWS Space Weather Prediction Center (services.swpc.noaa.gov), retrieved [timestamp]."

### Ingest hygiene
- **User-Agent:** NOAA's own API guidance requires a descriptive User-Agent on the sibling NWS API: "A User Agent is required to identify your application. ... If you include contact information (website or email), we can contact you if your string is associated to a security event." ([NWS API docs](https://www.weather.gov/documentation/services-web-api)). Apply the same practice to SWPC: `GrandCouncilArchive/0.1 (contact: james@grand-council.local)`.
- **Caching recommendation:** Cache each JSON product for the duration of its native update cadence — 1 minute for `planetary_k_index_1m.json` and solar-wind mag/plasma/ephemeris files; 3 hours for `noaa-planetary-k-index.json` and the forecast file. Re-fetching faster than cadence returns stale/duplicate data per the APIs.io profile note above.
- **TOS clauses on automated access:** None SWPC-specific found; no API key or registration is required for the JSON/text/image data service. Best-practice guidance from NOAA's sister API (weather.gov) — set a descriptive User-Agent, avoid proxy fan-out, and expect throttling only under abusive load — should be assumed to apply by analogy.

---

## USGS Earthquake Hazards Program

### Legal status
USGS earthquake data is a work of the U.S. government and resides in the public domain. The clearest
verbatim confirmation (from the USGS-authored R package license, describing USGS-origin content
generally) states:

> "Unless otherwise noted, This project is in the public domain in the United States because it contains materials that originally came from the United States Geological Survey, an agency of the United States Department of Interior... You can copy, modify, distribute and perform the work, even for commercial purposes, all without asking permission."
([USGS dataRetrieval LICENSE](https://doi-usgs.github.io/dataRetrieval/LICENSE.html))

USGS's own EROS data-citation guidance echoes this for USGS-produced datasets generally:

> "Most of the images, data, and related products available from the USGS Earth Resources Observation and Science (EROS) Center are federally created data and therefore reside in the public domain and may be used, transferred, or reproduced without copyright restriction."
([USGS Data Citation](https://www.usgs.gov/centers/eros/data-citation))

### Endpoints of interest
- **GeoJSON Summary Feeds (real-time earthquake feed):** `https://earthquake.usgs.gov/earthquakes/feed/v1.0/` — pre-built feeds bucketed by magnitude and time window (hour/day/week/month), refreshed on a rolling basis; production version is v1.0 ([Feed Life Cycle Policy](https://earthquake.usgs.gov/earthquakes/feed/policy.php)).
- **FDSN Event Web Service (query API):** `https://earthquake.usgs.gov/fdsnws/event/1/` — parameterized queries (bounding box, time range, magnitude, etc.). Hard cap: "The service limits queries to 20000, and any that exceed this limit will generate a HTTP response code '400 Bad Request'." ([FDSN Event API docs](https://earthquake.usgs.gov/fdsnws/event/1/)).
- **Update/caching cadence:** "Feeds and API responses are cached for 60 seconds. Checking more frequently will not return new data any faster." ([USGS Realtime-feeds mailing list, rate-limiting announcement](https://geohazards.usgs.gov/pipermail/realtime-feeds/2022-January/000028.html)). Note also: "many events outside the US are not reported until 15+ minutes after origin time" (same source).

### Rate limits (verbatim, with URL)
USGS explicitly implemented rate limiting on both the feeds and the FDSN service in January 2022:

> "We recently implemented rate-limiting for the USGS Earthquake Feeds and FDSN Event Web Service. These changes are intended to improve availability for all users. ... If you exceed the rate limit, you will receive a '429 Too Ma[n]y Requests' HTTP response."
([USGS Geologic Hazards Science Center, Realtime-feeds mailing list](https://geohazards.usgs.gov/pipermail/realtime-feeds/2022-January/000028.html))

The same notice recommends concrete ingest optimizations:

> "Feeds and API responses support compression. Compressed responses are 70+% smaller and significantly faster. The http request header 'accept-encoding: gzip' enables a gzip compressed response."
> "Properties in the summary feed should be used to reduce details requests: 'updated' is a timestamp that changes when an event has new information. If the updated property has not changed since a previous details request, there are no changes since the previous request."
(same source)

No published numeric requests-per-minute figure exists for the FDSN/feed services; USGS instead
gates via the 60-second cache window and 429 backoff signal. Community operational guidance
converges on staying well under a few requests/second sustained against the FDSN endpoint, while the
CDN-fronted GeoJSON summary feeds tolerate higher polling rates because they are static-by-URL.

### Recommended attribution string
No mandatory citation format is enforced (public domain — "without asking permission"), but the
customary USGS-recommended data citation form (per general USGS citation practice) is:

> "Earthquake data: U.S. Geological Survey, Earthquake Hazards Program (earthquake.usgs.gov), retrieved [timestamp]."

### Ingest hygiene
- **User-Agent:** Not contractually required by any USGS clause found, but strongly recommended given USGS actively rate-limits and monitors traffic; set a descriptive string, e.g. `GrandCouncilArchive/0.1 (contact: james@grand-council.local)`.
- **Caching recommendation:** Respect the documented 60-second cache window — polling more frequently returns identical cached data ([USGS rate-limiting announcement](https://geohazards.usgs.gov/pipermail/realtime-feeds/2022-January/000028.html)). Use `accept-encoding: gzip` on every request. For the FDSN Event service, paginate with `limit`/`offset` rather than requesting unbounded result sets — anything over 20,000 events is rejected outright ([FDSN Event API docs](https://earthquake.usgs.gov/fdsnws/event/1/)).
- **TOS clauses on automated access:** The Feed Life Cycle Policy asks integrators to track versioning: "Users may reference a specific version of a feed. If a version is not specified, the production version will be used." Production feeds are guaranteed for "at least 6 months," with "at least 30 days advance notice before a feed is deprecated" ([USGS Feed Life Cycle Policy](https://earthquake.usgs.gov/earthquakes/feed/policy.php)) — pin to the v1.0 feed explicitly and monitor the mailing list ("Users should subscribe to the API mailing list to be informed of feed changes and updates to the policy," same source) for deprecation notices.

---

## JPL HORIZONS

### Legal status
HORIZONS is operated by JPL's Solar System Dynamics (SSD) Group, a NASA facility; as a NASA/JPL
product it falls under the same public-domain regime as other U.S. government works (17 U.S.C. § 105).
No source-specific public-domain disclaimer is posted on the HORIZONS pages themselves, but the
system's own attribution block (auto-emitted in every query result) functions as the de facto
sourcing statement:

> "Computations by ... Solar System Dynamics Group, Horizons On-Line Ephemeris System, 4800 Oak Grove Drive, Jet Propulsion Laboratory, Pasadena, CA 91109 USA. Information: http://ssd.jpl.nasa.gov/ ... Inquiries: contact-ssd@jpl.nasa.gov"
([Horizons API documentation, ssd-api.jpl.nasa.gov](https://ssd-api.jpl.nasa.gov/doc/horizons.html))

### Endpoints of interest
- **Root API endpoint:** `https://ssd.jpl.nasa.gov/api/horizons.api` (GET and POST interfaces) — "This API provides access to JPL's Horizons system by specifying Horizons settings as parameters in the URL. An alternate file-based Horizons API is available if you would prefer to submit a Horizons batch input file via HTTP POST." ([Horizons API docs](https://ssd-api.jpl.nasa.gov/doc/horizons.html)).
- **Ephemeris types supported:** observer tables, and geocentric/heliocentric state vectors and orbital elements for planets, satellites, comets, and asteroids — the audit's target use case (planetary positions, geocentric/heliocentric vectors) is a first-class, documented API mode.
- **Step-size / time-list limits:** "The Horizons `TLIST` parameter allows specification of up to 10,000 discrete output times, though URL length limits may impose smaller limits depending on local software" and "Horizons output steps must be greater than 0.5 seconds" ([Horizons API docs](https://ssd-api.jpl.nasa.gov/doc/horizons.html)).
- **Alternate access modes:** interactive web app (`https://ssd.jpl.nasa.gov/horizons/app.html`), Telnet/command-line (`telnet ssd.jpl.nasa.gov 6775`, no account/password required), and email batch interface (`horizons@ssd.jpl.nasa.gov`, subject "BATCH-LONG") ([Horizons System page](https://ssd.jpl.nasa.gov/horizons/)).
- **Availability caveat:** "Horizons can be used for real-time operations; however, as with any networked system, users should expect the system to be available on a best-effort basis. We strongly recommend that planning for critical tasks relying on Horizons include an allowance for potential unforeseen outages." ([Horizons System page, ssd.jpl.nasa.gov](https://ssd.jpl.nasa.gov/horizons/)).

### Rate limits (verbatim, with URL)
No numeric rate limit is published anywhere in the HORIZONS System page, the HORIZONS manual, or the
API documentation. This is confirmed by direct review of the primary docs (`ssd.jpl.nasa.gov/horizons/`,
`ssd.jpl.nasa.gov/horizons/manual.html`, `ssd-api.jpl.nasa.gov/doc/horizons.html`) — none contain the
words "rate limit," "throttle," or a requests-per-minute figure. The only throttling-adjacent guidance
is the general best-effort/outage disclaimer quoted above, plus a version-pinning caution for
automated clients:

> "For automated systems, [check] the JSON payload `signature` object for the API `version`; if the version does not match the version in the document, there is no guarantee that the format has not changed."
([Horizons API docs, ssd-api.jpl.nasa.gov](https://ssd-api.jpl.nasa.gov/doc/horizons.html))

**Practical implication:** treat the absence of a published limit as a signal for extra self-imposed
conservatism, not permission to burst. HORIZONS is a shared scientific-computation service (not a CDN
cache of static files like SWPC/USGS), so each query consumes real server-side computation.

### Recommended attribution string
Use the system's own self-identifying signature block, condensed:

> "Ephemeris data: NASA/JPL Horizons System, Solar System Dynamics Group, Jet Propulsion Laboratory (https://ssd.jpl.nasa.gov/horizons/), retrieved [timestamp]."

This mirrors the `"source": "NASA/JPL Horizons API"` field JPL itself emits in the JSON `signature`
object of every API response ([Horizons API docs](https://ssd-api.jpl.nasa.gov/doc/horizons.html)).

### Ingest hygiene
- **User-Agent:** Not contractually required (no clause found), but recommended as general good practice for any automated NASA/JPL API client: `GrandCouncilArchive/0.1 (contact: james@grand-council.local)`.
- **Caching recommendation:** Cache ephemeris results aggressively and compute only the time-spans actually needed — planetary positions for well-characterized bodies change predictably, so a batch of `TLIST` points (up to the documented 10,000-point cap) is far more efficient than one query per timestamp ([Horizons API docs](https://ssd-api.jpl.nasa.gov/doc/horizons.html)). Re-query only when new data (e.g. updated orbital elements) is expected — not on a fixed short poll interval.
- **TOS clauses on automated access:** None found restricting automated/API use — the API is explicitly built for "programatic control of the Horizons system" ([Horizons System page](https://ssd.jpl.nasa.gov/horizons/)). The only durable caution is the best-effort/outage disclaimer: do not build time-critical or safety-critical automation against HORIZONS without a fallback, since JPL does not commit to an uptime SLA.

---

## Aggregate policy for our ingest scripts

- **Set a descriptive User-Agent identifying the project** on every request to all three sources: `GrandCouncilArchive/0.1 (contact: james@grand-council.local)`. NOAA's sibling weather.gov API makes this an explicit requirement ("A User Agent is required to identify your application" — [NWS API docs](https://www.weather.gov/documentation/services-web-api)) and it is best practice for USGS and JPL even though not contractually mandated there.

- **Rate-limit our own scripts conservatively, per source:**
  - *NOAA SWPC:* Poll each JSON product no faster than its native update cadence — 1 minute for solar-wind mag/plasma/ephemeris and `planetary_k_index_1m.json`; 3 hours for `noaa-planetary-k-index.json` / forecast file ([SCN22-101](https://www.weather.gov/media/notification/pdf2/scn22-101_kp9m.pdf); [APIs.io NOAA profile](https://apis.io/rate-limits/noaa-gov/noaa-gov-rate-limits/)).
  - *USGS Earthquake:* Respect the documented 60-second server-side cache window on both feeds and FDSN ([USGS rate-limiting notice](https://geohazards.usgs.gov/pipermail/realtime-feeds/2022-January/000028.html)); poll summary feeds at ≥60s intervals, keep FDSN query bursts well under a few requests/second sustained, and always use `accept-encoding: gzip`.
  - *JPL HORIZONS:* No published numeric limit — self-impose a conservative pace (e.g., serialize requests, avoid parallel bursts) since each query is a live computation, not a cached file; batch time-spans via `TLIST`/`STEP_SIZE` instead of issuing one request per timestamp.

- **Cache aggressively; refresh only at documented update frequencies** — see per-source cadence above. Store the raw payload plus fetch metadata so re-processing never requires re-fetching.

- **Include the source URL + fetch timestamp in every ingested record** — e.g. `{"source_url": "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json", "fetched_at": "2026-07-18T21:09:00-05:00"}`. This also satisfies the spirit of NOAA NODD's "appropriate metadata provided" expectation ([NOAA NODD Overview](https://www.weather.gov/media/climateservices/CPASW/2023/Thursday/Keown-NODD-CPASW.pdf)).

- **Recommended attribution strings to emit alongside each dataset:**
  - NOAA SWPC: *"Data: NOAA / NWS Space Weather Prediction Center (services.swpc.noaa.gov), retrieved [timestamp]."*
  - USGS Earthquake: *"Earthquake data: U.S. Geological Survey, Earthquake Hazards Program (earthquake.usgs.gov), retrieved [timestamp]."*
  - JPL HORIZONS: *"Ephemeris data: NASA/JPL Horizons System, Solar System Dynamics Group, Jet Propulsion Laboratory (https://ssd.jpl.nasa.gov/horizons/), retrieved [timestamp]."*

**Overall risk assessment:** All three sources are public domain with no licensing blocker. The
only clauses that could "bite" an automated ingest job are (1) USGS's actively enforced 429
rate-limiting on the FDSN/feed services if polled faster than the 60-second cache window, and
(2) HORIZONS' complete absence of a published SLA or rate limit, which cuts both ways — no hard
wall to hit, but also no guaranteed capacity, so self-imposed pacing and outage tolerance are the
ingest job's own responsibility.
