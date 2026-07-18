"""Render the 2026-07-18 Grand Council Reformation Session 2 ruling to PDF."""
import os
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, HRFlowable
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
    "subtitle": ParagraphStyle("subtitle", fontName=BODY_FONT, fontSize=10, leading=14, textColor=MUTED, spaceAfter=18),
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

story.append(para("Grand Council — Reformation Session 2", "title"))
story.append(para(
    "Session of 2026-07-18 · Convened by James Gianotti · Space: Grand Council · Synthesist: Perplexity Computer · "
    "Backing models: Physicist gpt_5_5 · Engineer claude_sonnet_5_0 · Mathematician gemini_3_1_pro · "
    "Historian-Philosopher claude_opus_4_8 · Skeptic gemini_3_1_pro",
    "subtitle"))

story.append(hr())

# Docket
story.append(para("Docket", "h1"))
docket_rows = [
    ("F", "Satellite Communication infographic", "Social-pop", "Mixed"),
    ("G", "Fluid Mechanics slide 11 (Sanjiv Ganjir)", "Textbook", "Sound"),
    ("H", "IC Engines slide 9 (Sanjiv Ganjir)", "Textbook", "Sound"),
    ("I", "Refrigeration & AC slide 10 (Sanjiv Ganjir)", "Textbook", "Sound"),
]
for a, name, tier, verdict in docket_rows:
    style = ruling_style_for(verdict)
    story.append(Paragraph(
        f'<font name="{BOLD_FONT}">Artifact {a}.</font> {esc(name)} · '
        f'<font color="#7A7974">tier: {tier}</font> · '
        f'<font color="{styles[style].textColor.hexval()}"><font name="{BOLD_FONT}">Ruling: {verdict}</font></font>',
        styles["body"]))

story.append(hr())

def artifact_section(letter, title, intake, tier, claims, seats, cross, verdict, ruling_text, action):
    story.append(para(f"Artifact {letter} — {esc(title)}", "h1"))
    story.append(para(f"<font name=\"{BOLD_FONT}\">Intake.</font> {esc(intake)} <font color=\"#7A7974\">Evidence tier: {tier}. Claims Under Review: {claims}.</font>", "body"))
    for seat_name, seat_text in seats:
        story.append(para(f"<font name=\"{BOLD_FONT}\">{seat_name}.</font> {seat_text}", "seat"))
    if cross:
        story.append(para(f"<font name=\"{BOLD_FONT}\">Skeptic\u2019s cross.</font> {cross}", "seat"))
    story.append(para(f"Ruling \u2014 {verdict}. {ruling_text}", ruling_style_for(verdict)))
    story.append(para(f"Action. <font name=\"{BODY_FONT}\">{esc(action)}</font>", "action"))
    story.append(hr())

