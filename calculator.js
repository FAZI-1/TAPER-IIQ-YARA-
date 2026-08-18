export const FREQUENCIES = [
  { value: "OD", label: "Once daily", dosesPerDay: 1 },
  { value: "BID", label: "Twice daily", dosesPerDay: 2 },
  { value: "TID", label: "Three times daily", dosesPerDay: 3 },
  { value: "QID", label: "Four times daily", dosesPerDay: 4 },
  { value: "Q2H", label: "Every 2 hours", dosesPerDay: 12 },
  { value: "Q4H", label: "Every 4 hours", dosesPerDay: 6 },
  { value: "Q6H", label: "Every 6 hours", dosesPerDay: 4 },
  { value: "Q8H", label: "Every 8 hours", dosesPerDay: 3 },
  { value: "Q12H", label: "Every 12 hours", dosesPerDay: 2 },
  { value: "CUSTOM", label: "Custom doses/day", dosesPerDay: null },
];

export const DURATION_UNITS = [
  { value: "days", label: "Days", multiplier: 1 },
  { value: "weeks", label: "Weeks", multiplier: 7 },
  { value: "months", label: "Months (30 days)", multiplier: 30 },
];

export function getFrequency(value) {
  return FREQUENCIES.find((item) => item.value === value) ?? FREQUENCIES[0];
}

export function toDays(value, unit) {
  const n = Number(value);
  const found = DURATION_UNITS.find((item) => item.value === unit);
  return n * (found?.multiplier ?? 1);
}

export function formatNumber(value) {
  if (!Number.isFinite(value)) return "0";
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/\.?0+$/, "");
}

function resolveDose(step, options = {}) {
  const entryMode = options.entryMode ?? "tablets";
  const strengthMg = Number(options.strengthMg);
  const doseMg = Number(step.doseMg);
  const enteredTablets = Number(step.tablets);

  if (entryMode === "dose") {
    const tablets = Number.isFinite(strengthMg) && strengthMg > 0 ? doseMg / strengthMg : NaN;
    return { tablets, doseMg };
  }

  const calculatedDoseMg =
    Number.isFinite(strengthMg) && strengthMg > 0 && Number.isFinite(enteredTablets)
      ? enteredTablets * strengthMg
      : NaN;
  return { tablets: enteredTablets, doseMg: calculatedDoseMg };
}

export function calculateStep(step, options = {}) {
  const { tablets, doseMg } = resolveDose(step, options);
  const days = toDays(step.duration, step.durationUnit);
  const frequency = getFrequency(step.frequency);
  const dosesPerDay =
    step.frequency === "CUSTOM"
      ? Number(step.customDosesPerDay)
      : Number(frequency.dosesPerDay);

  const quantity = tablets * dosesPerDay * days;

  return {
    ...step,
    days,
    dosesPerDay,
    quantity,
    tablets,
    doseMg,
  };
}

export function validateStep(step, options = {}) {
  const errors = {};
  const entryMode = options.entryMode ?? "tablets";
  const strengthMg = Number(options.strengthMg);
  const duration = Number(step.duration);

  if (entryMode === "dose") {
    const doseMg = Number(step.doseMg);
    if (!Number.isFinite(doseMg) || doseMg <= 0) {
      errors.doseMg = "Enter a dose greater than 0 mg.";
    }
    if (!Number.isFinite(strengthMg) || strengthMg <= 0) {
      errors.doseMg = "Enter tablet/capsule strength above before using dose mode.";
    }
  } else {
    const tablets = Number(step.tablets);
    if (!Number.isFinite(tablets) || tablets <= 0) {
      errors.tablets = "Enter a tablet/capsule amount greater than 0.";
    }
  }

  if (!Number.isFinite(duration) || duration <= 0) {
    errors.duration = "Enter a duration greater than 0.";
  }

  if (step.frequency === "CUSTOM") {
    const custom = Number(step.customDosesPerDay);
    if (!Number.isFinite(custom) || custom <= 0) {
      errors.customDosesPerDay = "Enter doses/day greater than 0.";
    }
  }
  return errors;
}

export function validateAll(steps, options = {}) {
  return steps.map((step) => validateStep(step, options));
}

export function calculatePlan(steps, options = {}) {
  const calculated = steps.map((step) => calculateStep(step, options));
  const totalQuantity = calculated.reduce((sum, step) => sum + step.quantity, 0);
  const totalDays = calculated.reduce((sum, step) => sum + step.days, 0);

  return {
    steps: calculated,
    totalQuantity,
    totalDays,
  };
}

export function getWarnings(steps, options = {}) {
  const warnings = [];
  const calculated = steps.map((step) => calculateStep(step, options));

  for (let i = 1; i < calculated.length; i += 1) {
    const previous = calculated[i - 1];
    const current = calculated[i];

    if (current.tablets > previous.tablets) {
      warnings.push({
        type: "warning",
        message: `Step ${i + 1} increases the tablet/capsule count per dose from ${formatNumber(previous.tablets)} to ${formatNumber(current.tablets)}.`,
      });
    }

    if (current.dosesPerDay > previous.dosesPerDay) {
      warnings.push({
        type: "warning",
        message: `Step ${i + 1} increases frequency from ${formatNumber(previous.dosesPerDay)} to ${formatNumber(current.dosesPerDay)} doses/day.`,
      });
    }
  }

  const duplicateLike = calculated.some((step, i) =>
    i > 0 &&
    step.tablets === calculated[i - 1].tablets &&
    step.dosesPerDay === calculated[i - 1].dosesPerDay
  );

  if (duplicateLike) {
    warnings.push({
      type: "info",
      message: "At least two consecutive steps have the same dose and frequency. Check whether that is intentional.",
    });
  }

  return warnings;
}

export function buildCompactLine(step, index) {
  const tabletText = `${formatNumber(step.tablets)} ${Number(step.tablets) === 1 ? "tablet/capsule" : "tablets/capsules"}`;
  const doseText = Number.isFinite(step.doseMg) ? ` (${formatNumber(step.doseMg)} mg)` : "";
  const frequencyText = `${formatNumber(step.dosesPerDay)}/day`;
  const durationText = `${formatNumber(step.days)} ${step.days === 1 ? "day" : "days"}`;
  return `Step ${index + 1}: ${tabletText}${doseText} × ${frequencyText} × ${durationText} = ${formatNumber(step.quantity)} ${step.quantity === 1 ? "unit" : "units"}`;
}

export function buildSummary({ medicationName, strengthMg, entryMode, plan }) {
  const titleParts = [
    medicationName?.trim(),
    Number(strengthMg) > 0 ? `${formatNumber(Number(strengthMg))} mg per tablet/capsule` : "",
  ].filter(Boolean);
  const title = titleParts.length ? titleParts.join(" — ") : "Taper Summary";

  const lines = [
    title.toUpperCase(),
    `Input method: ${entryMode === "dose" ? "Prescribed dose (mg)" : "Number of tablets/capsules"}`,
    "",
    ...plan.steps.map(buildCompactLine),
    "",
    `Total quantity: ${formatNumber(plan.totalQuantity)} tablets/capsules`,
    `Total duration: ${formatNumber(plan.totalDays)} days`,
  ];

  return lines.join("\n");
}
