"""Render the 2026-07-18 Grand Council ruling to PDF."""
import os
import re
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, HRFlowable, KeepTogether
)
import urllib.request

# --- Fonts: download Inter and DM Sans from Google Fonts CDN ---
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

# --- Colors (Nexus light palette) ---
BG = colors.HexColor("#F7F6F2")
TEXT = colors.HexColor("#28251D")
MUTED = colors.HexColor("#7A7974")
PRIMARY = colors.HexColor("#01696F")
ACCENT_REJECT = colors.HexColor("#A12C7B")
ACCENT_MIXED = colors.HexColor("#964219")
ACCENT_SOUND = colors.HexColor("#437A22")
ACCENT_REF = MUTED
BORDER = colors.HexColor("#D4D1CA")

# --- Styles ---
styles = {
    "title": ParagraphStyle("title", fontName=HEAD_FONT, fontSize=26, leading=32, textColor=TEXT, spaceAfter=6),
    "subtitle": ParagraphStyle("subtitle", fontName=BODY_FONT, fontSize=11, leading=15, textColor=MUTED, spaceAfter=18),
    "h1": ParagraphStyle("h1", fontName=HEAD_FONT, fontSize=18, leading=22, textColor=TEXT, spaceBefore=18, spaceAfter=8),
    "h2": ParagraphStyle("h2", fontName=HEAD_FONT, fontSize=13, leading=17, textColor=TEXT, spaceBefore=12, spaceAfter=4),
    "meta": ParagraphStyle("meta", fontName=BODY_FONT, fontSize=9, leading=12, textColor=MUTED, spaceAfter=6),
    "body": ParagraphStyle("body", fontName=BODY_FONT, fontSize=10.5, leading=15, textColor=TEXT, spaceAfter=6, alignment=TA_LEFT),
    "seat": ParagraphStyle("seat", fontName=BODY_FONT, fontSize=10.5, leading=15, textColor=TEXT, spaceAfter=6, leftIndent=10),
    "ruling_sound":  ParagraphStyle("ruling_s", fontName=BOLD_FONT, fontSize=11, leading=15, textColor=ACCENT_SOUND, spaceBefore=8, spaceAfter=4),
    "ruling_mixed":  ParagraphStyle("ruling_m", fontName=BOLD_FONT, fontSize=11, leading=15, textColor=ACCENT_MIXED, spaceBefore=8, spaceAfter=4),
    "ruling_reject": ParagraphStyle("ruling_r", fontName=BOLD_FONT, fontSize=11, leading=15, textColor=ACCENT_REJECT, spaceBefore=8, spaceAfter=4),
    "ruling_ref":    ParagraphStyle("ruling_ref", fontName=BOLD_FONT, fontSize=11, leading=15, textColor=ACCENT_REF, spaceBefore=8, spaceAfter=4),
    "action": ParagraphStyle("action", fontName=ITALIC_FONT, fontSize=10, leading=14, textColor=PRIMARY, spaceBefore=4, spaceAfter=6, leftIndent=10, borderPadding=(4, 6, 4, 6)),
    "code": ParagraphStyle("code", fontName=BODY_FONT, fontSize=9.5, leading=13, textColor=TEXT, spaceAfter=6, leftIndent=8, backColor=colors.HexColor("#EFEDE7")),
}

def hr():
    return HRFlowable(width="100%", thickness=0.6, color=BORDER, spaceBefore=8, spaceAfter=8)

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def para(text, style_name="body"):
    return Paragraph(text, styles[style_name])

def ruling_style_for(verdict):
    v = verdict.lower()
    if "sound" in v: return "ruling_sound"
    if "mixed" in v: return "ruling_mixed"
    if "reject" in v: return "ruling_reject"
    if "reference" in v: return "ruling_ref"
    return "ruling_sound"

# --- Content ---
story = []

story.append(para("Grand Council — Session of 2026-07-18", "title"))
story.append(para(
    "Convened by James Gianotti · Space: Grand Council · Synthesist: Perplexity Computer · "
    "Backing models: Physicist gpt_5_5 · Engineer claude_sonnet_4_6 · Mathematician gemini_3_1_pro · "
    "Historian-Philosopher claude_opus_4_8 · Skeptic gemini_3_1_pro",
    "subtitle"))

story.append(hr())