# --- Artifact F ---
artifact_section(
    "F",
    "Satellite Communication infographic",
    "A vendor-style poster: uplink/downlink schematic, orbit tiers (LEO/MEO/GEO with altitudes), four frequency bands (L, C, Ku, Ka) with GHz ranges and applications.",
    "Social-pop",
    "C1\u2013C7",
    [
        ("Physicist", "C4 is sound: Kepler gives r = (\u03bcT\u00b2/4\u03c0\u00b2)^(1/3); with T = 86,164 s \u2192 r = 4.2164\u00d710\u2077 m \u2192 h = 35,786 km. \u201cFixed\u201d requires circular equatorial prograde orbit. C5 latency is physically justified: h/c gives 0.5\u20136.7 ms for 160\u20132,000 km LEO vs 119 ms ground-to-GEO one-way. \u201cHigh speed\u201d is not implied by altitude alone. <font name=\"" + BOLD_FONT + "\">C6 error: Ka is 27\u201340 GHz per IEEE, not 26\u201340 GHz.</font>"),
        ("Engineer", "Unusable as a link-budget reference. C6/C7 lack EIRP, G/T, path loss (~148 dB @ Ku, GEO slant), rain-fade margin (severe at Ku, dominant at Ka). C7 conflates GNSS ranging (one-way, no transponder) with the \u201creceive-amplify-retransmit\u201d model of C1 \u2014 GNSS satellites don\u2019t relay user traffic. GEO\u2019s ~240 ms one-way propagation delay (C4) is unmentioned; unworkable for interactive control loops. Orientation graphic only; do not design against it."),
        ("Mathematician", "C4 GEO altitude derivation via Kepler is structurally sound. GHz units in C6 dimensionally consistent. <font name=\"" + BOLD_FONT + "\">C7 is a many-to-many relation, not a well-defined function</font> \u2014 one band supports several applications; one application spans several bands."),
        ("Historian-Philosopher", "The whole poster rests on Clarke\u2019s 1945 \u201cExtra-Terrestrial Relays\u201d \u2014 GEO altitude is inheritance, not discovery. C6 band labels are WWII radar deception-code residue frozen into IEEE convention, not a rational spectrum carving. C2/C3/C5 orbit tiers encode Iridium (1998) and Starlink (2020s) lineage. <font name=\"" + ITALIC_FONT + "\">Genre: vendor-poster</font> \u2014 marketing dressed as taxonomy, ahistorical and uncited."),
    ],
    "<font name=\"" + BOLD_FONT + "\">Motion to Reject filed on C7.</font> L-band is allocated for GNSS <font name=\"" + ITALIC_FONT + "\">ranging</font> (GPS L1 at 1575.42 MHz), not communication. C5\u2019s \u201clow latency\u201d omits the required constellation-deployment cost that made LEO viable only recently. Ka-band \u201chigh-speed internet\u201d fails to account for rain fade.",
    "Mixed",
    "Motion to Reject C7 accepted narrowly. Topology of C1\u2013C5 is sound (GEO altitude derives from Kepler; band-frequency ranges mostly right modulo Ka\u2019s IEEE cutoff at 27 GHz). But the poster fails as engineering reference \u2014 no path loss, no rain fade, no latency budget, and its band-to-application mapping conflates communication with ranging. Keep as an orientation graphic; do not carry into any link-budget or system-design context.",
    "grid-and-chain-mobile :: if the app ever integrates GNSS positioning, document the L-band-ranging-not-communication distinction in a one-page technical note :: note distinguishes ranging (one-way, TOA-based) from bent-pipe relay (uplink\u2192transponder\u2192downlink) with citations to GPS ICD-200 and ITU RR",
)

# --- Artifact G ---
artifact_section(
    "G",
    "Fluid Mechanics slide 11 (Sanjiv Ganjir)",
    "Hand-drawn engineering notebook slide covering Bernoulli, Reynolds number, Continuity, Pascal\u2019s Law, Venturi meter, and Cavitation.",
    "Textbook",
    "C1\u2013C6",
    [
        ("Physicist", "C1 is sound only with hidden hypotheses stated: steady, incompressible, inviscid flow along a streamline, no shaft work / viscous loss. For real pipes: P/\u03c1g + V\u00b2/2g + z + h_p \u2212 h_t \u2212 h_L = const. C2 dimensionless; 2000/4000 thresholds are empirical regimes, not conservation-law discontinuities \u2014 depend on roughness, inlet, geometry. C3 sound for steady incompressible 1D flow. C6 sound: cavitation begins when local p &lt; p_v(T)."),
        ("Engineer", "C1 is the equation students misuse by dropping h_L \u2014 real pipe systems need extended Bernoulli with friction + fitting losses. C5\u2019s Venturi is incomplete: actual flow requires discharge coefficient C_d \u2248 0.98, overpredicts flow by 2%+ without it. <font name=\"" + BOLD_FONT + "\">C6\u2019s cavitation description is not actionable</font> \u2014 the design rule is NPSH_available &gt; NPSH_required with margin (\u2265 0.6 m). C2\u2019s Re band is reasonable. Abstain on C3/C4."),
        ("Mathematician", "C1 is a first integral of Euler\u2019s equation along a streamline. C2 Re transitions are empirical (Re_c \u2248 2300 classically) \u2014 2000 is pedagogical rounding. C3 is the 1D specialization of \u222b\u03c1v\u00b7dA = const. C4 Pascal assumes quasi-static equilibrium."),
        ("Historian-Philosopher", "Synopsis of the 18th century\u2019s great settling: Bernoulli\u2019s <font name=\"" + ITALIC_FONT + "\">Hydrodynamica</font> (1738), Euler (1757), Pascal (1653), Venturi (1797). Most historically honest claim is C2 \u2014 Reynolds\u2019s 1883 dye experiment established the <font name=\"" + ITALIC_FONT + "\">number</font> but not a crisp threshold. C6 cavitation entered engineering only with 1890s ship propeller pitting. Genre: Ganjir \u201cconceptual engineering\u201d one-pager in the <font name=\"" + ITALIC_FONT + "\">Marks\u2019 Standard Handbook</font> lineage."),
    ],
    "Falsifiable counter to C2: the 2000\u20134000 transitional regime is pedagogically unstable \u2014 canonical texts cite 2100 or 2300 for Re_c. Sharp boundaries are approximations, not invariants. Otherwise, conceded.",
    "Sound",
    "C1\u2013C6 transmit real canonical material correctly. Two pedagogical footnotes: (a) C1\u2019s Bernoulli should carry the loss-term warning for real design; (b) C5\u2019s Venturi needs C_d \u2248 0.98 to be usable as a metering reference. C2\u2019s Re threshold rounded from ~2300 to 2000 is defensible pedagogical convention. No Motion to Reject.",
    "force-carriers :: extend the conservation-laws contrast card (from Artifact E) with a Bernoulli-with-losses variant showing extended head equation with h_L :: card includes worked example where dropping h_L causes \u2265 10% pump sizing error",
)

