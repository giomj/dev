# JPL HORIZONS Attribution

**Canonical citation string** (use verbatim in every derived artifact):

> JPL Horizons System, NASA Jet Propulsion Laboratory / California Institute of Technology.

**License:** Public domain, NASA/JPL work (17 U.S.C. § 105). See [`../UPSTREAM_TERMS.md`](../UPSTREAM_TERMS.md) for the full audit.

**Upstream:** [ssd.jpl.nasa.gov/horizons](https://ssd.jpl.nasa.gov/horizons/)

**License identifier (machine-readable):** `public-domain-NASA`

## What TO do

- Cite the canonical string above on every ingested value's `source.citation` field.
- Always record `target_body` and `reference_frame` alongside any position/vector value.
- Batch requests via `STEP_SIZE`/`TLIST`; serialize rather than parallelize.

## What NOT to do

- Do not fetch a "planet position" without specifying `CENTER` (observer) — the same nominal position differs by observer/frame.
- Do not build time-critical automation against HORIZONS without a fallback; JPL does not commit to an uptime SLA.