# Docket
story.append(para("Docket", "h1"))
docket_rows = [
    ("A", "Lorenz Equation infographic", "Textbook", "Sound"),
    ("B", "Sam Mathverse matrix series (3 pages)", "Textbook", "Reference"),
    ("C", "PKM-BLT “Cosmic Evolution Model”", "Self-published", "Reject"),
    ("D", "1000W ZVS induction heater render", "Hobbyist", "Mixed"),
    ("E", "Volumetric Flow / Continuity Equation", "Textbook", "Sound*"),
]
for a, name, tier, verdict in docket_rows:
    style = ruling_style_for(verdict)
    story.append(Paragraph(
        f'<font name="{BOLD_FONT}">Artifact {a}.</font> {esc(name)} · '
        f'<font color="#7A7974">tier: {tier}</font> · '
        f'<font color="{styles[style].textColor.hexval()}"><font name="{BOLD_FONT}">Ruling: {verdict}</font></font>',
        styles["body"]))

story.append(hr())

# Artifact section builder
def artifact_section(letter, title, intake, tier, claims, seats, cross, verdict, ruling_text, action):
    story.append(para(f"Artifact {letter} — {esc(title)}", "h1"))
    story.append(para(f"<font name=\"{BOLD_FONT}\">Intake.</font> {esc(intake)} <font color=\"#7A7974\">Evidence tier: {tier}. Claims Under Review: {claims}.</font>", "body"))
    for seat_name, seat_text in seats:
        story.append(para(f"<font name=\"{BOLD_FONT}\">{seat_name}.</font> {seat_text}", "seat"))
    if cross:
        story.append(para(f"<font name=\"{BOLD_FONT}\">Skeptic’s cross.</font> {cross}", "seat"))
    story.append(para(f"Ruling — {verdict}. {ruling_text}", ruling_style_for(verdict)))
    story.append(para(f"Action. <font name=\"{BODY_FONT}\">{esc(action)}</font>", "action"))
    story.append(hr())

# --- Artifact A ---
artifact_section(
    "A",
    "Lorenz Equation infographic",
    "Pedagogical card summarizing Lorenz’s 1963 three-ODE system, canonical parameters (σ=10, ρ=28, β=8/3), the butterfly attractor, and its role in chaos theory.",
    "Textbook",
    "C1–C6",
    [
        ("Physicist", "ODEs and parameter roles (C1, C2) are stated correctly; deterministic sensitive dependence and two-lobed strange attractor (C3, C4) are standard. Only C5 needs qualification — the “butterfly” title of the 1972 AAAS talk is often credited to Philip Merilees, not Lorenz."),
        ("Engineer", "I abstain — outside my charge."),
        ("Mathematician", "Dissipative system: div F = &minus;(σ+1+β) &lt; 0, so phase-space volumes contract. “Fractal / figure-eight” (C4) is technically imprecise; the attractor is a <font name=\"" + ITALIC_FONT + "\">strange attractor</font> with Hausdorff dimension ≈ 2.06."),
        ("Historian-Philosopher", "“Father of Chaos Theory” (C6) is defensible but should be historicized — real precursors include Poincaré (1890 three-body) and Smale’s horseshoe (early 1960s). Lorenz is a founder, not the sole father. C5 correction stands — Merilees named the 1972 talk (earlier metaphor was a seagull)."),
    ],
    "C5 is historically simplistic but popularly accepted. No Motion to Reject. Sound reference material.",
    "Sound",
    "The card transmits the canonical Lorenz system and its consequences faithfully. Only C5 (naming attribution) requires an asterisk. Everything else is right.",
    "recursive-state-dynamics :: implement a Lorenz(σ=10, ρ=28, β=8/3) reference trajectory in the L/K/E simulator and compare its Lyapunov spectrum to RSD test cases :: reproduce λ₁ ≈ 0.906, λ₂ ≈ 0, λ₃ ≈ −14.57 to within 5%",
)

