#!/usr/bin/env node
/**
 * RSD simulator CLI.
 *
 *   rsd list                         list available scenarios
 *   rsd run <scenario> [--json] [--tail N] [--seed S]
 *   rsd duty                         print the illustrative break-even duty cycle
 *
 * Runs fully offline and deterministically. See README for scope/units.
 */
import { breakEvenDutyCycle } from "./recursions/energy.js";
import { ILLUSTRATIVE, SCENARIOS, getScenario } from "./engine/scenario.js";
import { runSimulation } from "./engine/simulator.js";
import {
  FUSION_SCENARIOS,
  getFusionScenario,
} from "./engine/fusion-scenario.js";
import { runFusionSimulation } from "./engine/fusion-simulator.js";
import type { Watts, Joules } from "./domain/units.js";

function parseFlags(args: readonly string[]): {
  positional: string[];
  flags: Record<string, string | boolean>;
} {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = args[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(a);
    }
  }
  return { positional, flags };
}

function cmdList(): void {
  console.log("Available scenarios:");
  for (const name of Object.keys(SCENARIOS)) {
    const s = getScenario(name);
    console.log(`  ${name}\n    ${s.description}`);
  }
  console.log("\nFusion scenarios (BLE + IMU):");
  for (const name of Object.keys(FUSION_SCENARIOS)) {
    const s = getFusionScenario(name);
    console.log(`  ${name}\n    ${s.description}`);
  }
}

function cmdDuty(): void {
  const netDc = (ILLUSTRATIVE.indoorHarvestDcW * 0.9) as Watts; // after converter
  const d = breakEvenDutyCycle(netDc, 1e-6 as Watts, 1e-6 as Watts, ILLUSTRATIVE.bleActiveW);
  console.log("Illustrative break-even duty cycle (report §6.3b):");
  console.log(`  net DC harvest : ${(netDc * 1e6).toFixed(2)} µW`);
  console.log(`  BLE active     : ${(ILLUSTRATIVE.bleActiveW * 1e3).toFixed(1)} mW`);
  console.log(`  D_max          : ${(d * 100).toFixed(4)} %  (illustrative, not measured)`);
}

function cmdRunFusion(name: string, flags: Record<string, string | boolean>): void {
  const base = getFusionScenario(name);
  const scenario =
    typeof flags["seed"] === "string" ? { ...base, seed: Number(flags["seed"]) } : base;
  const result = runFusionSimulation(scenario);

  if (flags["json"]) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const s = result.summary;
  console.log(`Fusion scenario: ${result.scenario}  (seed ${result.seed})`);
  console.log(`Steps: ${s.steps}  dt: ${scenario.dt}s  beacons: ${scenario.beacons.length}`);
  console.log(`Position RMSE       : ${s.positionRmse.toFixed(3)} m`);
  console.log(`Final position error: ${s.finalPositionError.toFixed(3)} m`);
  console.log(`Max position error  : ${s.maxPositionError.toFixed(3)} m`);
  console.log(
    `BLE scans           : attempted=${s.bleScansAttempted} performed=${s.bleScansPerformed} skipped(energy)=${s.bleScansSkippedForEnergy}`,
  );
  console.log(
    `BLE measurements    : accepted=${s.bleAcceptedTotal} rejected=${s.bleRejectedTotal}  reasons={${Object.entries(
      s.bleRejectReasons,
    )
      .map(([k, v]) => `${k}:${v}`)
      .join(", ")}}`,
  );
  console.log(`IMU predictions     : ${s.imuPredictionCount}  ZUPTs: ${s.zuptCount}`);
  console.log(
    `Energy              : final=${(s.finalStoredJ * 1e3).toFixed(2)} mJ  brownoutSteps=${s.brownoutSteps}`,
  );
  console.log(
    `K (MAP)             : ${s.finalMapHypothesis} conf=${s.finalMapConfidence.toFixed(3)}  entropy=${s.finalEntropy.toFixed(3)} bits`,
  );

  if (flags["compare"]) {
    const imuOnly = runFusionSimulation(scenario, { applyBle: false });
    const impr =
      ((imuOnly.summary.positionRmse - s.positionRmse) / imuOnly.summary.positionRmse) * 100;
    console.log("\nComparative (same trajectory, same seed):");
    console.log(`  IMU-only RMSE     : ${imuOnly.summary.positionRmse.toFixed(3)} m`);
    console.log(`  Fused RMSE        : ${s.positionRmse.toFixed(3)} m`);
    console.log(`  Improvement       : ${impr.toFixed(1)} %`);
  }

  const tail = typeof flags["tail"] === "string" ? Number(flags["tail"]) : 5;
  if (tail > 0) {
    console.log(`\nLast ${tail} telemetry rows:`);
    console.log("step   t(s)  err(m)  unc(m)  scan  acc/rej  zupt  storedJ    MAP");
    for (const t of result.telemetry.slice(-tail)) {
      console.log(
        [
          String(t.step).padStart(4),
          t.timeS.toFixed(1).padStart(5),
          t.positionError.toFixed(2).padStart(6),
          t.positionUncertainty.toFixed(2).padStart(6),
          (t.bleScanPerformed ? "yes" : "no").padEnd(4),
          `${t.bleAccepted}/${t.bleRejected}`.padStart(7),
          (t.zuptApplied ? "yes" : "no").padEnd(4),
          (t.storedJ as Joules).toExponential(2).padStart(9),
          t.mapHypothesis,
        ].join("  "),
      );
    }
  }
}

