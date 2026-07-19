# IRENA (International Renewable Energy Agency) — Source Catalog

**Site:** https://www.irena.org/ (blocked to automated clients — see below)
**Query platform:** https://pxweb.irena.org/pxweb/en/IRENASTAT
**Ingested:** manually pinned only — no automated fetch (Wave 2, Session 5)

## Governing gate document

Read [`UPSTREAM_LICENSES.md`](./UPSTREAM_LICENSES.md) before touching this folder. IRENA's operational posture is **pinned CSVs only; no automated fetch.**

## Why no automated fetch

- `www.irena.org` sits behind an Azure Web Application Firewall with a JavaScript challenge that returns **HTTP 403** to non-browser clients.
- IRENASTAT (`pxweb.irena.org`) is a PxWeb/IIS interactive query tool, not a documented bulk API — no REST API, no SDK.
- No automated-access permission is documented anywhere; the license we have is a **reuse/redistribution** license on the *content*, not an *access* grant to automate the platform.
- **Every value carries © IRENA + citation** per the emperor's ruling — this is enforced at the ingest-record level, not just in file headers.

## Datasets we track (four, per the emperor's ruling)

| Dataset | Backing publication | PxWeb topic folder | License regime |
|---|---|---|---|
| Installed renewable capacity by country/technology | IRENA (2025), *Renewable capacity statistics 2025* | Power Capacity and Generation | Restrictive — requires `© IRENA <year>` notation |
| Renewable power generation by country/technology | IRENA (2025), *Renewable energy statistics 2025* | Power Capacity and Generation | Restrictive — requires `© IRENA <year>` notation |
| Renewable capacity additions (derived) | Derived from the capacity series above | — (computed, year-over-year difference) | Restrictive — inherits capacity license; must be labeled "derived from IRENA statistics" |
| LCOE by technology, global annual averages | IRENA (2025), *Renewable Power Generation Costs in 2024* | — (costs dashboard, not in PxWeb) | Permissive — acknowledgement only |

## PxWeb URLs (for manual export)

- IRENASTAT root: https://pxweb.irena.org/pxweb/en/IRENASTAT
- Power Capacity and Generation topic folder (capacity + generation): navigate via the IRENASTAT root above.
- LCOE / costs data is **not** in PxWeb — it comes from the costs report's accompanying datafile / dashboard on irena.org, exported manually.

## Pinned CSV replay only

There is no `irena_fetch.py`-style script that hits the network. `scripts/ingest/irena_pinned.py` **reads** whatever CSVs a human has manually exported from PxWeb (or the costs datafile) and dropped into `irena/data/*.csv`, and emits `energy_supply_series` records from them. As of this Wave-2 build, `irena/data/` contains no pinned CSVs yet — see `data/README.md`.

## Attribution requirement

Every value carries:
1. `© IRENA <year>` copyright notation (mandatory for capacity/generation/additions; recommended for LCOE).
2. The verbatim citation string for its specific source publication (see `ATTRIBUTION.md`).
3. A note that third-party-attributed material within IRENA statistics may carry separate terms.

## Claims under review (for council)

- **C1** — IRENA's statistical-yearbook license (capacity/generation) is stricter than its analytical-report license (LCOE) — see `UPSTREAM_LICENSES.md` §2.5 for the full analyses-vs-database distinction.
- **C2** — We cannot mechanically separate IRENA-owned cells from third-party-sourced cells in PxWeb exports; this is an open question for the emperor (`UPSTREAM_LICENSES.md` §7.1).