# --- Artifact B ---
artifact_section(
    "B",
    "Sam Mathverse matrix series (three pages)",
    "Sequential handwritten-style linear-algebra reference pages (sections 3–15) covering equal matrices, transpose, operations, zero/identity, diagonal, scalar, triangular, symmetric, skew-symmetric, Hermitian, and skew-Hermitian matrices.",
    "Textbook",
    "C1–C3",
    [
        ("Physicist", "I abstain — outside my charge."),
        ("Engineer", "I abstain — outside my charge."),
        ("Mathematician", "Audited every definition. (A<super>T</super>)<super>T</super> = A ✓; symmetric a<sub>ij</sub> = a<sub>ji</sub> ✓; skew a<sub>ii</sub> = 0 ✓; Hermitian A* = A with real diagonal ✓; skew-Hermitian with real entries reduces to skew-symmetric ✓; multiplication c<sub>ij</sub> = Σ<sub>k</sub> a<sub>ik</sub> b<sub>kj</sub> with (m×n)(n×p) = m×p ✓. All definitions and derived properties are rigorously correct."),
        ("Historian-Philosopher", "Lineage runs through Cayley’s 1858 <font name=\"" + ITALIC_FONT + "\">Memoir on the Theory of Matrices</font> and Hermite’s mid-19th-c. forms with real spectra. Faithful transmission of a 170-year-old canon. Only meaning-question: no attribution to Cayley or Hermite on the cards themselves."),
    ],
    "No claims overstated. No Motion to Reject.",
    "Reference",
    "Correct standard linear-algebra pedagogy. No dispute to litigate. Attribution to Cayley/Hermite would strengthen the deck.",
    "None — Reference material. Optional: add a fourth card citing Cayley (1858) and Hermite (~1855) for provenance.",
)

story.append(PageBreak())

# --- Artifact C ---
artifact_section(
    "C",
    "PKM-BLT “Cosmic Evolution Model”",
    "A yellow single-page infographic claiming to be a “COMPLETE MATHEMATICAL FRAMEWORK OF THE UNIVERSE” built on H₀ as a “locked initial value” and the identity H₀·tᵤ = 1.",
    "Self-published",
    "C1–C7",
    [
        ("Physicist", "<font name=\"" + BOLD_FONT + "\">Reject the physics.</font> H₀·t<sub>u</sub> = 1 is not a fundamental identity — it is a tautology because t<sub>u</sub> is defined as 1/H₀ (C1). A₀ = cH₀ has units of acceleration but numerical coincidence with MOND’s a₀ ≈ cH₀ (Milgrom 1983) requires attribution and mechanism, not numerology (C2). H(t) = H₀(1 − e<super>−t/t<sub>u</sub></super>) is cosmologically wrong: ΛCDM has H(t) → ∞ toward the Big Bang and → constant only in the late de-Sitter limit (C3, C5). Eleven significant figures on H₀ (C7) is indefensible given the ~2% Planck/SH0ES tension (67.4 vs 73.0 km/s/Mpc)."),
        ("Engineer", "Flag on C7 as a false-precision signal. Nobody who understands uncertainty propagation quotes a ~2%-uncertain quantity to 11 figures."),
        ("Mathematician", "λ = A₀/c = H₀ = 1/t<sub>u</sub> is definitions and symbol introductions, not derivations. H₀·t<sub>u</sub> = 1 is an algebraic tautology, not an identity. R(t) = c[t − t<sub>u</sub>(1 − e<super>−t/t<sub>u</sub></super>)] is dimensionally correct but presented without physical interpretation. A framework requires grounded axioms, not cyclic definitions."),
        ("Historian-Philosopher", "Belongs to the social-media Theory-of-Everything genre — yellow background, master equation, locked constant, tautological identity, invocation of standard textbook relations as if original. Compared with Wolfram’s Physics Project, Weinstein’s Geometric Unity, or Haramein’s work, PKM-BLT sits at the low-rigor end. The “leak” mechanism is undefined; “cosmic controller” is not physics vocabulary. Repackaged mysticism, not lineage."),
    ],
    "<font name=\"" + BOLD_FONT + "\">Motion to Reject filed on C5.</font> Unfalsifiable “leak” mechanism, no observational predictions distinguishable from ΛCDM, tautological identity, false precision to 11 figures during an active Hubble tension.",
    "Reject",
    "Motion to Reject accepted. The four seats agree: PKM-BLT dresses a definition (tᵤ := 1/H₀) as a discovery, contradicts observed cosmic-expansion history, and quotes precision no measurement supports. It does not supersede or subsume ΛCDM. Do not carry it forward.",
    "gravitational-compass :: write a one-page rebuttal note titled “H₀·t_u = 1 is a definition, not an identity” for docs/, contrasting PKM-BLT H(t)=H₀(1−e^{−t/t_u}) against ΛCDM Friedmann H(a) with Planck 2018 parameters :: rebuttal reproduces Planck ΛCDM H(z) to visual accuracy on a log-z plot from z=0 to z=1100",
)

