# OWID Attribution

**Canonical citation string** (use verbatim in every derived artifact — dual attribution is mandatory):

> Our World in Data, ourworldindata.org, CC BY 4.0 — with upstream attribution per dataset (Global Carbon Budget v15, Maddison Project 2023, Ember).

**License:** [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) covers OWID's **own** processing, site content, and code output. It does **not** relicense upstream third-party data — every value additionally carries its own upstream license. See [`UPSTREAM_LICENSES.md`](./UPSTREAM_LICENSES.md) for the full per-dataset audit.

**License identifier (machine-readable):** `CC BY 4.0` (OWID layer) — combined per-row with the upstream `sub_source` license (`CC BY 4.0` for Ember/Global Carbon Budget/Maddison; **never** `© Energy Institute` rows, which are excluded from ingest).

**Upstream:** [ourworldindata.org](https://ourworldindata.org/)

## Dual attribution is mandatory

Per OWID's own FAQ: "you must credit both Our World in Data *and* the underlying third-party data provider." Every ingested record's `source.citation` field must include **both** the OWID credit and the upstream provider's verbatim citation string (see the per-dataset strings in `UPSTREAM_LICENSES.md` §3.1).

| Dataset | In-line attribution string to emit |
|---|---|
| CO₂ per capita | `Global Carbon Budget (2025); Population based on various sources (2024) – with major processing by Our World in Data` |
| CO₂ per GDP | `Global Carbon Budget (2025); Bolt and van Zanden – Maddison Project Database 2023 – with major processing by Our World in Data` |
| Electricity generation mix (Ember rows only) | `Ember (2026) – with major processing by Our World in Data` |
| Renewable electricity share (Ember rows only) | `Ember (2026) – with major processing by Our World in Data` |

## What TO do

- Always emit both the OWID credit and the upstream provider credit.
- Always preserve `sub_source` per row.
- Always check for HTTP 403 on every fetch and halt loudly if seen.

## What NOT to do

- Do not ingest `energy-consumption-by-source-and-country` — BLOCKED, see `catalog.md` and `UPSTREAM_LICENSES.md` §3.3.
- Do not retain Energy-Institute-sourced rows from `share-elec-by-source` or `share-electricity-renewables`.
- Do not treat an HTTP 200 response as a redistribution grant — OWID's own README disclaims that responsibility onto the reuser.
