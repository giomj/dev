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
}

function cmdDuty(): void {
  const netDc = (ILLUSTRATIVE.indoorHarvestDcW * 0.9) as Watts; // after converter
  const d = breakEvenDutyCycle(netDc, 1e-6 as Watts, 1e-6 as Watts, ILLUSTRATIVE.bleActiveW);
  console.log("Illustrative break-even duty cycle (report §6.3b):");
  console.log(`  net DC harvest : ${(netDc * 1e6).toFixed(2)} µW`);
  console.log(`  BLE active     : ${(ILLUSTRATIVE.bleActiveW * 1e3).toFixed(1)} mW`);
  console.log(`  D_max          : ${(d * 100).toFixed(4)} %  (illustrative, not measured)`);
}

function cmdRun(name: string, flags: Record<string, string | boolean>): void {
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
      console.log("  rsd duty");
      break;
  }
}

main();