# --- Artifact H ---
artifact_section(
    "H",
    "IC Engines slide 9 (Sanjiv Ganjir)",
    "Hand-drawn slide covering Compression ratio, Otto cycle, Diesel cycle, MEP, Brake Power, and Volumetric efficiency, with P\u2013V diagrams.",
    "Textbook",
    "C1\u2013C6",
    [
        ("Physicist", "C1 dimensionally sound: r = (V_s + V_c)/V_c = V\u2081/V\u2082. \u201cHigher r improves efficiency\u201d is sound for ideal cycles but bounded by SI knock (end-gas autoignition), heat transfer, friction, materials, emissions, finite combustion time. C2 sound only under air-standard Otto assumptions: \u03b7 = 1 \u2212 r^(1\u2212\u03b3). Real \u03b3(T), dissociation, pumping, combustion losses move it. C3 is air-standard Diesel with cutoff ratio \u03c1. C4: MEP = W_cycle/V_s (Pa). C5: BP = T(2\u03c0N/60) W if N is rpm; BP &lt; IP by friction/pumping."),
        ("Engineer", "C1\u2019s \u201chigher r improves efficiency\u201d needs the caveat this slide omits: <font name=\"" + BOLD_FONT + "\">SI engines are capped by knock, which depends on fuel octane rating</font> \u2014 pushing r without matching fuel invites detonation. CI limit shifts to peak pressure, NOx, and soot. C3 correctly uses cutoff ratio \u03c1, but if \u03c1 isn\u2019t defined on the slide, students may misapply the Otto formula to Diesel cycles. C5\u2019s BP = 2\u03c0NT/60 is trustworthy only if T is N\u00b7m and N is rpm."),
        ("Mathematician", "Otto \u03b7 = 1 \u2212 r^(1\u2212\u03b3) is formally derived from the air-standard cycle. <font name=\"" + BOLD_FONT + "\">Diesel formula is structurally verifiable: taking cutoff ratio \u03c1 \u2192 1 recovers Otto efficiency via L\u2019H\u00f4pital\u2019s rule</font> \u2014 the two cycles are a one-parameter family unified in the \u03c1 = 1 limit. MEP is the cycle integral: MEP = W_cycle / V_swept where W_cycle = &#8747; P dV over one cycle."),
        ("Historian-Philosopher", "Genuine rivalry made pedagogy: Otto (1876 four-stroke SI), Diesel (1893 patent, 1897 first working engine) \u2014 two combustion philosophies (constant V vs constant P) preserved side by side. Above both looms Carnot (1824) \u2014 the ceiling every claim obeys but the slide doesn\u2019t name. P\u2013V convention is Clapeyron\u2019s 1834 graphical gift. Genre: 20th-century engineering-school cheat sheet in <font name=\"" + ITALIC_FONT + "\">Marks\u2019 Handbook</font> lineage."),
    ],
    "Falsifiable counter to C1: \u201cgenerally\u201d masks catastrophic failure \u2014 in SI engines r \u2264 12 for pump gas due to detonation. Falsifiable counter to C3: Diesel formula assumes constant \u03c1, whereas real diesel operation exhibits variable \u03c1 dependent on load / throttle position.",
    "Sound",
    "All six claims transmit correct air-standard analysis. Two pedagogical footnotes accepted: (a) C1 needs a knock/octane sidebar for SI application, (b) C3\u2019s cutoff ratio \u03c1 must be defined on the slide to prevent misapplication of the Otto formula to Diesel cycles. The Diesel-to-Otto limit (\u03c1 \u2192 1) is a beautiful structural check worth adding. Carnot ceiling should be named. No Motion to Reject.",
    "cbjg-benchtop-motor-build :: prepare a one-page reference for the RSD-controlled BLDC test rig documenting the Carnot-vs-air-standard-Otto ceiling for any thermal reference cycles used in the control law :: reference includes Carnot COP formula, air-standard efficiency envelope, and the fact that BLDC electrical efficiency does not obey Carnot \u2014 separate thermal from electromechanical analysis",
)

