/**
 * Recursive State Dynamics (RSD v0.1) simulator — public API.
 *
 * RSD is a user-defined engineering/epistemic meta-framework (not new physics,
 * not free energy, not a GPS replacement). See README for scope and honesty
 * statement. This module runs fully offline and deterministically.
 */

export * from "./domain/units.js";
export * from "./domain/state.js";
export { Rng } from "./rng.js";

export * from "./domain/linalg.js";

export * from "./recursions/localization.js";
export * from "./recursions/knowledge.js";
export * from "./recursions/energy.js";
export * from "./recursions/imu.js";
export * from "./recursions/ble.js";
export * from "./recursions/fusion.js";
export * from "./scheduler/scheduler.js";

export * from "./engine/scenario.js";
export * from "./engine/simulator.js";
export * from "./engine/fusion-scenario.js";
export * from "./engine/fusion-simulator.js";

export * from "./adapters/types.js";
export * from "./adapters/mock.js";
export * from "./adapters/connectors.js";
export * from "./adapters/registry.js";