# --- Artifact D ---
artifact_section(
    "D",
    "1000W ZVS-style induction heater schematic",
    "A stylized render of a Mazzilli-family ZVS driver labeled 1000W: 6-turn 6mm work coil, ~2µF tank, dual IRFP250N cross-coupled MOSFETs, 100µH/10A chokes, asymmetric 12V/22V Zener gate clamp, 12–48V DC input, no cooling or snubbers shown.",
    "Hobbyist",
    "C1–C6",
    [
        ("Physicist", "Topology is a valid resonant tank; ω₀ = 1/√(LC) with L ≈ 1–2 µH and C ≈ 2 µF gives f₀ ≈ 80–160 kHz (C1). At 48V, 1kW → 21A rail current → I²R ≈ 37W per FET before switching, diode, choke, and tank losses. Heatsink-and-airflow territory (C2, C5). Asymmetric 12/22V gate clamps, 10A chokes, and absent cooling make C3, C4, C6 unsupported for continuous 1kW."),
        ("Engineer", "Build case fails on C2–C6. IRFP250N θjc ≈ 0.64°C/W → without heatsinking, T<sub>j</sub> hits 175°C in seconds. 22V Zener against IRFP250N absolute-max V<sub>gs</sub> of ±20V is a <font name=\"" + BOLD_FONT + "\">direct spec violation</font>. 100µH/10A chokes saturate long before 20+A rail current; saturated chokes short the rail through the FETs — instant failure. No drain-source snubber; no water cooling on the work coil. Educational render, not a build-from BOM."),
        ("Mathematician", "Second-order LC oscillator; Q = (1/R)√(L/C). Canonical Mazzilli topology has two-fold reflection symmetry; the 12V/22V Zener asymmetry (C3) breaks that symmetry — either the render is wrong or the design is wrong."),
        ("Historian-Philosopher", "Lineage is authentic — Vladimiro Mazzilli’s ZVS design, mid-2000s hobbyist forums, originally for flyback / Tesla-coil driving before migrating to induction heating (C1). The render matches Chinese-kit marketing-image style; the asymmetric Zeners are almost certainly an illustration error rather than deliberate design."),
    ],
    "<font name=\"" + BOLD_FONT + "\">Motion to Reject filed on C2</font> — “1000 W” as stated with this BOM and no cooling/snubbers is dangerously false. Falsifiability test: build it, run 48V continuous; predict thermal shutdown or MOSFET failure within 60 s.",
    "Mixed",
    "Topology (C1) is Sound; the claimed 1000W operating point (C2, C5, C6) is Rejected at this BOM; the asymmetric Zener design (C3) is either a render error or a spec violation — treat as render error and build symmetric 12V or 15V. Motion to Reject accepted, narrowed to C2.",
    "cbjg-benchtop-motor-build :: adapt the Mazzilli ZVS topology into a bench prototype at a safer 100–200W design point using IRFP250N with proper heatsinking, symmetric 15V Zeners, saturated-current-rated chokes (≥ Ipk×2), and an RC drain-source snubber :: prototype delivers rated power for ≥ 5 min continuous with FET case < 80°C on an ambient-air heatsink",
)

story.append(PageBreak())