function cmdRun(name: string, flags: Record<string, string | boolean>): void {
  if (name in FUSION_SCENARIOS) {
    cmdRunFusion(name, flags);
    return;
  }
  const scenario = getScenario(name);
  const seeded =
    typeof flags["seed"] === "string"
      ? { ...scenario, seed: Number(flags["seed"]) }
      : scenario;
  const result = runSimulation(seeded);

  if (flags["json"]) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const s = result.summary;
  console.log(`Scenario: ${result.scenario}  (seed ${result.seed})`);
  console.log(`Steps: ${s.steps}`);
  console.log(
    `Actions: ${Object.entries(s.actionCounts)
      .map(([k, v]) => `${k}=${v}`)
      .join("  ")}`,
  );
  console.log(`Final stored energy : ${(s.finalStoredJ * 1e3).toFixed(4)} mJ`);
  console.log(`Brownout steps      : ${s.brownoutSteps}`);
  console.log(`Final position error: ${s.finalPositionError.toFixed(3)} m`);
  console.log(`Final K entropy     : ${s.finalEntropy.toFixed(4)} bits`);
  console.log(`Total info gain     : ${s.totalInfoGainBits.toFixed(3)} bits`);

  const tail = typeof flags["tail"] === "string" ? Number(flags["tail"]) : 5;
  if (tail > 0) {
    console.log(`\nLast ${tail} telemetry rows:`);
    console.log("step  action       storedJ     posUnc(m)  MAP    conf   entropy");
    for (const t of result.telemetry.slice(-tail)) {
      console.log(
        [
          String(t.step).padStart(4),
          t.action.padEnd(12),
          (t.storedJ as Joules).toExponential(2).padStart(10),
          t.positionUncertainty.toFixed(3).padStart(9),
          t.mapHypothesis.padEnd(6),
          t.mapConfidence.toFixed(2),
          t.knowledgeEntropy.toFixed(3),
        ].join("  "),
      );
    }
  }
}

function main(): void {
  const argv = process.argv.slice(2);
  const { positional, flags } = parseFlags(argv);
  const cmd = positional[0] ?? "help";

  switch (cmd) {
    case "list":
      cmdList();
      break;
    case "duty":
      cmdDuty();
      break;
    case "run": {
      const name = positional[1];
      if (!name) {
        console.error("usage: rsd run <scenario> [--json] [--tail N] [--seed S]");
        process.exitCode = 1;
        return;
      }
      cmdRun(name, flags);
      break;
    }
    default:
      console.log("RSD simulator CLI");
      console.log("  rsd list");
      console.log("  rsd run <scenario> [--json] [--tail N] [--seed S]");
      console.log("  rsd run ble-imu-fusion [--compare] [--json] [--tail N] [--seed S]");
      console.log("  rsd duty");
      break;
  }
}

main();
