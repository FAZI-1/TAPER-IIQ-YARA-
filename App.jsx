import { useEffect, useMemo, useState } from "react";
import {
  FREQUENCIES,
  DURATION_UNITS,
  buildCompactLine,
  buildSummary,
  calculatePlan,
  formatNumber,
  getWarnings,
  validateAll,
} from "./calculator.js";

const STORAGE_KEY = "taper-checker-draft-v2";

const newId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `step-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createStep = () => ({
  id: newId(),
  tablets: "",
  doseMg: "",
  frequency: "OD",
  customDosesPerDay: "",
  duration: "",
  durationUnit: "weeks",
});

const exampleSteps = () => [
  { ...createStep(), doseMg: "25", tablets: "5", duration: "1", durationUnit: "weeks" },
  { ...createStep(), doseMg: "20", tablets: "4", duration: "1", durationUnit: "weeks" },
  { ...createStep(), doseMg: "15", tablets: "3", duration: "1", durationUnit: "weeks" },
  { ...createStep(), doseMg: "10", tablets: "2", duration: "1", durationUnit: "weeks" },
  { ...createStep(), doseMg: "5", tablets: "1", duration: "1", durationUnit: "months" },
];

function App() {
  const [medicationName, setMedicationName] = useState("");
  const [strengthMg, setStrengthMg] = useState("");
  const [entryMode, setEntryMode] = useState("dose");
  const [steps, setSteps] = useState([createStep()]);
  const [roundUp, setRoundUp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.steps) && parsed.steps.length) {
        setMedicationName(parsed.medicationName ?? "");
        setStrengthMg(parsed.strengthMg ?? "");
        setEntryMode(parsed.entryMode === "tablets" ? "tablets" : "dose");
        setSteps(parsed.steps);
        setRoundUp(Boolean(parsed.roundUp));
      }
    } catch {
      // Keep safe defaults when stored data is unavailable or malformed.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ medicationName, strengthMg, entryMode, steps, roundUp })
    );
  }, [medicationName, strengthMg, entryMode, steps, roundUp]);

  const options = useMemo(
    () => ({ entryMode, strengthMg: Number(strengthMg) }),
    [entryMode, strengthMg]
  );

  const errors = useMemo(() => validateAll(steps, options), [steps, options]);
  const hasErrors = errors.some((item) => Object.keys(item).length > 0);
  const plan = useMemo(() => calculatePlan(steps, options), [steps, options]);
  const warnings = useMemo(() => getWarnings(steps, options), [steps, options]);
  const displayedTotal = roundUp ? Math.ceil(plan.totalQuantity) : plan.totalQuantity;
  const strengthInvalid = entryMode === "dose" && (!Number.isFinite(Number(strengthMg)) || Number(strengthMg) <= 0);

  function updateStep(id, field, value) {
    setSteps((current) =>
      current.map((step) => (step.id === id ? { ...step, [field]: value } : step))
    );
  }

  function addStep() {
    setSteps((current) => [...current, createStep()]);
  }

  function removeStep(id) {
    setSteps((current) => {
      if (current.length === 1) return current;
      return current.filter((step) => step.id !== id);
    });
  }

  function moveStep(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[index], next[target]] = [next[target], next[index]];
    setSteps(next);
  }

  async function copySummary() {
    if (hasErrors || strengthInvalid) return;
    const text = buildSummary({
      medicationName,
      strengthMg: Number(strengthMg),
      entryMode,
      plan: { ...plan, totalQuantity: displayedTotal },
    });
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function resetPlan() {
    if (!window.confirm("Reset this taper plan?")) return;
    setMedicationName("");
    setStrengthMg("");
    setEntryMode("dose");
    setSteps([createStep()]);
    setRoundUp(false);
    localStorage.removeItem(STORAGE_KEY);
  }

  function loadExample() {
    setMedicationName("Example Medication");
    setStrengthMg("5");
    setEntryMode("dose");
    setSteps(exampleSteps());
    setRoundUp(false);
    setShowExamples(false);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">TC</div>
          <div>
            <h1>Taper Check</h1>
            <p>Quantity calculator & verification tool</p>
          </div>
        </div>
        <div className="topbar-actions">
          <div className="leader-badge">
            <span>Project Leader</span>
            <strong>YARA ALOMARI</strong>
          </div>
          <button className="button ghost" onClick={resetPlan}>Reset</button>
        </div>
      </header>

      <section className="hero">
        <div>
          <span className="eyebrow">CALCULATE • REVIEW • VERIFY</span>
          <h2>Verify a taper schedule and calculate the total quantity clearly.</h2>
          <p>
            Enter the tablet/capsule strength, choose whether you want to enter each
            step by prescribed dose or by number of tablets/capsules, then review the
            normalized calculation before using the result.
          </p>
        </div>
        <button className="button secondary" onClick={() => setShowExamples((v) => !v)}>
          {showExamples ? "Hide example" : "Show 25 mg example"}
        </button>
      </section>

      {showExamples && (
        <div className="example-banner">
          <div>
            <strong>Example:</strong>
            <span> A prescribed dose of 25 mg with a 5 mg tablet strength equals 5 tablets per dose.</span>
          </div>
          <button className="button small" onClick={loadExample}>Load example</button>
        </div>
      )}

      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="step-label">01</span>
            <div>
              <h3>Medication details</h3>
              <p className="muted">Strength is required when entering the schedule by prescribed dose.</p>
            </div>
          </div>
        </div>

        <div className="grid two">
          <label className="field">
            <span>Medication name</span>
            <input
              value={medicationName}
              onChange={(e) => setMedicationName(e.target.value)}
              placeholder="e.g. Example Medication"
              autoComplete="off"
            />
          </label>
          <label className={`field ${strengthInvalid ? "has-error" : ""}`}>
            <span>Tablet / capsule strength (mg)</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              value={strengthMg}
              onChange={(e) => setStrengthMg(e.target.value)}
              placeholder="e.g. 5"
            />
            {strengthInvalid && <small>Enter a strength greater than 0 mg.</small>}
          </label>
        </div>

        <div className="entry-mode-block">
          <span className="entry-mode-title">Choose how you want to enter each taper step</span>
          <div className="mode-grid">
            <button
              type="button"
              className={`mode-card ${entryMode === "dose" ? "active" : ""}`}
              onClick={() => setEntryMode("dose")}
            >
              <span className="mode-dot" />
              <span>
                <strong>By prescribed dose (mg)</strong>
                <small>Example: 25 mg with 5 mg tablets = 5 tablets per dose.</small>
              </span>
            </button>
            <button
              type="button"
              className={`mode-card ${entryMode === "tablets" ? "active" : ""}`}
              onClick={() => setEntryMode("tablets")}
            >
              <span className="mode-dot" />
              <span>
                <strong>By number of tablets / capsules</strong>
                <small>Enter the unit count directly for every dose.</small>
              </span>
            </button>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="step-label">02</span>
            <div>
              <h3>Taper schedule</h3>
              <p className="muted">
                {entryMode === "dose"
                  ? "Enter the prescribed mg dose for each stage; the tablet/capsule count is calculated automatically."
                  : "Enter the number of tablets/capsules taken at each dose."}
              </p>
            </div>
          </div>
          <span className="count">{steps.length} {steps.length === 1 ? "step" : "steps"}</span>
        </div>

        <div className="steps-list">
          {steps.map((step, index) => {
            const stepErrors = errors[index];
            const calculated = plan.steps[index];
            const preview = entryMode === "dose"
              ? (step.doseMg ? `${step.doseMg} mg` : "Dose not entered")
              : (step.tablets ? `${step.tablets} tablets/capsules` : "Count not entered");

            return (
              <article className="step-card" key={step.id}>
                <div className="step-card-head">
                  <div className="step-number">{String(index + 1).padStart(2, "0")}</div>
                  <div>
                    <strong>Step {index + 1}</strong>
                    <span className="step-preview">{preview}</span>
                  </div>
                  <div className="step-actions">
                    <button className="icon-button" title="Move step up" onClick={() => moveStep(index, -1)} disabled={index === 0}>↑</button>
                    <button className="icon-button" title="Move step down" onClick={() => moveStep(index, 1)} disabled={index === steps.length - 1}>↓</button>
                    <button className="icon-button danger" title="Remove step" onClick={() => removeStep(step.id)} disabled={steps.length === 1}>×</button>
                  </div>
                </div>

                <div className="grid four">
                  {entryMode === "dose" ? (
                    <label className={`field ${stepErrors.doseMg ? "has-error" : ""}`}>
                      <span>Prescribed dose (mg)</span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        inputMode="decimal"
                        value={step.doseMg}
                        onChange={(e) => updateStep(step.id, "doseMg", e.target.value)}
                        placeholder="e.g. 25"
                      />
                      {stepErrors.doseMg && <small>{stepErrors.doseMg}</small>}
                    </label>
                  ) : (
                    <label className={`field ${stepErrors.tablets ? "has-error" : ""}`}>
                      <span>Tablets / capsules per dose</span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        inputMode="decimal"
                        value={step.tablets}
                        onChange={(e) => updateStep(step.id, "tablets", e.target.value)}
                        placeholder="e.g. 5"
                      />
                      {stepErrors.tablets && <small>{stepErrors.tablets}</small>}
                    </label>
                  )}

                  <label className="field">
                    <span>Frequency</span>
                    <select value={step.frequency} onChange={(e) => updateStep(step.id, "frequency", e.target.value)}>
                      {FREQUENCIES.map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </select>
                  </label>

                  <label className={`field ${stepErrors.duration ? "has-error" : ""}`}>
                    <span>Duration</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      inputMode="decimal"
                      value={step.duration}
                      onChange={(e) => updateStep(step.id, "duration", e.target.value)}
                      placeholder="e.g. 7"
                    />
                    {stepErrors.duration && <small>{stepErrors.duration}</small>}
                  </label>

                  <label className="field">
                    <span>Unit</span>
                    <select value={step.durationUnit} onChange={(e) => updateStep(step.id, "durationUnit", e.target.value)}>
                      {DURATION_UNITS.map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </select>
                  </label>
                </div>

                {step.frequency === "CUSTOM" && (
                  <label className={`field custom-frequency ${stepErrors.customDosesPerDay ? "has-error" : ""}`}>
                    <span>Custom doses per day</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      inputMode="decimal"
                      value={step.customDosesPerDay}
                      onChange={(e) => updateStep(step.id, "customDosesPerDay", e.target.value)}
                      placeholder="e.g. 1.5"
                    />
                    {stepErrors.customDosesPerDay && <small>{stepErrors.customDosesPerDay}</small>}
                  </label>
                )}

                <div className="calculation-strip">
                  <span>Normalized dose</span>
                  <strong>
                    {Number.isFinite(calculated.tablets) ? `${formatNumber(calculated.tablets)} tablets/capsules` : "—"}
                    {Number.isFinite(calculated.doseMg) ? ` • ${formatNumber(calculated.doseMg)} mg` : ""}
                  </strong>
                  <span className="calculation-detail">
                    Quantity: {Number.isFinite(calculated.quantity) ? `${formatNumber(calculated.quantity)} units` : "—"}
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        <button className="add-step" onClick={addStep}>+ Add taper step</button>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="step-label">03</span>
            <div>
              <h3>Taper verification</h3>
              <p className="muted">Normalized output for a fast manual double-check.</p>
            </div>
          </div>
        </div>

        <div className="check-box">
          <div className="check-sequence">
            {plan.steps.map((step, index) => (
              <span key={step.id} className="sequence-item">
                {Number.isFinite(step.tablets) ? formatNumber(step.tablets) : "—"}
                <small>{Number(step.tablets) === 1 ? "unit" : "units"}</small>
                {index < plan.steps.length - 1 && <b>→</b>}
              </span>
            ))}
          </div>

          <div className="normalized-list">
            {plan.steps.map((step, index) => (
              <div className="normalized-row" key={step.id}>
                <span>{buildCompactLine(step, index).split(": ")[1]}</span>
                <strong>{Number.isFinite(step.quantity) ? `${formatNumber(step.quantity)} units` : "—"}</strong>
              </div>
            ))}
          </div>
        </div>

        {warnings.length > 0 && (
          <div className="alerts">
            {warnings.map((item, index) => (
              <div className={`alert ${item.type}`} key={`${item.message}-${index}`}>
                <span>{item.type === "warning" ? "!" : "i"}</span>
                <p>{item.message}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="results">
        <div className="result-card primary">
          <span>Total quantity</span>
          <strong>{hasErrors || strengthInvalid ? "—" : formatNumber(displayedTotal)}</strong>
          <small>tablets / capsules</small>
        </div>
        <div className="result-card">
          <span>Total duration</span>
          <strong>{hasErrors ? "—" : formatNumber(plan.totalDays)}</strong>
          <small>days</small>
        </div>
        <div className="result-card">
          <span>Steps</span>
          <strong>{steps.length}</strong>
          <small>taper stages</small>
        </div>
      </section>

      <section className="actions-panel">
        <label className="toggle">
          <input type="checkbox" checked={roundUp} onChange={(e) => setRoundUp(e.target.checked)} />
          <span className="toggle-ui"></span>
          <span>
            <strong>Round total up to a whole unit</strong>
            <small>Optional quantity view; the underlying calculation remains unchanged.</small>
          </span>
        </label>

        <button className="button primary-button" onClick={copySummary} disabled={hasErrors || strengthInvalid}>
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
        <span className="footer-leader">Project Leader: <strong>YARA ALOMARI</strong></span>
        <span>Taper Check • Calculations run locally in your browser.</span>
      </footer>
    </main>
  );
}

export default App;
