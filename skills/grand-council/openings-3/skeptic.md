# Session 3 Skeptic's Cross

## n2yo.com

C1 relies on the assumption that propagating standard SGP4 TLEs provides sufficient operational accuracy, but TLE freshness directly throttles position precision—an older TLE on a drag-heavy LEO object will misalign with reality despite correct math. C2 incorrectly portrays the API ToS limits as the only constraint, when in fact redistribution of Space-Track derived data often triggers upstream licensing covenants that n2yo cannot waive for downstream apps. C3 dismisses the 57-category taxonomy as mere "n2yo-editorial", but this structure likely inherits deep, baked-in operational biases from its early ham-radio and military-heritage origins (e.g. over-segmenting specific frequency bands while lumping modern commercial mega-constellations). 

## SatDump

C1 anoints SatDump as the "leading" suite, yet alternative modular flows (like GNU Radio combined with Meteor Demod and legacy wxtoimg wrappers) often offer superior control for niche hardware or novel modulations that SatDump hasn't upstreamed. C2 praises the pipeline graph architecture, but such tightly coupled monoliths risk becoming brittle unmaintainable state-machines compared to strictly decoupled UNIX-style SDR data pipes. C3 asserts sufficient radio coverage, but neglects the rapidly growing ecosystem of generic FPGA-based or ethernet-attached SDRs which are sidelined by this curated hardware list. C4 blames Android for SDR limitations, when this is likely a downstream consequence of SatDump's own libusb compilation choices rather than fundamental Android USB-host impossibilities.

## Global Oil & Gas Plant Tracker (GOGPT)

C1 frames the tracker as a definitive primary-secondary hybrid, yet its reliance on varying, non-uniform NGO and media reports structurally limits its global consistency compared to pure remote-sensing methodologies. C2 insists the 1,047 GW is a real summed figure, but treating "proposed" capacity with equal data-weight as "under construction" heavily skews the metric toward phantom projects. C3 rightly flags the U.S. 252 GW IRP number as inflated, but fails to demand a specific statistical discount rate for IRP-to-construction attrition, rendering the unadjusted headline figure dangerously misleading. C4 incorrectly equates CC BY 4.0 with frictionless integration; the rigid, cascading attribution obligation imposes real UX and data-schema costs that are not "free". The claim of "peer-reviewed" data requires a rigorous, published list of reviewers per release, which is conspicuously absent from the methodology.

## Integration Plan

The proposed linkage between GOGPT and Recursive State Dynamics (RSD) is fundamentally flawed. Attempting to shoehorn a discrete dataset of slow, manual bureaucratic state transitions (proposed → permitted → operating) into a framework designed for recursive state modeling (L/K/E formalism) is a category error that stretches the definition of "dynamics" to the breaking point. **Motion to Reject** the GOGPT ↔ RSD portfolio link on the grounds of severe ontological mismatch.