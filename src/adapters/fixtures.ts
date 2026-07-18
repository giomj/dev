import type { AdapterId, NormalizedResult } from "./types.js";
import type { RawPublication } from "./connectors.js";

/**
 * Illustrative, non-personal fixtures for the mock adapters. Content is generic
 * RSD-domain material (RF harvesting, indoor localization) — no personal data,
 * no real credentials. These keep adapter tests deterministic and offline.
 */

export const GITHUB_FIXTURES: readonly NormalizedResult[] = [
  {
    id: "gh-1",
    title: "rf-energy-harvesting-sim",
    content: "Open-source rectenna and PMIC cold-start modeling for ambient RF harvesting.",
    url: "https://example.invalid/gh/rf-energy-harvesting-sim",
    publisher: "example-org",
    score: 0.82,
    source: "github",
  },
];

export const WEB_FIXTURES: readonly NormalizedResult[] = [
  {
    id: "web-1",
    title: "Ambient RF power density overview",
    content:
      "Indoor ambient RF is typically sub-µW/cm²; favorable indoor DC harvest is single-digit µW.",
    url: "https://example.invalid/web/rf-density",
    score: 0.6,
    source: "web",
  },
];

export const ACADEMIC_FIXTURES: readonly NormalizedResult[] = [
  {
    id: "acad-1",
    title: "Multipath-assisted 5G indoor positioning",
    content:
      "Particle/EKF filtering achieves sub-0.9 m accuracy in 90% of cases in NLOS-heavy indoor scenes.",
    url: "https://example.invalid/acad/5g-multipath",
    publisher: "Illustrative Journal",
    timestamp: "2024-01-01T00:00:00Z",
    score: 0.9,
    source: "academic",
  },
];

// Gmail/Calendar fixtures are intentionally generic and contain NO personal data.
export const GMAIL_FIXTURES: readonly NormalizedResult[] = [
  {
    id: "mail-1",
    title: "[fixture] Lab notebook: rectenna bench results",
    content: "Generic placeholder describing an RF harvest bench measurement thread.",
    score: 0.5,
    source: "gmail",
  },
];

export const CALENDAR_FIXTURES: readonly NormalizedResult[] = [
  {
    id: "cal-1",
    title: "[fixture] RSD milestone review",
    content: "Generic placeholder calendar entry for a research milestone review.",
    timestamp: "2026-07-20T09:00:00Z",
    score: 0.5,
    source: "calendar",
  },
];

/** Raw publication fixtures matching the tested response shape. */
export const STATISTA_RAW: readonly RawPublication[] = [
  {
    content: "IoT sensor market sizing and low-power connectivity adoption trends.",
    view_source_url: "https://example.invalid/statista/iot-market",
    score: 0.7,
    omnipub_uuid: "statista-uuid-1",
    omnipub_title: "IoT Low-Power Sensor Market",
    publisher: "Statista",
    published_at: "2025-06-01T00:00:00Z",
  },
];

export const CBINSIGHTS_RAW: readonly RawPublication[] = [
  {
    content: "Energy-harvesting startup landscape and funding overview.",
    view_source_url: "https://example.invalid/cbi/eh-landscape",
    score: 0.65,
    omnipub_uuid: "cbi-uuid-1",
    omnipub_title: "Energy Harvesting Startups",
    publisher: "CB Insights",
    published_at: "2025-03-01T00:00:00Z",
  },
];

export const WILEY_RAW: readonly RawPublication[] = [
  {
    content: "Review of supercapacitor vs thin-film battery storage for micro-harvesting nodes.",
    view_source_url: "https://example.invalid/wiley/storage-review",
    score: 0.75,
    omnipub_uuid: "wiley-uuid-1",
    omnipub_title: "Storage for Micro-Harvesting",
    publisher: "Wiley",
    published_at: "2024-11-01T00:00:00Z",
  },
];

export const FIXTURES_BY_ADAPTER: Readonly<Record<AdapterId, readonly NormalizedResult[]>> = {
  github: GITHUB_FIXTURES,
  web: WEB_FIXTURES,
  academic: ACADEMIC_FIXTURES,
  gmail: GMAIL_FIXTURES,
  calendar: CALENDAR_FIXTURES,
  // Publication sources normalized from raw fixtures at registry build time.
  statista: [],
  cbinsights: [],
  wiley: [],
};
