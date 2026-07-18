"""Render the 2026-07-18 Grand Council Session 3 ruling (Sources & Integration) to PDF."""
import os
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, HRFlowable, Spacer, KeepTogether
import urllib.request

# --- Fonts ---
FONT_DIR = "/tmp/gc_fonts"
os.makedirs(FONT_DIR, exist_ok=True)

FONTS = {
    "Inter-Regular": "https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf",
    "Inter-Bold":    "https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf",
    "Inter-Italic":  "https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter-Italic%5Bopsz%2Cwght%5D.ttf",
    "DMSans-Bold":   "https://raw.githubusercontent.com/google/fonts/main/ofl/dmsans/DMSans%5Bopsz%2Cwght%5D.ttf",
}

loaded = {}
for name, url in FONTS.items():
    path = os.path.join(FONT_DIR, name + ".ttf")
    if not os.path.exists(path):
        try:
            urllib.request.urlretrieve(url, path)
        except Exception as e:
            print(f"Font download failed for {name}: {e}")
            continue
    try:
        pdfmetrics.registerFont(TTFont(name, path))
        loaded[name] = True
    except Exception as e:
        print(f"Font register failed for {name}: {e}")

BODY_FONT   = "Inter-Regular" if loaded.get("Inter-Regular") else "Helvetica"
BOLD_FONT   = "Inter-Bold"    if loaded.get("Inter-Bold")    else "Helvetica-Bold"
ITALIC_FONT = "Inter-Italic"  if loaded.get("Inter-Italic")  else "Helvetica-Oblique"
HEAD_FONT   = "DMSans-Bold"   if loaded.get("DMSans-Bold")   else BOLD_FONT
print("fonts:", BODY_FONT, BOLD_FONT, ITALIC_FONT, HEAD_FONT)

# --- Colors (Nexus light) ---
TEXT = colors.HexColor("#28251D")
MUTED = colors.HexColor("#7A7974")
PRIMARY = colors.HexColor("#01696F")
ACCENT_REJECT = colors.HexColor("#A12C7B")
ACCENT_MIXED = colors.HexColor("#964219")
ACCENT_SOUND = colors.HexColor("#437A22")
BORDER = colors.HexColor("#D4D1CA")

# --- Styles ---
styles = {
    "title": ParagraphStyle("title", fontName=HEAD_FONT, fontSize=26, leading=32, textColor=TEXT, spaceAfter=6),
    "subtitle": ParagraphStyle("subtitle", fontName=BODY_FONT, fontSize=10, leading=14, textColor=MUTED, spaceAfter=18),
    "h1": ParagraphStyle("h1", fontName=HEAD_FONT, fontSize=18, leading=22, textColor=TEXT, spaceBefore=18, spaceAfter=8),
    "h2": ParagraphStyle("h2", fontName=HEAD_FONT, fontSize=13, leading=17, textColor=TEXT, spaceBefore=12, spaceAfter=4),
    "meta": ParagraphStyle("meta", fontName=BODY_FONT, fontSize=9, leading=12, textColor=MUTED, spaceAfter=6),
    "body": ParagraphStyle("body", fontName=BODY_FONT, fontSize=10.5, leading=15, textColor=TEXT, spaceAfter=6, alignment=TA_LEFT),
    "seat": ParagraphStyle("seat", fontName=BODY_FONT, fontSize=10.5, leading=15, textColor=TEXT, spaceAfter=6, leftIndent=10),
    "ruling_sound":  ParagraphStyle("ruling_s", fontName=BOLD_FONT, fontSize=11, leading=15, textColor=ACCENT_SOUND, spaceBefore=8, spaceAfter=4),
    "ruling_mixed":  ParagraphStyle("ruling_m", fontName=BOLD_FONT, fontSize=11, leading=15, textColor=ACCENT_MIXED, spaceBefore=8, spaceAfter=4),
    "ruling_reject": ParagraphStyle("ruling_r", fontName=BOLD_FONT, fontSize=11, leading=15, textColor=ACCENT_REJECT, spaceBefore=8, spaceAfter=4),
    "action": ParagraphStyle("action", fontName=ITALIC_FONT, fontSize=10, leading=14, textColor=PRIMARY, spaceBefore=4, spaceAfter=6, leftIndent=10),
    "footer": ParagraphStyle("footer", fontName=BODY_FONT, fontSize=8.5, leading=12, textColor=MUTED, spaceBefore=12),
}

