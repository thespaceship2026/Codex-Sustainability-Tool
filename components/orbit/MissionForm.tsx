// MissionForm — the shared renderer for any mission's questions.
//
// Given a Mission config and a map of prior answers, this component:
//   • Renders each question as a matching input (number / choice / bool)
//   • Groups questions into three-at-a-time "steps" so the form feels
//     paced rather than a wall of fields
//   • POSTs to /api/missions/[key]/answers on submit
//   • On success, refreshes server state and navigates back to the
//     dashboard, or shows the lit-mission celebration inline
//
// Keeps all state in React — no form library, no zod on the client.
// Validation happens on the server route via the same schema that
// lib/orbit/actions.ts uses.

"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { Mission, Question } from "@/lib/orbit/missions";
import type { SignalView } from "@/lib/orbit/types";

type PriorAnswer = {
  valueNum?: number | null;
  valueStr?: string | null;
  valueBool?: boolean | null;
};

type PriorAnswers = Record<string, PriorAnswer>;

type Props = {
  mission: Mission;
  priorAnswers: PriorAnswers;
  // Optional — if provided, we show a tiny "current signal" readout at the top
  signal?: SignalView;
};

type FormState = Record<
  string,
  { valueNum?: number; valueStr?: string; valueBool?: boolean }
>;

type SaveResult = {
  missionKey: string;
  newStatus: string;
  progress: number;
  missionLit: boolean;
  signal: SignalView;
};

const STEP_SIZE = 3;

