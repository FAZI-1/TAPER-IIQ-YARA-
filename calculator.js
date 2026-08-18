export function calculateWeeklyStep({ dose, strength, weeks }) {
  const d = Number(dose);
  const s = Number(strength);
  const w = Number(weeks);

  if (!(d > 0) || !(s > 0) || !(w > 0)) {
    return { valid: false, tabletsPerDay: NaN, days: NaN, quantity: NaN };
  }

  const tabletsPerDay = d / s;
  const days = w * 7;
  const quantity = tabletsPerDay * days;

  return { valid: true, tabletsPerDay, days, quantity };
}

export function calculateWeeklyPlan(steps) {
  const calculated = steps.map(calculateWeeklyStep);
  const totalQuantity = calculated.reduce(
    (sum, step) => sum + (Number.isFinite(step.quantity) ? step.quantity : 0),
    0
  );
  const totalWeeks = steps.reduce(
    (sum, step) => sum + (Number.isFinite(Number(step.weeks)) ? Number(step.weeks) : 0),
    0
  );

  return { calculated, totalQuantity, totalWeeks, totalDays: totalWeeks * 7 };
}