def hr():
    return HRFlowable(width="100%", thickness=0.6, color=BORDER, spaceBefore=8, spaceAfter=8)

def para(text, style_name="body"):
    return Paragraph(text, styles[style_name])

def seat(name, body):
    return Paragraph(f'<font name="{BOLD_FONT}">{name}.</font> {body}', styles["seat"])

# --- Artifact data ---
ARTIFACTS = [
    dict(
        label="Artifact J \u2014 n2yo.com",
        intake=("Live real-time satellite tracker over the USSPACECOM catalog, wrapping TLE data and SGP4 propagation in "
                "a web/mobile skin. Documented REST v1 API with five endpoints (tle, positions, visualpasses, radiopasses, above), "
                "per-verb rate limits (1000/hr for tle+positions; 100/hr for the others), 57-category proprietary taxonomy. "
                "Evidence tier: <font name=\"" + BOLD_FONT + "\">Aggregator / operational</font>. Claims Under Review: C1\u2013C3."),
        seats=[
            ("Physicist", "SGP4 is semi-analytical propagation of a <font name=\"" + ITALIC_FONT + "\">fitted</font> element set \u2014 "
             "good for pass timing, pointing, ISS radio/visual planning over a 300-second position window and 10-day pass window, "
             "not for meter-scale ranging, conjunction assessment, or geodesy. The captured ISS TLE is physically coherent: "
             "inclination 51.6318\u00b0, eccentricity 0.0006793, mean motion 15.49037991 rev/day \u2192 period \u2248 92.96 min, "
             "semi-major axis \u2248 6,797.7 km, altitude \u2248 420 km (perigee/apogee \u2248 415\u2013424 km)."),
            ("Engineer", "The 100/hr limit on visualpasses/radiopasses/above is the binding constraint the moment more than a "
             "handful of watched satellites hits one shared key \u2014 a shared server key will be exhausted well before N reaches "
             "double digits. <font name=\"" + BOLD_FONT + "\">Design rule: give each device its own key, cache TLEs server-side on a "
             "scheduled cadence (well under 1000/hr), and compute all pass/position math locally with python-sgp4 or a vetted port.</font> "
             "Reserve live n2yo pass calls for a periodic reconciliation check, not per-user requests. Degrade gracefully to "
             "\u201cpropagate from last-known TLE\u201d with a staleness warning after ~2\u20133 days."),
            ("Mathematician", "From n = 15.49037991 rev/day: n_rad/s = 15.49037991 \u00b7 2\u03c0/86400 \u2248 0.001126 rad/s. With "
             "GM\u2295 \u2248 3.986\u00d710\u00b9\u2074 m\u00b3/s\u00b2, Kepler gives a\u00b3 = GM\u2295/n\u00b2 \u2248 3.141\u00d710\u00b2\u2070 m\u00b3 "
             "\u2192 <font name=\"" + BOLD_FONT + "\">a \u2248 6,797.68 km</font>, matching the Physicist. TLEs use rigid fixed-column format "
             "with implicit decimals (e.g. eccentricity 0006793 = 0.0006793) and a mod-10 checksum per line \u2014 basic transmission integrity, "
             "no cryptographic validation. Precision degrades rapidly under atmospheric drag past a few days epoch age."),
            ("Historian-Philosopher", "Real-time satellite tracking descends from Cold War state cartography \u2014 the U.S. Space Surveillance "
             "Network born after Sputnik 1 (1957), catalog maintained by NORAD \u2192 USSPACECOM (1985) \u2192 the 18th Space Defense Squadron "
             "today. The decisive civic turn came in 1985 when Dr. T.S. Kelso began distributing TLEs via CelesTrak. n2yo belongs to the "
             "<font name=\"" + BOLD_FONT + "\">third generation</font> \u2014 the browser-native amateur online trackers of the 2000s. Its "
             "genre is <font name=\"" + ITALIC_FONT + "\">operational skin</font>, not source: derived legibility over a state-held commons. "
             "Cite as aggregator, never as ground truth."),
        ],
        skeptic=("Falsifiable counter to C1: TLE freshness throttles position precision \u2014 an older TLE on a drag-heavy LEO object "
                 "misaligns with reality despite correct math. Counter to C2: redistribution of Space-Track-derived data often triggers "
                 "upstream licensing covenants n2yo cannot waive for downstream apps. Counter to C3: the 57-category taxonomy is not merely "
                 "editorial \u2014 it likely encodes historical operational biases (ham-radio/military heritage over-segmenting specific bands "
                 "while lumping modern mega-constellations)."),
        verdict=("Sound", "sound",
                 "C1\u2013C3 accepted with three pedagogical footnotes: (a) always report TLE <font name=\"" + BOLD_FONT + "\">epoch age</font> "
                 "alongside any position; (b) treat n2yo\u2019s ToS as the <font name=\"" + ITALIC_FONT + "\">floor</font> of redistribution rights "
                 "and check Space-Track upstream licensing separately if the app redistributes bulk pulls; (c) do not treat the 57-category taxonomy "
                 "as an official schema \u2014 carry the NORAD ID as the canonical identifier."),
        action=("grid-and-chain-mobile :: implement local SGP4 propagator seeded from cached n2yo /tle/{id} responses; give each device its own "
                "API key; degrade gracefully past 3-day TLE age."),
    ),
    dict(
        label="Artifact K \u2014 SatDump",
        intake=("Open-source generic satellite-data-processing suite. GPL-family, actively released (1.2.2 current, 2.0.0 upcoming). "
                "Pipeline-graph architecture: RF \u2192 I/Q \u2192 soft symbols \u2192 frames \u2192 payload/imagery/geo-reference. Runs on "
                "Windows, macOS, Linux, Raspberry Pi, Docker, Android (F-Droid). Radios: RTL-SDR, Airspy, AirspyHF, HackRF, LimeSDR Mini, "
                "BladeRF, AD9361 (Pluto family); Android subset drops BladeRF + Pluto. Evidence tier: "
                "<font name=\"" + BOLD_FONT + "\">Reference / operational open-source software</font>. Claims Under Review: C1\u2013C4."),
        seats=[
            ("Physicist", "SatDump\u2019s chain is real physics, not just software plumbing: EM wave \u2192 antenna \u2192 mixer/ADC \u2192 "
             "I/Q baseband \u2192 soft symbols \u2192 FEC/deframe \u2192 payload. SNR loss enters before and during sampling (antenna gain, "
             "polarization mismatch, path loss, atmospheric loss, receiver noise figure, gain setting, Doppler, filtering, interference). "
             "Quantization loss enters at the ADC \u2014 worse with cs8/cu8/w8 than cf32. The pipeline abstraction preserves physics "
             "<font name=\"" + BOLD_FONT + "\">if</font> its graph carries the physical parameters (sample rate, center frequency, "
             "modulation, symbol rate, Doppler handling, FEC, frame format, instrument geometry) \u2014 otherwise it merely hides the link budget."),
            ("Engineer", "Real ground-station build: directional/omni LEO antenna (QFH or turnstile @ 137 MHz for NOAA/Meteor APT/LRPT; "
             "helical or patch @ 1.7 GHz for HRPT/AHRPT) \u2192 <font name=\"" + BOLD_FONT + "\">LNA at the antenna</font> (not the radio, "
             "to overcome cable loss before the noise floor sets in) \u2192 coax \u2192 SDR \u2192 host. Radio choice: RTL-SDR (v3/v4) is "
             "the right entry point for 137 MHz; Airspy Mini / AirspyHF+ is the better call for L-band AHRPT/HRPT (better front-end linearity, "
             "wider usable bandwidth, both supported desktop <font name=\"" + ITALIC_FONT + "\">and</font> Android). HackRF/LimeSDR are "
             "over-spec for receive-only weather. BladeRF/Pluto: avoid if Android use is planned. Host: Docker for fixed unattended reproducible "
             "ground stations; Android for portable/field. The engineering-competence bar is not the GUI happy path \u2014 it\u2019s "
             "(a) RF chain design + link budget, (b) pipeline/parameter selection matching sample rate + baseband format + pipeline id + Doppler "
             "tracking, (c) time-sync + geometry for geo-referencing."),
            ("Mathematician", "SatDump\u2019s DAG structure enables modular composition of decode stages, but strict associativity is "
             "<font name=\"" + BOLD_FONT + "\">not guaranteed</font> across arbitrary boundaries \u2014 downsampling, filtering, and demodulation "
             "are strongly order-dependent. Numerical instabilities enter at discretization boundaries \u2014 soft-decision decoding via Viterbi/LDPC "
             "uses log-likelihood ratios whose truncation/float-precision limits fundamentally bound the achievable BER."),
            ("Historian-Philosopher", "Amateur satellite reception traces to Moonwatch and Project Moonbeam volunteers tracking Sputnik in 1957, "
             "then to APT/HRPT hobbyists building weather-sat ground stations in the 1970s\u201390s. WxToImg was the canonical APT decoder of the "
             "2000s but went unmaintained \u2014 the classic fragility of a craft whose tools outlive their maintainers. The 2012 rupture: "
             "Antti Palosaari\u2019s discovery that ~$20 RTL2832U TV dongles are wideband SDRs democratized reception overnight. "
             "<font name=\"" + BOLD_FONT + "\">SatDump is the mature artifact of that post-2012 open-source culture</font> \u2014 a "
             "ground-station-in-a-box that outgrew and replaced the closed incumbents via a pipeline abstraction in the GNU Radio lineage, "
             "lifted to the satellite-processing semantic layer."),
        ],
        skeptic=("Counter to C1: GNU Radio + Meteor Demod + legacy wxtoimg wrappers offer superior control for niche hardware or novel "
                 "modulations SatDump hasn\u2019t upstreamed. Counter to C2: pipeline-graph monoliths risk becoming brittle unmaintainable "
                 "state-machines vs. UNIX-style decoupled data pipes. Counter to C3: neglects growing ecosystem of FPGA-based / "
                 "ethernet-attached SDRs sidelined by the curated hardware list. Counter to C4: Android SDR limitations are likely downstream "
                 "of SatDump\u2019s own libusb compilation choices, not a fundamental Android USB-host impossibility."),
        verdict=("Sound", "sound",
                 "C1\u2013C4 accepted with two pedagogical footnotes: (a) frame \u201cleading\u201d as <font name=\"" + ITALIC_FONT + "\">"
                 "actively-maintained + mainstream-SDR-coverage + open-source</font> rather than <font name=\"" + ITALIC_FONT + "\">"
                 "technically superior in every case</font> \u2014 the Skeptic\u2019s GNU Radio + Meteor Demod alternative remains legitimate "
                 "for niche work; (b) any documentation of pipeline internals must name the physical parameters (sample rate, center frequency, "
                 "Doppler handling, FEC, frame format) that the abstraction is supposed to preserve, not just the stage names."),
        action=("grid-and-chain-mobile :: Android portable ground-station companion targeting the Airspy Mini + RTL-SDR intersection of the "
                "desktop+Android matrices; document the RF-chain link budget as a first-class artifact, not a footnote."),
    ),
    dict(
        label="Artifact L \u2014 Global Oil &amp; Gas Plant Tracker (GOGPT)",
        intake=("Global Energy Monitor\u2019s bi-annual (Jan + Jul/Aug) plant-level tracker of oil- and gas-fired power. \u226550 MW globally, "
                "\u226520 MW EU+UK. <font name=\"" + BOLD_FONT + "\">1,047 GW in-development capacity (Jan 2026 release);</font> USA 252 GW, "
                "China 153 GW. CC BY 4.0 licensed; XLSX behind a request form. Two-layer: database + per-plant wiki with footnoted references. "
                "Cross-validated against Platts (1911\u2013) and WRI Global Power Plant Database (2018\u2013). Evidence tier: "
                "<font name=\"" + BOLD_FONT + "\">Primary-secondary hybrid</font>. Claims Under Review: C1\u2013C4."),
        seats=[
            ("Physicist", "GOGPT\u2019s plant-level CO\u2082 calc is physically meaningful only if capacity is converted to energy + fuel burn: "
             "annual emissions require nameplate capacity \u00d7 capacity factor \u00d7 hours/year \u00d7 heat rate \u00d7 fuel carbon content. "
             "Lifetime CO\u2082 adds a time integral over service life. The 1,047 GW headline is a real summed plant-level nameplate power figure "
             "(proposed + permitted + under-construction), <font name=\"" + BOLD_FONT + "\">not generation and not CO\u2082</font>. To convert to "
             "annual generation one must assume a capacity factor \u2014 e.g. 50% \u2192 ~4,586 TWh/yr before applying oil-vs-gas emissions factors."),
            ("Engineer", "Request-form CSV/XLSX means no live API \u2014 each release is a manually-triggered, versioned import. Concrete plan: "
             "drop each raw XLSX into a dated immutable landing zone (sources/gogpt/raw/2026-01/), transform via a per-release "
             "<font name=\"" + BOLD_FONT + "\">column mapping file</font> (schema_map_2025-08.yml) checked into version control, mapping raw "
             "headers \u2192 canonical internal fields. Renamed columns get old-name\u2192new-name entries with the release they changed in; new "
             "columns become nullable additions. Store SHA256 of each raw file. Assert row-count + key-column presence in transform. Model the "
             "ingestion task as manual-in-the-loop with an owner + due date tied to the bi-annual cadence."),
            ("Mathematician", "Aggregation across 106+ countries requires distinguishing count-weighted from capacity-weighted metrics to avoid "
             "ecological fallacies. The observation that <font name=\"" + BOLD_FONT + "\">50% of in-development capacity is concentrated in 5 countries</font> "
             "is a heavy-tailed Pareto-like distribution \u2014 formally: plot the Lorenz curve of cumulative country proportion vs. cumulative capacity "
             "proportion. The resulting Gini coefficient likely approaches 0.8 or higher, formalizing the extreme centralization."),
            ("Historian-Philosopher", "Plant-level energy inventory has been the domain of proprietary commercial intelligence for over a century \u2014 "
             "UDI/Platts (1911\u2013), sold to utilities/financiers/governments, authoritative but enclosed. Partial opening in 2018 with WRI\u2019s "
             "Global Power Plant Database (~29,000 plants). GOGPT occupies a distinct politically-consequential niche: "
             "<font name=\"" + BOLD_FONT + "\">open-license (CC BY 4.0), bi-annually updated, methodology-footnoted, peer-reviewed, cross-validated "
             "against Platts + WRI</font>, taking the plant as the unit of accountability. Its political-epistemic role is as a "
             "<font name=\"" + ITALIC_FONT + "\">counter-archive</font> \u2014 its IEA/IPCC citations inherit an auditable evidentiary chain rather "
             "than a black-boxed commercial estimate. Shift from \u201ctrust the vendor\u201d to \u201ccheck the footnote.\u201d"),
        ],
        skeptic=("Counter to C1: reliance on varying non-uniform NGO/media reports structurally limits global consistency vs. pure remote-sensing "
                 "methodologies. Counter to C2: treating \u201cproposed\u201d capacity with equal data-weight as \u201cunder construction\u201d "
                 "skews the metric toward phantom projects. Counter to C3: unadjusted 252 GW U.S. headline is <font name=\"" + ITALIC_FONT + "\">"
                 "dangerously misleading</font> without a stated IRP-to-construction attrition discount rate. Counter to C4: CC BY 4.0 attribution "
                 "imposes real UX + data-schema costs \u2014 not frictionless. The \u201cpeer-reviewed\u201d claim requires a rigorously published list "
                 "of reviewers per release, which is not stated in the current methodology."),
        verdict=("Sound", "sound",
                 "C1\u2013C4 accepted with three pedagogical footnotes: (a) <font name=\"" + BOLD_FONT + "\">status-weighting</font> \u2014 any derivative "
                 "summary of GOGPT must break capacity down by status (proposed vs. permitted vs. under-construction vs. operating vs. retired) and never "
                 "quote a single \u201cin-development\u201d number without that breakdown; (b) <font name=\"" + BOLD_FONT + "\">capacity-factor discipline</font> "
                 "\u2014 never quote GOGPT\u2019s GW figure alongside a CO\u2082 or TWh figure without explicitly stating the capacity-factor assumption "
                 "used; (c) <font name=\"" + BOLD_FONT + "\">peer-review provenance</font> \u2014 treat the \u201cpeer-reviewed\u201d language as "
                 "review-by-domain-collaborators (CREA, Beyond Fossil Fuels, Environmental Integrity Project, Sierra Club, others) rather than "
                 "journal-style anonymous peer review, and cite the collaborator list where available."),
        action=("conceptual-engineering-references :: create a GOGPT ingestion pipeline with schema-versioned column mapping, status-weighted derivative "
                "summaries, and a Lorenz-curve visualization of the 50%-in-5-countries concentration."),
    ),
    dict(
        label="Artifact M \u2014 Integration plan",
        intake=("Proposed new project bridging n2yo (real-time skin over USSPACECOM catalog) + SatDump (open-source ground-station suite) + GOGPT "
                "(CC BY 4.0 plant-level tracker) as a curated reference shelf. Portfolio links proposed: gravitational-compass \u2194 n2yo; "
                "grid-and-chain-mobile \u2194 n2yo API + SatDump; conceptual-engineering-references \u2194 GOGPT; "
                "<font name=\"" + BOLD_FONT + "\">recursive-state-dynamics \u2194 GOGPT (weak, tentative)</font>; force-carriers \u2194 none."),
        seats=[
            ("Physicist", "The n2yo \u2194 gravitational-compass link is the <font name=\"" + BOLD_FONT + "\">strongest physics link</font> \u2014 "
             "real TLEs are Earth-orbit trajectories any gravity/propagation model must approximately reproduce. Narrow the intake phrase "
             "\u201cheliocentric propagation cross-check\u201d: ISS TLEs test <font name=\"" + ITALIC_FONT + "\">near-Earth</font> orbital dynamics, "
             "drag-sensitive propagation, frame transforms, and observation geometry \u2014 not a pure heliocentric gravity model by themselves. "
             "The grid-and-chain-mobile \u2194 n2yo API + SatDump link is physically defensible (one continuous measurement chain). The GOGPT \u2194 "
             "conceptual-engineering-references link is defensible for energy-systems physics. The GOGPT \u2194 RSD link is <font name=\"" + ITALIC_FONT +
             "\">weak physically</font> \u2014 plant states become physics-relevant only if coupled to power, fuel flow, heat rate, emissions."),
            ("Engineer", "The proposed sources/{n2yo,satdump,gogpt} + samples/ + notes/ layout is sound but needs three additions: (1) "
             "<font name=\"" + BOLD_FONT + "\">sources/gogpt/raw/&lt;release&gt;/</font> dated directory convention; (2) sources/n2yo/.env.example "
             "(committed) paired with a real .env (gitignored) \u2014 never hardcode the API key, use platform secrets in CI; (3) top-level "
             "<font name=\"" + BOLD_FONT + "\">LICENSES.md</font> covering the three legal regimes \u2014 n2yo (proprietary ToS + rate-limited key), "
             "SatDump (GPL-family copyleft on any bundled modified copy), GOGPT (CC BY 4.0 with mandatory attribution). Add a CI check that fails "
             "the build if any file under sources/gogpt/ or any derived table lacks the citation string."),
            ("Mathematician", "Model conceptual-engineering-references as a <font name=\"" + BOLD_FONT + "\">heterogeneous graph</font> with nodes "
             "for satellites (n2yo), pipelines/instruments (SatDump), and generation plants (GOGPT). Unify via a shared spatio-temporal schema \u2014 "
             "a \u201cWorld Coordinate Event\u201d <font name=\"" + BOLD_FONT + "\">E(x, y, z, t)</font> defined by WGS84 coordinates + UTC epoch. "
             "Satellites are continuous trajectories in this space; ground stations are fixed receiving coordinates; power plants are static "
             "infrastructural footprints. This enables cross-domain queries \u2014 e.g. slant range + pass duration of an earth-observation satellite "
             "over a high-capacity generator cluster."),
            ("Historian-Philosopher", "conceptual-engineering-references is a <font name=\"" + BOLD_FONT + "\">curated reference shelf</font> \u2014 "
             "the intellectual work is selection, tiering, and cross-linking, not invention. It joins three traditions: (1) the engineering handbook "
             "(<font name=\"" + ITALIC_FONT + "\">Marks\u2019 Standard Handbook</font>, 1916\u2013; <font name=\"" + ITALIC_FONT + "\">CRC Handbook</font>) "
             "\u2014 trustworthy load-bearing references graded by how much weight each can bear; (2) the commonplace book \u2014 the Renaissance-through-Enlightenment "
             "practice of transcribing passages for reuse; (3) the canonical-reference-shelf or personal canon. Binding obligations: fidelity to license, "
             "honesty about tier, honesty about cadence. A reference shelf, unlike a mere download folder, promises its future reader that every item "
             "has been vetted, situated, and correctly labeled."),
        ],
        skeptic=("<font name=\"" + BOLD_FONT + "\">Motion to Reject the GOGPT \u2194 RSD portfolio link.</font> Ground: ontological mismatch. "
                 "Attempting to shoehorn a discrete dataset of slow, manual bureaucratic state transitions (proposed \u2192 permitted \u2192 operating "
                 "\u2192 retired) into a framework designed for recursive state modeling (L/K/E formalism) stretches the definition of \u201cdynamics\u201d "
                 "to the breaking point. The label \u201cstate transition\u201d appears in both, but the underlying object is fundamentally different \u2014 "
                 "administrative status codes vs. continuous physical state evolution."),
        verdict=("Mixed \u2014 Motion to Reject GOGPT \u2194 RSD accepted", "mixed",
                 "<font name=\"" + BOLD_FONT + "\">Accepted, unchanged:</font> gravitational-compass \u2194 n2yo (with the Physicist\u2019s narrowing: "
                 "near-Earth, not heliocentric), grid-and-chain-mobile \u2194 n2yo API + SatDump, conceptual-engineering-references \u2194 GOGPT, "
                 "force-carriers \u2194 none. <font name=\"" + BOLD_FONT + "\">Rejected:</font> recursive-state-dynamics \u2194 GOGPT \u2014 struck from "
                 "the integration plan. If the emperor later wishes to revisit, the link must be re-scoped by first defining a mapping from GOGPT\u2019s "
                 "administrative status codes to a continuous state variable coupled to a physical or economic dynamic (e.g. probability of construction "
                 "\u00d7 capacity \u00d7 time-to-COD), and only then submitted to the council as a fresh artifact. <font name=\"" + BOLD_FONT + "\">"
                 "Accepted with additions:</font> Engineer\u2019s three additions (dated raw/ for GOGPT, secrets-managed .env for n2yo, top-level LICENSES.md "
                 "with CI attribution check) become part of the accepted plan. Mathematician\u2019s shared spatio-temporal schema (WGS84 + UTC) becomes the "
                 "canonical reference frame."),
        action=("conceptual-engineering-references :: implement the Engineer\u2019s three additions and the Mathematician\u2019s WGS84+UTC event schema; "
                "strike the RSD \u2194 GOGPT link from any portfolio diagram; document the near-Earth (not heliocentric) scope of the n2yo \u2194 "
                "gravitational-compass link."),
    ),
]

