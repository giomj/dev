# SatDump Notice

This directory contains **original commentary and a hand-maintained hardware compatibility matrix** for SatDump users. It does **not** contain SatDump source code, binaries, pipeline JSON files, or hardware config files authored by the SatDump project.

## What lives here

- `catalog.md` — Original commentary on SatDump platforms, radios, and pipeline concepts (Grand Council authorship, Session 3).
- `hardware_compat.json` — Hand-maintained compatibility matrix conformant to `schemas/hardware_compat.schema.json`.

## Why we don't vendor SatDump

[SatDump](https://github.com/SatDump/SatDump) is licensed under the **GNU General Public License**. Bundling SatDump-authored files into this repo would make this entire repo GPL, which is inconsistent with the repo-wide license posture. Instead:

- Users install SatDump from upstream (source or F-Droid: [org.satdump.SatDump](https://f-droid.org/packages/org.satdump.SatDump)).
- We publish this hardware compatibility matrix as a *catalog*, not a redistribution.
- The Grand Council's CI attribution check (`scripts/check_attribution.py`) refuses to accept any file matching `SatDump*.{json,cfg,sh,py}` under `sources/satdump/`, blocking accidental vendoring.

## Framing

Per the Session 3 ruling (Historian K), any documentation of SatDump must frame "leading" as:

> **Actively maintained + mainstream SDR coverage + open-source** — not "technically superior in every case."

[GNU Radio](https://www.gnuradio.org/) + Meteor Demod remains a legitimate alternative for niche work.

## Attribution

When quoting from this catalog in a derived work:

> Grand Council commentary on the [SatDump project](https://www.satdump.org/), Session 3 (2026-07-18). SatDump itself is © the SatDump project and licensed GPL — see [github.com/SatDump/SatDump](https://github.com/SatDump/SatDump).
