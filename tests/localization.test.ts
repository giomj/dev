import { describe, expect, it } from "vitest";
import {
  createLocalizationState,
  predictLocalization,
  updateLocalization,
  validateLocalizationConfig,
  type LocalizationConfig,
  type Vec4,
} from "../src/recursions/localization.js";
import type { Metres, Seconds } from "../src/domain/units.js";

const cfg: LocalizationConfig = {
  processNoise: 0.05,
  measurementStd: 1.5 as Metres,
  initialPosStd: 3 as Metres,
  initialVelStd: 0.5,
};

describe("localization validation", () => {
  it("rejects non-positive config", () => {
    expect(() => validateLocalizationConfig({ ...cfg, measurementStd: 0 as Metres })).toThrow();
  });
  it("rejects non-finite initial mean", () => {
    expect(() =>
      createLocalizationState(cfg, [0, 0, Number.NaN, 0] as Vec4),
    ).toThrow();
  });
});

describe("Kalman predict/update", () => {
  it("prediction grows position uncertainty; update reduces it", () => {
    let s = createLocalizationState(cfg, [0, 0, 1, 0]);
    const startUnc = s.positionUncertainty;
    s = predictLocalization(cfg, s, 1 as Seconds);
    expect(s.positionUncertainty).toBeGreaterThan(startUnc);
    const afterPredict = s.positionUncertainty;
    s = updateLocalization(cfg, s, [1, 0]);
    expect(s.positionUncertainty).toBeLessThan(afterPredict);
  });

  it("exposes innovation and NIS after update", () => {
    let s = createLocalizationState(cfg, [0, 0, 0, 0]);
    s = predictLocalization(cfg, s, 1 as Seconds);
    s = updateLocalization(cfg, s, [5, -3]);
    expect(s.innovation).not.toBeNull();
    expect(s.nis).not.toBeNull();
    expect(s.nis!).toBeGreaterThan(0);
  });

  it("converges the estimate toward repeated consistent measurements", () => {
    let s = createLocalizationState(cfg, [10, 10, 0, 0]);
    for (let i = 0; i < 30; i++) {
      s = predictLocalization(cfg, s, 1 as Seconds);
      s = updateLocalization(cfg, s, [0, 0]);
    }
    expect(Math.hypot(s.mean[0], s.mean[1])).toBeLessThan(1);
  });
});