CROSS_CUTTING = [
    ("Three sources, three tiers, three cadences, three legal regimes.",
     "Session 3\u2019s core insight is that a reference shelf mixing an <font name=\"" + ITALIC_FONT + "\">aggregator skin</font> (n2yo), "
     "an <font name=\"" + ITALIC_FONT + "\">operational open-source tool</font> (SatDump), and an <font name=\"" + ITALIC_FONT + "\">"
     "open-license peer-reviewed dataset</font> (GOGPT) works only if each source is quoted at its own tier, cadence, and license binding \u2014 never as "
     "if they were interchangeable. The Historian\u2019s phrase captures it: a reference shelf, unlike a download folder, promises that every item has "
     "been vetted, situated, and correctly labeled."),
    ("Aggregator-vs-source discipline.",
     "n2yo is a courier of the USSPACECOM/Space-Track record, not the record. Any downstream artifact must cite the source (the state catalog) with n2yo "
     "as intermediary, and must carry TLE epoch age alongside every position. The general rule: aggregators enter the reference shelf as skins, not as ground truth."),
    ("License-gradient hygiene.",
     "Three regimes: proprietary + rate-limited ToS (n2yo), copyleft GPL-family (SatDump), permissive-with-attribution CC BY 4.0 (GOGPT). The strictest "
     "binding sets the ceiling \u2014 n2yo\u2019s ToS + rate limit shapes the project\u2019s mobile-app design (per-device keys, local SGP4, staleness "
     "degradation), while GOGPT\u2019s CC BY 4.0 mandates a build-time attribution check. Never treat \u201copen\u201d as monolithic."),
]

