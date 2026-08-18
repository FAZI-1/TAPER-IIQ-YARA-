import { describe, expect, it } from "vitest";
import { calculateWeeklyPlan, calculateWeeklyStep } from "./calculator.js";

describe("weekly taper calculator", () => {
  it("calculates 35 mg daily using 5 mg tablets for one week", () => {
    const result = calculateWeeklyStep({ dose: 35, strength: 5, weeks: 1 });
    expect(result.tabletsPerDay).toBe(7);
    expect(result.days).toBe(7);
    expect(result.quantity).toBe(49);
  });

  it("supports 0.5 mg tablet strength", () => {
    const result = calculateWeeklyStep({ dose: 5, strength: 0.5, weeks: 2 });
    expect(result.tabletsPerDay).toBe(10);
    expect(result.quantity).toBe(140);
  });

  it("totals a 35-to-5 mg weekly example", () => {
    const plan = calculateWeeklyPlan(
      [35, 30, 25, 20, 15, 10, 5].map((dose) => ({
        dose,
        strength: 5,
        weeks: 1,
      }))
    );
    expect(plan.totalWeeks).toBe(7);
    expect(plan.totalDays).toBe(49);
    expect(plan.totalQuantity).toBe(196);
  });
});