# --- Artifact I ---
artifact_section(
    "I",
    "Refrigeration & Air Conditioning slide 10 (Sanjiv Ganjir)",
    "Hand-drawn slide covering COP, Refrigeration Effect, Ton of Refrigeration, Vapor Compression Cycle, Psychrometry, and Relative Humidity.",
    "Textbook",
    "C1\u2013C6",
    [
        ("Physicist", "C2 sound with sign convention: q_L = h\u2081 \u2212 h\u2084 &gt; 0, state 1 = evaporator exit / compressor inlet, state 4 = expansion-valve exit / evaporator inlet. C1: COP_R = q_L / w_in = (h\u2081 \u2212 h\u2084)/(h\u2082 \u2212 h\u2081) dimensionless. <font name=\"" + BOLD_FONT + "\">C3: 1 TR = 12,000 Btu/h = 3.51685 kW, so 3.517 kW is correct 4-sig-fig rounding</font>; 211 kJ/min is consistent. C4 is the standard vapor-compression energy loop. C6 sound: \u03c6 = 100 \u00b7 p_v / p_ws(T); saturation pressure must be at same dry-bulb temperature."),
        ("Engineer", "C3 conceded \u2014 3.517 is correct to 4 sig figs. C2 needs explicit statement that h\u2081 is evaporator exit and h\u2084 is expansion-device exit; for idealized VCRS, expansion is isenthalpic, so <font name=\"" + BOLD_FONT + "\">h\u2084 = h\u2083 (condenser exit)</font> \u2014 if that equivalence isn\u2019t shown, students will search for a nonexistent separate h\u2084 value on the p\u2013h chart. C1\u2019s COP matches how technicians actually rate systems. Abstain on psychrometric chart layout \u2014 outside buildability charge."),
        ("Mathematician", "COP_R = Q_L/W is a first-law energy balance. <font name=\"" + BOLD_FONT + "\">The artifact omits the Carnot upper bound: COP_R,Carnot = T_L / (T_H \u2212 T_L)</font> \u2014 worth flagging. RE = h\u2081 \u2212 h\u2084 uses the steady-flow energy equation Q = \u0394h at constant pressure."),
        ("Historian-Philosopher", "Two histories braided: mechanical refrigeration (Perkins 1834 first VCC patent) and moist-air science. C3\u2019s \u201cton of refrigeration\u201d is an Americanism from the 1880s ice trade \u2014 a commercial unit fossilized into thermodynamics, its 12,000 Btu/h a memorial to selling coldness by the block. p\u2013h plotting owes to Mollier (1904). Psychrometry crystallized 1910\u20131930 alongside Carrier\u2019s 1902 chart. Genre: Ganjir one-pager, <font name=\"" + ITALIC_FONT + "\">Marks\u2019 Handbook</font> lineage."),
    ],
    "Concede C3: 1 TR is exactly 3.5168525 kW, making 3.517 a defensible 4-sig-fig rounding. 12,000 Btu/h conversion is 11,999.98, an acceptable engineering convenience. Artifact conceded.",
    "Sound",
    "All six claims are correct textbook material. Three pedagogical improvements: (a) C2 should state explicitly that h\u2084 = h\u2083 for isenthalpic expansion, (b) C1 should carry the Carnot ceiling COP_R,Carnot = T_L / (T_H \u2212 T_L) as the upper bound any real system approaches, (c) C4 should annotate the p\u2013h chart Mollier lineage. No Motion to Reject.",
    "None \u2014 Reference material. Slide is sound for pedagogy; the Carnot-ceiling addition applies to Artifact H\u2019s action, not here.",
)

