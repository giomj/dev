# SatDump — Source Catalog

**Site:** https://www.satdump.org/
**Docs:** https://docs.satdump.org/
**Repo:** https://github.com/SatDump/SatDump
**Android:** https://f-droid.org/packages/org.satdump.SatDump
**Ingested:** 2026-07-18

## What it is

**SatDump** is an open-source, generic satellite-data-processing suite. It ingests SDR baseband (I/Q), soft-symbol streams, and frame data, and runs configurable **pipelines** to demodulate → deframe → decode → image-compose → project → geo-reference downlinked satellite data. It targets meteorological/imagery satellites (POES, MetOp, GOES, Meteor-M, Elektro-L, FengYun, etc.) plus amateur payloads.

## Platform matrix

| Platform | Distribution | Notes |
|---|---|---|
| Windows | Installer + portable app on Releases page | Built with VS2019 x64; requires VC++ Runtime |
| macOS | Dependency-free builds on Releases page | Also buildable from source |
| Linux | Build from source recommended | Prebuilt Ubuntu x64 available; docs cover Debian/Ubuntu, RHEL, Alpine, Gentoo, openSUSE |
| Raspberry Pi | Build from source | On RPi3 and older use `make -j1` (memory constraint) |
| Android | F-Droid preferred, APK on Releases | Limited SDR support (see below) |
| Docker | Documented, including X11 forwarding | For headless / reproducible pipelines |

## SDR / radio support

| Radio | Desktop | Android |
|---|:---:|:---:|
| RTL-SDR | ✓ | ✓ |
| Airspy | ✓ | ✓ |
| Airspy HF+ | ✓ | ✓ |
| HackRF | ✓ | ✓ |
| LimeSDR Mini | ✓ | ✓ |
| BladeRF | ✓ | — |
| ADALM-Pluto / PlutoPlus / AntSDR (AD9361 family) | ✓ | — |

Run `satdump sdr_probe` to enumerate connected devices and their IDs.

## Interface modes

### GUI
- **Offline:** File → Processing → pick pipeline → input file → set input level → Start
- **Live:** Add Recorder → pick SDR → pick pipeline → Start

### CLI
```
satdump pipeline <pipeline_id> <input_level> <input_file> <output_dir> [options]
satdump legacy live <pipeline_id> <output_dir> [options]
satdump legacy record <output_baseband_basename> [options]
```

### Common options
- `--samplerate <hz>`
- `--baseband_format cf32|cs32|cs16|cs8|cu8|w8|w16`
- `--dc_block --iq_swap`
- `--source airspy|rtlsdr|... --gain 20 --bias`

## Pipeline concept

SatDump organises decoding as **pipelines** — a graph of processing stages defined per satellite/instrument. The canonical example shown in docs is `metop_ahrpt` (MetOp AHRPT stream). The full pipeline list lives at a separate URL not enumerated on the docs landing.

## Evidence tier

- **Reference / operational software**. Open source (GPL family), community-maintained. Actively released — 1.2.2 is the latest tagged release on the home page timeline, with 2.0.0 signalled as upcoming.
- Comparable in scope to WxToImg (defunct, closed) and Meteor Demodulator; strictly larger scope than either — SatDump is currently the leading open-source ground-station-in-a-box for LEO imagery.

## Claims Under Review (for council)

- **C1** — SatDump is the leading actively-maintained open-source satellite-data-processing suite for amateur/hobbyist reception of LEO imagery satellites.
- **C2** — SatDump abstracts the receive chain into a **pipeline** graph, making it possible to add new satellites/instruments as configuration rather than code — a legitimate architecture that resembles SDR++/GNU Radio flowgraphs but at a higher (satellite-processing) semantic layer.
- **C3** — SatDump supports the six mainstream hobbyist SDRs (RTL-SDR, Airspy, AirspyHF, HackRF, LimeSDR Mini, BladeRF) plus the AD9361 family (Pluto). This is sufficient coverage for any amateur ground station built in 2025-2026.
- **C4** — On Android, SDR support is a subset (four radios, no BladeRF or Pluto), a genuine limitation for on-the-go operation.
