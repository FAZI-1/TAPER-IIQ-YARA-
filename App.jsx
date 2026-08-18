import { useMemo, useState } from "react";
import "./styles.css";

const DOSE_PRESETS = [35, 30, 25, 20, 15, 10, 5];
const STRENGTH_PRESETS = [10, 5, 2, 0.5];
const DURATION_PRESETS = [1, 2, 3, 4, 6, 8];

const uid = () =>
  globalThis.crypto?.randomUUID?.() ??
  `step-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const blankStep = (dose = "", strength = "", weeks = "1") => ({
  id: uid(),
  dose,
  strength,
  weeks,
});

const exampleSteps = () =>
  [35, 30, 25, 20, 15, 10, 5].map((dose) => blankStep(String(dose), "5", "1"));

const n = (value) => Number(value);
const fmt = (value) => {
  if (!Number.isFinite(value)) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
};

function calculateStep(step) {
  const dose = n(step.dose);
  const strength = n(step.strength);
  const weeks = n(step.weeks);

  const valid =
    Number.isFinite(dose) &&
    dose > 0 &&
    Number.isFinite(strength) &&
    strength > 0 &&
    Number.isFinite(weeks) &&
    weeks > 0;

  if (!valid) {
    return {
      valid: false,
      dose,
      strength,
      weeks,
      days: NaN,
      tabletsPerDay: NaN,
      quantity: NaN,
    };
  }

  const days = weeks * 7;
  const tabletsPerDay = dose / strength;
  const quantity = tabletsPerDay * days;

  return { valid: true, dose, strength, weeks, days, tabletsPerDay, quantity };
}

function App() {
  const [medicationName, setMedicationName] = useState("");
  const [steps, setSteps] = useState([blankStep()]);
  const [copied, setCopied] = useState(false);

  const calculated = useMemo(() => steps.map(calculateStep), [steps]);
  const allValid = calculated.every((step) => step.valid);
  const totalQuantity = calculated.reduce(
    (sum, step) => sum + (Number.isFinite(step.quantity) ? step.quantity : 0),
    0
  );
  const totalWeeks = calculated.reduce(
    (sum, step) => sum + (Number.isFinite(step.weeks) ? step.weeks : 0),
    0
  );
  const totalDays = totalWeeks * 7;

  const fractionalWarnings = calculated
    .map((step, index) => ({ ...step, index }))
    .filter((step) => step.valid && !Number.isInteger(step.tabletsPerDay));

  function updateStep(id, field, value) {
    setSteps((current) =>
      current.map((step) => (step.id === id ? { ...step, [field]: value } : step))
    );
  }

  function addStep() {
    setSteps((current) => [...current, blankStep()]);
  }

  function duplicateStep(index) {
    const source = steps[index];
    const copy = { ...source, id: uid() };
    setSteps((current) => [
      ...current.slice(0, index + 1),
      copy,
      ...current.slice(index + 1),
    ]);
  }

  function removeStep(id) {
    setSteps((current) =>
      current.length === 1 ? current : current.filter((step) => step.id !== id)
    );
  }

  function loadExample() {
    setMedicationName("Example medication");
    setSteps(exampleSteps());
  }

  function reset() {
    setMedicationName("");
    setSteps([blankStep()]);
  }

  async function copySummary() {
    if (!allValid) return;

    const lines = [
      "TAPER CHECK — QUANTITY VERIFICATION",
      medicationName.trim() ? `Medication: ${medicationName.trim()}` : "",
      "",
      ...calculated.map(
        (step, i) =>
          `Step ${i + 1}: ${fmt(step.dose)} mg/day ÷ ${fmt(step.strength)} mg per tablet/capsule = ${fmt(step.tabletsPerDay)} tablets/capsules per day × ${fmt(step.days)} days = ${fmt(step.quantity)} tablets/capsules`
      ),
      "",
      `Total duration: ${fmt(totalWeeks)} weeks (${fmt(totalDays)} days)`,
      `Total quantity: ${fmt(totalQuantity)} tablets/capsules`,
      "",
      "Verification tool only. Final quantity must be checked against the authorized prescription and applicable clinical instructions.",
    ].filter(Boolean);

    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">TC</div>
          <div>
            <h1>Taper Check</h1>
            <p>Weekly taper quantity calculator & verification tool</p>
          </div>
        </div>

        <div className="topbar-actions">
          <div className="leader-badge">
            <span>Project Leader</span>
            <strong>YARA ALOMARI</strong>
          </div>
          <button className="button ghost" type="button" onClick={reset}>
            Reset
          </button>
        </div>
      </header>

      <section className="hero">
        <div>
          <span className="eyebrow">WEEK-BY-WEEK VERIFICATION</span>
          <h2>Choose the dose, tablet strength, and duration for every taper step.</h2>
          <p>
            Each row represents one taper period. Enter or select the prescribed daily
            dose, the strength of the tablet/capsule being used, and the number of weeks.
            Taper Check calculates the daily unit count, quantity for that period, total
            duration, and total quantity.
          </p>
        </div>
        <button className="button secondary" type="button" onClick={loadExample}>
          Load 35 → 5 mg example
        </button>
      </section>

      <section className="panel medication-panel">
        <div className="section-heading">
          <div>
            <span className="step-label">01</span>
            <div>
              <h3>Medication</h3>
              <p className="muted">Optional label for the verification summary.</p>
            </div>
          </div>
        </div>

        <label className="field medication-name-field">
          <span>Medication name</span>
          <input
            value={medicationName}
            onChange={(event) => setMedicationName(event.target.value)}
            placeholder="e.g. Example medication"
            autoComplete="off"
          />
        </label>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="step-label">02</span>
            <div>
              <h3>Weekly taper steps</h3>
              <p className="muted">
                Use the suggestions or type any valid value manually.
              </p>
            </div>
          </div>
          <span className="count">{steps.length} {steps.length === 1 ? "step" : "steps"}</span>
        </div>

        <datalist id="dose-options">
          {DOSE_PRESETS.map((value) => <option value={value} key={value} />)}
        </datalist>
        <datalist id="strength-options">
          {STRENGTH_PRESETS.map((value) => <option value={value} key={value} />)}
        </datalist>
        <datalist id="duration-options">
          {DURATION_PRESETS.map((value) => <option value={value} key={value} />)}
        </datalist>

        <div className="steps-list">
          {steps.map((step, index) => {
            const c = calculated[index];

            return (
              <article className="step-card weekly-card" key={step.id}>
                <div className="step-card-head">
                  <div className="step-number">{String(index + 1).padStart(2, "0")}</div>
                  <div>
                    <strong>Taper period {index + 1}</strong>
                    <span className="step-preview">
                      {c.valid
                        ? `${fmt(c.dose)} mg/day • ${fmt(c.strength)} mg strength • ${fmt(c.weeks)} week${c.weeks === 1 ? "" : "s"}`
                        : "Choose dose, strength, and duration"}
                    </span>
                  </div>
                  <div className="step-actions">
                    <button
                      className="icon-button"
                      type="button"
                      title="Duplicate step"
                      onClick={() => duplicateStep(index)}
                    >
                      ⧉
                    </button>
                    <button
                      className="icon-button danger"
                      type="button"
                      title="Remove step"
                      disabled={steps.length === 1}
                      onClick={() => removeStep(step.id)}
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div className="grid three weekly-grid">
                  <label className={`field ${step.dose && !(n(step.dose) > 0) ? "has-error" : ""}`}>
                    <span>Prescribed daily dose (mg)</span>
                    <input
                      type="number"
                      list="dose-options"
                      min="0.01"
                      step="0.01"
                      inputMode="decimal"
                      value={step.dose}
                      onChange={(event) => updateStep(step.id, "dose", event.target.value)}
                      placeholder="Select or type, e.g. 35"
                    />
                    <small>Suggestions: 35, 30, 25, 20, 15, 10, 5 mg</small>
                  </label>

                  <label className={`field ${step.strength && !(n(step.strength) > 0) ? "has-error" : ""}`}>
                    <span>Tablet / capsule strength (mg)</span>
                    <input
                      type="number"
                      list="strength-options"
                      min="0.01"
                      step="0.01"
                      inputMode="decimal"
                      value={step.strength}
                      onChange={(event) => updateStep(step.id, "strength", event.target.value)}
                      placeholder="Select or type, e.g. 5"
                    />
                    <small>Suggestions: 10, 5, 2, 0.5 mg</small>
                  </label>

                  <label className={`field ${step.weeks && !(n(step.weeks) > 0) ? "has-error" : ""}`}>
                    <span>Duration (weeks)</span>
                    <input
                      type="number"
                      list="duration-options"
                      min="0.01"
                      step="0.01"
                      inputMode="decimal"
                      value={step.weeks}
                      onChange={(event) => updateStep(step.id, "weeks", event.target.value)}
                      placeholder="Select or type, e.g. 1"
                    />
                    <small>Suggestions: 1, 2, 3, 4, 6, 8 weeks</small>
                  </label>
                </div>

                <div className="weekly-results">
                  <div>
                    <span>Tablets / capsules per day</span>
                    <strong>{c.valid ? fmt(c.tabletsPerDay) : "—"}</strong>
                  </div>
                  <div>
                    <span>Days in this period</span>
                    <strong>{c.valid ? fmt(c.days) : "—"}</strong>
                  </div>
                  <div>
                    <span>Quantity for this period</span>
                    <strong>{c.valid ? fmt(c.quantity) : "—"}</strong>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <button className="add-step" type="button" onClick={addStep}>
          + Add next taper period
        </button>
      </section>

      {fractionalWarnings.length > 0 && (
        <section className="alerts">
          {fractionalWarnings.map((item) => (
            <div className="alert warning" key={item.index}>
              <span>!</span>
              <p>
                Period {item.index + 1} calculates to {fmt(item.tabletsPerDay)} tablets/capsules per day.
                Verify that the selected strength and dosage form match the authorized prescription.
              </p>
            </div>
          ))}
        </section>
      )}

      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="step-label">03</span>
            <div>
              <h3>Verification summary</h3>
              <p className="muted">A quick period-by-period quantity check.</p>
            </div>
          </div>
        </div>

        <div className="summary-table">
          <div className="summary-head">
            <span>Period</span>
            <span>Dose</span>
            <span>Strength</span>
            <span>Weeks</span>
            <span>Units/day</span>
            <span>Quantity</span>
          </div>

          {calculated.map((c, index) => (
            <div className="summary-row" key={steps[index].id}>
              <span>#{index + 1}</span>
              <span>{c.valid ? `${fmt(c.dose)} mg` : "—"}</span>
              <span>{c.valid ? `${fmt(c.strength)} mg` : "—"}</span>
              <span>{c.valid ? fmt(c.weeks) : "—"}</span>
              <span>{c.valid ? fmt(c.tabletsPerDay) : "—"}</span>
              <strong>{c.valid ? fmt(c.quantity) : "—"}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="results">
        <div className="result-card primary">
          <span>Total quantity required</span>
          <strong>{allValid ? fmt(totalQuantity) : "—"}</strong>
          <small>tablets / capsules</small>
        </div>
        <div className="result-card">
          <span>Total duration</span>
          <strong>{allValid ? fmt(totalWeeks) : "—"}</strong>
          <small>weeks</small>
        </div>
        <div className="result-card">
          <span>Total days</span>
          <strong>{allValid ? fmt(totalDays) : "—"}</strong>
          <small>days</small>
        </div>
      </section>

      <section className="actions-panel">
        <div>
          <strong className="verification-label">Verification output</strong>
          <p className="muted action-note">
            Complete all fields to enable the copyable summary.
          </p>
        </div>
        <button
          className="button primary-button"
          type="button"
          disabled={!allValid}
          onClick={copySummary}
        >
          {copied ? "Copied ✓" : "Copy summary"}
        </button>
      </section>

      <section className="disclaimer">
        <div className="disclaimer-icon">!</div>
        <div>
          <strong>Disclaimer</strong>
          <p>
            This tool is intended only as a verification tool and for calculation of the total quantity.
            It does not provide medical advice, diagnosis, treatment recommendations, or determine whether
            a taper is clinically appropriate. Always verify the final schedule and quantity against the
            authorized prescription and applicable clinical instructions.
          </p>
        </div>
      </section>

      <footer>
        <span className="footer-leader">
          Project Leader: <strong>YARA ALOMARI</strong>
        </span>
        <span>Taper Check • Weekly quantity verification</span>
      </footer>
    </main>
  );
}

export default App;
