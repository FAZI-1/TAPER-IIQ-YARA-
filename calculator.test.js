import { describe, expect, it } from "vitest";
import { calculatePlan, calculateStep, getWarnings, toDays } from "./calculator.js";

describe("taper calculations", () => {
  it("converts weeks and months consistently", () => {
    expect(toDays(2, "weeks")).toBe(14);
    expect(toDays(1, "months")).toBe(30);
  });

  it("converts a 25 mg prescribed dose with 5 mg strength to 5 tablets", () => {
    const result = calculateStep(
      { doseMg: "25", tablets: "", frequency: "OD", customDosesPerDay: "", duration: "7", durationUnit: "days" },
      { entryMode: "dose", strengthMg: 5 }
    );
    expect(result.tablets).toBe(5);
    expect(result.quantity).toBe(35);
  });

  it("calculates a plan entered by tablet count", () => {
    const plan = calculatePlan(
      [{ tablets: "4", doseMg: "", frequency: "BID", customDosesPerDay: "", duration: "7", durationUnit: "days" }],
      { entryMode: "tablets", strengthMg: 5 }
    );
    expect(plan.totalQuantity).toBe(56);
    expect(plan.steps[0].doseMg).toBe(20);
  });

  it("flags an increase in tablet count", () => {
    const warnings = getWarnings(
      [
        { tablets: "4", frequency: "OD", customDosesPerDay: "", duration: "1", durationUnit: "weeks" },
        { tablets: "5", frequency: "OD", customDosesPerDay: "", duration: "1", durationUnit: "weeks" },
      ],
      { entryMode: "tablets", strengthMg: 5 }
    );
    expect(warnings.some((item) => item.message.includes("increases"))).toBe(true);
  });
});