# --- Artifact E ---
artifact_section(
    "E",
    "Volumetric Flow Rate / Continuity Equation",
    "Hand-drawn engineering notebook page by Sanjiv Ganjir teaching Q = A·v and A₁v₁ = A₂v₂ via a garden-hose analogy and a highway-traffic analogy.",
    "Textbook",
    "C1–C4",
    [
        ("Physicist", "Q = A·v (C1) and A₁v₁ = A₂v₂ (C2) are correct in the incompressible, one-dimensional, uniform-velocity limit. Mass conservation (C3) is exactly right — the mass-continuity PDE collapses to div v = 0 for constant ρ. Garden-hose intuition honest. Highway analogy (C4) breaks: real traffic is compressible in the LWR sense, so a narrower road lowers velocity and raises density."),
        ("Engineer", "Sound pedagogy on C1–C3; applications panel is well-chosen. Highway analogy (C4) works for the intuition “throughput conserved,” but any student who uses it for real pipe design will over-predict velocity in narrow sections and under-predict pressure drop. Use the water figure for calculations; discard the highway figure after first exposure."),
        ("Mathematician", "Formulation is the div v = 0 limit of the mass-continuity PDE. Real traffic per LWR has density-dependent velocity; density spikes at constrictions, velocity drops, backward-propagating shockwaves form — highway flow explicitly violates div v = 0. Equating incompressible flow to macroscopic traffic is structurally false (C4)."),
        ("Historian-Philosopher", "C1–C3 sit atop a ~270-year lineage — Euler (1757), Cauchy’s continuum formalization. Hydraulic-analogy pedagogy (Kirchhoff via water pipes) is a 19th-century tradition. C4 has its own real lineage in Lighthill–Whitham (1955) and Richards (1956), but that lineage makes the analogy technically inexact: LWR traffic is compressible with shockwaves incompressible continuity cannot produce."),
    ],
    "C4 is misleading past introductory framing. No Motion to Reject — the physics stands. Falsifiability test: observe merging lanes; velocity falls as density rises, opposite to incompressible flow.",
    "Sound",
    "Core physics (C1–C3) transmitted correctly; pedagogy honest. Highway analogy (C4) should be annotated pedagogically useful, technically inexact — real traffic obeys LWR, not incompressible continuity.",
    "force-carriers :: when preparing the “conservation laws” companion card, use the garden-hose figure as exemplar and explicitly contrast the highway analogy against LWR to inoculate students against the analogy failure mode :: card includes a side-by-side (div v = 0) vs (∂ρ/∂t + ∂(ρv)/∂x = 0) comparison in ≤ 150 words",
)

# --- Cross-cutting synthesis ---
story.append(para("Cross-cutting synthesis", "h1"))
story.append(para(
    "<font name=\"" + BOLD_FONT + "\">Faithful pedagogy (A, B, E).</font> Correctly transmit real canonical material. A carries a naming asterisk; E carries an analogy caveat; B is unblemished reference. Council posture: transmit forward.",
    "body"))
story.append(para(
    "<font name=\"" + BOLD_FONT + "\">Legitimate topology, dishonest labeling (D).</font> The Mazzilli ZVS lineage is real and buildable at modest power. The specific render dresses it as a 1000W finished product it is not. Council posture: strip the label, keep the topology, build symmetric and small before scaling.",
    "body"))
story.append(para(
    "<font name=\"" + BOLD_FONT + "\">Definition-dressed-as-discovery (C).</font> PKM-BLT is a tautology (t<sub>u</sub> := 1/H₀) wrapped in yellow with numerology-tier precision, contradicting the observed H(t) profile. Council posture: reject and rebut. Do not let this pattern contaminate the gravitational-compass work.",
    "body"))

story.append(para("Portfolio impact", "h2"))
for line in [
    "recursive-state-dynamics — gain a Lorenz Lyapunov-spectrum validation harness (from A).",
    "gravitational-compass — gain a written rebuttal against the PKM-BLT genre (from C).",
    "cbjg-benchtop-motor-build — gain a safer, symmetric Mazzilli ZVS prototype target (from D).",
    "force-carriers — gain an LWR-vs-continuity contrast card (from E).",
]:
    story.append(para("• " + line, "body"))

story.append(hr())
story.append(para(
    "The user is the emperor of the earth. Any ruling may be overturned with a stated reason; overrides are logged as addenda. Source repository: "
    "<a href=\"https://github.com/giomj/dev/tree/main/skills/grand-council\" color=\"#01696F\">github.com/giomj/dev/skills/grand-council</a>.",
    "meta"))


def build():
    out = "/home/user/workspace/grand-council/2026-07-18-grand-council-ruling.pdf"
    doc = SimpleDocTemplate(
        out, pagesize=LETTER,
        leftMargin=0.75 * inch, rightMargin=0.75 * inch,
        topMargin=0.75 * inch, bottomMargin=0.75 * inch,
        title="Grand Council — 2026-07-18 — Seven Artifacts Ruling",
        author="Perplexity Computer",
    )
    doc.build(story)
    print("wrote", out)

if __name__ == "__main__":
    build()