PORTFOLIO = [
    ("gravitational-compass", "Adopt n2yo TLEs as a near-Earth ground-truth propagation cross-check (narrowed from \u201cheliocentric\u201d)."),
    ("grid-and-chain-mobile", "Two new work items: (a) local-SGP4 pass-prediction subsystem seeded from cached n2yo TLEs, per-device keys; (b) Android portable ground-station companion targeting the Airspy Mini + RTL-SDR intersection of the SatDump desktop+Android matrices."),
    ("conceptual-engineering-references", "Bootstrapped at /home/user/workspace/conceptual-engineering-references/ with three source catalogs, endpoint documentation, an ISS TLE sample, plus the Engineer\u2019s three additions + Mathematician\u2019s WGS84+UTC event schema as the integration standard."),
    ("recursive-state-dynamics", "No link accepted this session; the RSD \u2194 GOGPT bridge was rejected on ontological grounds and may be re-scoped later."),
    ("force-carriers", "No link, as intake proposed."),
]

# --- Build ---
def build(output_path):
    doc = SimpleDocTemplate(
        output_path, pagesize=LETTER,
        leftMargin=0.9*inch, rightMargin=0.9*inch,
        topMargin=0.8*inch, bottomMargin=0.8*inch,
        title="Grand Council \u2014 Session 3 Ruling",
        author="Perplexity Computer",
    )
    story = []
    story.append(para("Grand Council", "title"))
    story.append(para(
        "Session 3 &middot; Three-Source Ingestion &amp; Integration &middot; 2026-07-18 &middot; New Braunfels, TX &middot; "
        "Emperor: James Gianotti &middot; Project of record: conceptual-engineering-references", "subtitle"))
    story.append(hr())

    for a in ARTIFACTS:
        block = [para(a["label"], "h1"), para(f'<font name="{ITALIC_FONT}">Intake.</font> {a["intake"]}', "body")]
        for name, body in a["seats"]:
            block.append(seat(name, body))
        block.append(seat("Skeptic\u2019s cross", a["skeptic"]))
        v_label, v_kind, v_body = a["verdict"]
        style_key = {"sound": "ruling_sound", "mixed": "ruling_mixed", "reject": "ruling_reject"}[v_kind]
        block.append(Paragraph(f'Ruling \u2014 {v_label}. {v_body}', styles[style_key]))
        block.append(Paragraph(f'<font name="{ITALIC_FONT}">Action.</font> {a["action"]}', styles["action"]))
        block.append(hr())
        story.extend(block)

    story.append(para("Cross-cutting synthesis", "h1"))
    for header, body in CROSS_CUTTING:
        story.append(para(f'<font name="{BOLD_FONT}">{header}</font> {body}', "body"))

    story.append(para("Portfolio impact", "h2"))
    for name, body in PORTFOLIO:
        story.append(para(f'<font name="{BOLD_FONT}">{name}</font> &mdash; {body}', "body"))

    story.append(hr())
    story.append(para(
        "The user is the emperor of the earth. Any ruling may be overturned with a stated reason; overrides are logged as addenda. "
        "Source repository: <a href=\"https://github.com/giomj/dev/tree/main/skills/grand-council\" color=\"#01696F\">github.com/giomj/dev/skills/grand-council</a>.",
        "footer"))

    doc.build(story)
    print(f"wrote {output_path}")

if __name__ == "__main__":
    build("/home/user/workspace/conceptual-engineering-references/2026-07-18-grand-council-session-3.pdf")