# --- Cross-cutting synthesis ---
story.append(para("Cross-cutting synthesis", "h1"))
story.append(para(
    "<font name=\"" + BOLD_FONT + "\">Textbook-tier canonicals (G, H, I).</font> Three Sanjiv Ganjir \u201cconceptual engineering\u201d slides transmit real 18th\u201320th century material honestly. The genre \u2014 hand-drawn one-page synopsis in the <font name=\"" + ITALIC_FONT + "\">Marks\u2019 Standard Handbook</font> lineage \u2014 is a legitimate pedagogical tradition. Each carries small footnotes (Bernoulli h_L, cutoff ratio \u03c1 definition, h\u2084 = h\u2083, Carnot ceilings) but none warrants rejection. Council posture: transmit forward, augment with footnotes.",
    "body"))
story.append(para(
    "<font name=\"" + BOLD_FONT + "\">Social-pop vendor-poster (F).</font> Correct on physics (GEO altitude, band ranges modulo Ka\u2019s IEEE cutoff), incorrect on framing (many-to-many band-application mapping presented as function; GNSS ranging conflated with communication transponder; latency / rain-fade / link-budget omitted). Council posture: retain as orientation graphic, strip authority as engineering reference.",
    "body"))

story.append(para("Two pedagogical patterns worth naming", "h2"))
story.append(para(
    "<font name=\"" + BOLD_FONT + "\">Missing-caveat pattern</font> (G-C1 Bernoulli, H-C1 compression ratio, I-C2 h\u2084 identity). The equation is right but the assumption or edge case that makes it dangerous is invisible. Fix: annotate constraints on the slide, not in the textbook the student may not read.",
    "body"))
story.append(para(
    "<font name=\"" + BOLD_FONT + "\">Missing-ceiling pattern</font> (H, I). Neither slide names Carnot. All efficiency and COP claims sit under a theoretical envelope that goes unnamed. Fix: any efficiency / COP reference should carry its Carnot ceiling as a companion equation.",
    "body"))

story.append(para("Portfolio impact", "h2"))
for line in [
    "\u2022 grid-and-chain-mobile \u2014 gain a one-page L-band-ranging-vs-communication technical note (from F).",
    "\u2022 force-carriers \u2014 extend the conservation-laws contrast card with Bernoulli-with-losses (from G).",
    "\u2022 cbjg-benchtop-motor-build \u2014 one-page Carnot-vs-air-standard reference for the RSD control law (from H).",
    "\u2022 (I contributes to H\u2019s action rather than a separate portfolio item.)",
]:
    story.append(para(line, "body"))

story.append(hr())
story.append(para(
    "The user is the emperor of the earth. Any ruling may be overturned with a stated reason; overrides are logged as addenda. "
    "Source repository: <a href=\"https://github.com/giomj/dev/tree/main/skills/grand-council\" color=\"#01696F\">github.com/giomj/dev/skills/grand-council</a>.",
    "meta"))

# --- Build ---
OUT = "/home/user/workspace/grand-council/2026-07-18-grand-council-session-2.pdf"
doc = SimpleDocTemplate(
    OUT, pagesize=LETTER,
    leftMargin=0.85*inch, rightMargin=0.85*inch,
    topMargin=0.75*inch, bottomMargin=0.75*inch,
    title="Grand Council — Reformation Session 2 (2026-07-18)",
    author="Perplexity Computer",
)
doc.build(story)
print("wrote", OUT)