export function MissionForm({ mission, priorAnswers, signal }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Chunk questions into steps of 3.
  const steps = useMemo(() => {
    const chunks: Question[][] = [];
    for (let i = 0; i < mission.questions.length; i += STEP_SIZE) {
      chunks.push(mission.questions.slice(i, i + STEP_SIZE));
    }
    return chunks;
  }, [mission.questions]);

  const [stepIndex, setStepIndex] = useState(0);
  const [formState, setFormState] = useState<FormState>(() =>
    seedFormState(mission, priorAnswers)
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<SaveResult | null>(null);

  const currentStep = steps[stepIndex] ?? [];
  const isLastStep = stepIndex === steps.length - 1;

  function updateNumber(key: string, value: number) {
    setFormState((prev) => ({ ...prev, [key]: { valueNum: value } }));
  }
  function updateString(key: string, value: string) {
    setFormState((prev) => ({ ...prev, [key]: { valueStr: value } }));
  }
  function updateBool(key: string, value: boolean) {
    setFormState((prev) => ({ ...prev, [key]: { valueBool: value } }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Require every required question in the full mission (not just this step).
    const missing = mission.questions
      .filter((q) => q.required)
      .filter((q) => !isAnswered(formState[q.key]));
    if (missing.length > 0) {
      setError(
        `Still missing: ${missing
          .slice(0, 3)
          .map((q) => q.prompt)
          .join(" · ")}${missing.length > 3 ? "…" : ""}`
      );
      return;
    }

    setSubmitting(true);
    try {
      type AnswerPayload = {
        questionKey: string;
        valueNum?: number;
        valueStr?: string;
        valueBool?: boolean;
      };
      const answers: AnswerPayload[] = [];
      for (const q of mission.questions) {
        const entry = formState[q.key];
        if (!entry) continue;
        if (entry.valueNum !== undefined) {
          answers.push({ questionKey: q.key, valueNum: entry.valueNum });
        } else if (entry.valueStr !== undefined) {
          answers.push({ questionKey: q.key, valueStr: entry.valueStr });
        } else if (entry.valueBool !== undefined) {
          answers.push({ questionKey: q.key, valueBool: entry.valueBool });
        }
      }

      const res = await fetch(`/api/missions/${mission.key}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers })
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error ?? `Save failed (${res.status})`);
      }

      const result = (await res.json()) as SaveResult;

      // If we lit the mission, show a celebration first; otherwise bounce
      // straight back to the dashboard.
      if (result.missionLit) {
        setCelebration(result);
        startTransition(() => {
          router.refresh();
        });
      } else {
        startTransition(() => {
          router.refresh();
          router.push("/");
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (celebration) {
    return (
      <div className="mission-celebrate">
        <p className="eyebrow">Mission lit</p>
        <h2>{mission.title} captured.</h2>
        <p className="body">
          Your orbit just got brighter. Signal is now{" "}
          <strong>{celebration.signal.score}/100</strong> at{" "}
          {celebration.signal.monthlyTCO2e.toFixed(2)} tCO₂e/mo.
        </p>
        <div className="btn-row">
          <button
            className="btn btn-mint"
            onClick={() => {
              startTransition(() => {
                router.refresh();
                router.push("/");
              });
            }}
          >
            Back to orbit
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="mission-form" onSubmit={handleSubmit}>
      <header className="mission-header">
        <p className="eyebrow">Mission {missionNumber(mission.key)}</p>
        <h1>{mission.title}</h1>
        <p className="italic-serif">{mission.tagline}</p>
        <p className="body">{mission.description}</p>
        {signal ? (
          <p className="mono mission-signal">
            Current signal: {signal.score}/100 ·{" "}
            {signal.monthlyTCO2e.toFixed(2)} tCO₂e/mo
          </p>
        ) : null}
      </header>

      <nav className="mission-steps" aria-label="Mission steps">
        {steps.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`step-dot${i === stepIndex ? " active" : ""}${
              i < stepIndex ? " done" : ""
            }`}
            onClick={() => setStepIndex(i)}
            aria-label={`Step ${i + 1} of ${steps.length}`}
          >
            {i + 1}
          </button>
        ))}
      </nav>

      <div className="mission-questions">
        {currentStep.map((q) => (
          <QuestionField
            key={q.key}
            question={q}
            state={formState[q.key]}
            onNumber={(v) => updateNumber(q.key, v)}
            onString={(v) => updateString(q.key, v)}
            onBool={(v) => updateBool(q.key, v)}
          />
        ))}
      </div>

      {error ? <p className="mission-error">{error}</p> : null}

      <div className="mission-nav">
        {stepIndex > 0 ? (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          >
            ← Back
          </button>
        ) : (
          <a className="btn btn-ghost" href="/">
            ← Abort
          </a>
        )}

        {!isLastStep ? (
          <button
            type="button"
            className="btn btn-mint"
            onClick={() => setStepIndex((i) => Math.min(steps.length - 1, i + 1))}
          >
            Next →
          </button>
        ) : (
          <button type="submit" className="btn btn-mint" disabled={submitting}>
            {submitting ? "Saving…" : "Light the mission"}
          </button>
        )}
      </div>
    </form>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Question field
// ────────────────────────────────────────────────────────────────────────────

type QuestionFieldProps = {
  question: Question;
  state?: FormState[string];
  onNumber: (v: number) => void;
  onString: (v: string) => void;
  onBool: (v: boolean) => void;
};

function QuestionField({
  question,
  state,
  onNumber,
  onString,
  onBool
}: QuestionFieldProps) {
  const { spec } = question;

  return (
    <div className="q-field">
      <label className="q-prompt" htmlFor={`q-${question.key}`}>
        {question.prompt}
        {question.required ? (
          <span className="q-required" aria-hidden="true">
            •
          </span>
        ) : null}
      </label>
      {question.help ? <p className="q-help">{question.help}</p> : null}

      {spec.kind === "number" ? (
        <div className="q-number">
          <input
            id={`q-${question.key}`}
            type="number"
            inputMode="numeric"
            min={spec.min}
            max={spec.max}
            step={spec.step ?? 1}
            value={state?.valueNum ?? spec.default ?? ""}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (!Number.isNaN(n)) onNumber(n);
            }}
          />
          <span className="q-unit">{spec.unit}</span>
        </div>
      ) : null}

      {spec.kind === "choice" ? (
        <div className="q-choice" role="radiogroup">
          {spec.options.map((opt) => {
            const current = state?.valueStr ?? spec.default;
            const selected = current === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`q-option${selected ? " selected" : ""}`}
                onClick={() => onString(opt.value)}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {spec.kind === "bool" ? (
        <div className="q-bool" role="radiogroup">
          {[
            { v: true, label: "Yes" },
            { v: false, label: "No" }
          ].map(({ v, label }) => {
            const current = state?.valueBool ?? spec.default ?? false;
            const selected = current === v;
            return (
              <button
                key={label}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`q-option${selected ? " selected" : ""}`}
                onClick={() => onBool(v)}
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function seedFormState(mission: Mission, prior: PriorAnswers): FormState {
  const state: FormState = {};
  for (const q of mission.questions) {
    const p = prior[q.key];
    if (p) {
      if (p.valueNum != null) state[q.key] = { valueNum: p.valueNum };
      else if (p.valueStr != null) state[q.key] = { valueStr: p.valueStr };
      else if (p.valueBool != null) state[q.key] = { valueBool: p.valueBool };
    } else if (q.spec.kind === "number" && q.spec.default != null) {
      state[q.key] = { valueNum: q.spec.default };
    } else if (q.spec.kind === "choice" && q.spec.default != null) {
      state[q.key] = { valueStr: q.spec.default };
    } else if (q.spec.kind === "bool" && q.spec.default != null) {
      state[q.key] = { valueBool: q.spec.default };
    }
  }
  return state;
}

function isAnswered(entry: FormState[string] | undefined): boolean {
  if (!entry) return false;
  return (
    entry.valueNum !== undefined ||
    entry.valueStr !== undefined ||
    entry.valueBool !== undefined
  );
}

function missionNumber(key: string): string {
  switch (key) {
    case "HOME_BASELINE":
      return "01";
    case "FLIGHT_QUESTION":
      return "02";
    case "FOOD_CHOICES":
      return "03";
    case "DIGITAL_CARBON":
      return "04";
    default:
      return "00";
  }
}
