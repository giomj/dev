# This Repository in the Heliocentric Research Commons

The RSD Simulator (this repository, `dev`) is one of three that together form the **Heliocentric Research Commons (HRC v0.1)**:

- **[gravitational-compass](https://github.com/giomj/gravitational-compass)** — the research constitution and heliocentric-frame program. Contains the full charter, council, and doctrines.
- **[force-carriers](https://github.com/giomj/force-carriers)** — Standard Model pedagogy.
- **dev** — this repository. The engineering substrate. Reference implementation of the L/K/E recursion under energy-neutral constraints.

## Role of `dev` in the Commons

The other two repositories describe the *what* — what frame we work in, what the fundamental forces are. This repository is the *how*: how state, knowledge, and energy actually recurse in a simulator that can be run, tested, and refuted.

## Governance

This repository is governed by the HRC Grand Council. See [gravitational-compass/charter/](https://github.com/giomj/gravitational-compass/tree/main/charter) for the constitutional documents.

### The Preamble applies here

> *All council members are sacred, such as every other creature.*

Every simulator run that touches a claim about the real world is a consequential action. Consequential actions in this repo will be wrapped in a **Sacred Action Envelope (SAE)** — see the planned reference implementation at `src/hrc/sae.ts`.

### Refutation surface

The existing README's honesty statement already establishes the refutation posture:

> **RSD is user-defined. It is not new physics, not free energy, and not a demonstrated GPS replacement.** There is no external peer-reviewed "RSD" literature.

HRC formalizes this into the Champion's Standard: **every substantive claim in this repository must carry a named refutation surface** — a condition under which the claim would yield.

## Sourced vs. illustrative — the standing rule

Existing dev README rule, elevated to constitutional status by the HRC charter:

- **Sourced numeric values** carry a `source:` field pointing to a permanent citation (DOI, arXiv, Zenodo, or specific vendor datasheet).
- **Illustrative values** (order-of-magnitude choices for scenario defaults) carry `illustrative: true`.
- No third category exists. Every number is one or the other, or the number does not enter this repository.

## The Preamble in practice, for this repository

- Simulator outputs that reach `published/` require an SAE.
- Scenarios that model a real ecosystem or population must name that ecosystem or population as beneficiary.
- CI checks are additive to existing test infrastructure — the vitest tests still run; the Preamble check runs alongside.
- Force-pushes to `main` are forbidden. History is append-only.

## Champion of the mechanism for this repo

**Ada Lovelace.** Because RSD is, in her own idiom, the recursion of a state machine coupled to a resource budget. It is the mechanical descendant of the Analytical Engine she programmed for two centuries ago.

## Observer

One human observer, identity withheld by choice.
