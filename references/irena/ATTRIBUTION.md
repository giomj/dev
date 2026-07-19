# IRENA Attribution

**Canonical citation string** (cite the specific publication per dataset in ingest output — all three publications are listed here per the emperor's ruling):

> © IRENA <year>. IRENA (2025), Renewable Capacity Statistics 2025 / Renewable energy statistics 2025 / Renewable Power Generation Costs in 2024.

**License:** No single blanket license. Two regimes apply — see [`UPSTREAM_LICENSES.md`](./UPSTREAM_LICENSES.md) for the full audit:

1. **Restrictive (statistical yearbooks — capacity, generation, additions):** material may be freely used, shared, copied, reproduced, printed and/or stored, **provided it is clearly attributed to IRENA and bears a `© IRENA <year>` copyright notation.** Third-party-attributed material within may carry separate terms, including commercial-use restrictions.
2. **Permissive (analytical reports — LCOE / costs):** material may be freely used, shared, copied, reproduced, printed and/or stored, **provided appropriate acknowledgement is given of IRENA as source and copyright holder.**

**License identifier (machine-readable):** no single tag — use the per-dataset citation from the table below; the `source.license` field on every record should read `© IRENA <year>`.

**Upstream:** [irena.org](https://www.irena.org/) (site) / [pxweb.irena.org](https://pxweb.irena.org/pxweb/en/IRENASTAT) (query platform)

## Per-dataset citation strings (verbatim, use exactly)

| Dataset | Citation string | Copyright notation required? |
|---|---|---|
| Installed renewable capacity | `IRENA (2025), Renewable capacity statistics 2025, International Renewable Energy Agency, Abu Dhabi.` | Yes — `© IRENA 2025` |
| Renewable power generation | `IRENA (2025), Renewable energy statistics 2025, International Renewable Energy Agency, Abu Dhabi.` | Yes — `© IRENA 2025` |
| Renewable capacity additions (derived) | `Derived from IRENA (2025), Renewable capacity statistics 2025, International Renewable Energy Agency, Abu Dhabi.` | Yes — `© IRENA 2025` |
| LCOE / renewable energy costs | `IRENA (2025), Renewable power generation costs in 2024, International Renewable Energy Agency, Abu Dhabi.` | Recommended — `© IRENA 2025` |

## What TO do

- Attach the `© IRENA <year>` notation and the exact citation string to every record — not just a file header.
- Label the capacity-additions series as "derived from IRENA statistics — computed as year-over-year difference," never as an official IRENA-published figure.
- Prefer manual/assisted PxWeb export and yearbook table downloads over crawling `www.irena.org`.

## What NOT to do

- Do not write any script that fetches from `www.irena.org` — it is pinned-CSV replay only (Azure WAF blocks automated clients anyway).
- Do not ingest the project-level IRENA Renewable Cost Database (raw project microdata) — only the published global-average LCOE values.
- Do not present IRENASTAT-derived data without the `© IRENA <year>` notation — a bare "Source: IRENA" does not satisfy the restrictive license.
