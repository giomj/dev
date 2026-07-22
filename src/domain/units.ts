/**
 * Unit conventions for the RSD simulator.
 *
 * All internal computation uses SI base units to keep the energy balance
 * unambiguous (the report repeatedly warns against mixing µW / mW / mA·V):
 *   - time:     seconds (s)
 *   - power:    watts (W)
 *   - energy:   joules (J)
 *   - length:   metres (m)
 *   - velocity: metres/second (m/s)
 *   - voltage:  volts (V)
 *   - current:  amperes (A)
 *
 * The `Unit` brand is a compile-time-only tag. It carries no runtime cost but
 * makes it hard to accidentally pass, e.g., microwatts where watts are expected.
 */

declare const unitBrand: unique symbol;

export type Quantity<U extends string> = number & { readonly [unitBrand]?: U };

export type Seconds = Quantity<"s">;
export type Watts = Quantity<"W">;
export type Joules = Quantity<"J">;
export type Metres = Quantity<"m">;
export type MetresPerSecond = Quantity<"m/s">;
export type MetresPerSecond2 = Quantity<"m/s^2">;
export type Radians = Quantity<"rad">;
export type RadiansPerSecond = Quantity<"rad/s">;
export type Hertz = Quantity<"Hz">;
/** Received signal strength in dBm (BLE RSSI). */
export type Dbm = Quantity<"dBm">;
export type Volts = Quantity<"V">;
export type Amperes = Quantity<"A">;

/** Dimensionless ratio in [0, 1] (efficiencies, duty cycles, probabilities). */
export type Ratio = Quantity<"ratio">;

export const MICRO = 1e-6;
export const MILLI = 1e-3;

/** microwatts -> watts */
export const uW = (x: number): Watts => x * MICRO;
/** milliwatts -> watts */
export const mW = (x: number): Watts => x * MILLI;
/** milliamperes -> amperes */
export const mA = (x: number): Amperes => x * MILLI;
/** microjoules -> joules */
export const uJ = (x: number): Joules => x * MICRO;
/** millijoules -> joules */
export const mJ = (x: number): Joules => x * MILLI;

/** P = V * I, both SI. */
export const power = (v: Volts, i: Amperes): Watts => v * i;

export const clamp = (x: number, lo: number, hi: number): number =>
  x < lo ? lo : x > hi ? hi : x;

export const isFiniteNumber = (x: unknown): x is number =>
  typeof x === "number" && Number.isFinite(x);

/** hertz -> sample period (s). */
export const periodFromHz = (hz: Hertz): Seconds => {
  if (!isFiniteNumber(hz) || hz <= 0) throw new RangeError("frequency must be finite and > 0");
  return (1 / hz) as Seconds;
};

/** Wrap an angle to (-pi, pi]; keeps yaw and innovations numerically stable. */
export const wrapAngle = (a: number): Radians => {
  const twoPi = 2 * Math.PI;
  let x = a % twoPi;
  if (x <= -Math.PI) x += twoPi;
  else if (x > Math.PI) x -= twoPi;
  return x as Radians;
};
