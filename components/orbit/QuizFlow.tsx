"use client";

// Orbit v2 — QuizFlow (with Carbon Almanac learning moments)
//
// Five-question onboarding quiz. Each question maps to a real mission
// question key so the signal engine can compute a first-pass score.
//
// NEW: After each answer, a FactCard from The Carbon Almanac appears
// before the next question. This turns the quiz from a test into a
// learning experience — each answer unlocks a surprising, relevant fact.
//
//   Landing → Q1 → Fact → Q2 → Fact → Q3 → Fact → Q4 → Fact → Q5 → Fact → Reveal
//
// No Prisma, no API calls during the quiz. Everything runs client-side.
// Mobile-first. Big tap targets. One screen at a time.

import { useState, useCallback } from "react";
import { calculateSignal, type AnswerInput, type MissionStateInput } from "@/lib/orbit/signal";
import { pickFact } from "@/lib/orbit/almanac-facts";
import { FactCard } from "./FactCard";

// ────────────────────────────────────────────────────────────────────────────
// Quiz question definitions
// ────────────────────────────────────────────────────────────────────────────

type QuizOption = { value: string; label: string; emoji?: string };

type QuizQuestion = {
  id: number;
  missionKey: "HOME_BASELINE" | "FLIGHT_QUESTION" | "FOOD_CHOICES";
  questionKey: string;
  prompt: string;
  subtext: string;
  options: QuizOption[];
};

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    missionKey: "HOME_BASELINE",
    questionKey: "home.country",
    prompt: "Where do you live?",
    subtext: "This tells us how your electricity is made.",
    options: [
      { value: "US", label: "United States" },
      { value: "UK", label: "United Kingdom" },
      { value: "FR", label: "France" },
      { value: "DE", label: "Germany" },
      { value: "OTHER", label: "Somewhere else" },
    ],
  },
  {
    id: 2,
    missionKey: "HOME_BASELINE",
    questionKey: "home.car_ownership",
    prompt: "How do you get around?",
    subtext: "Your daily commute shapes more of your footprint than you\u2019d think.",
    options: [
      { value: "none", label: "No car, mostly walk, bike, or transit" },
      { value: "shared", label: "I share a car or use one occasionally" },
      { value: "petrol", label: "I drive a petrol or diesel car" },
      { value: "hybrid", label: "I drive a hybrid" },
      { value: "ev", label: "I drive an electric car" },
    ],
  },
  {
    id: 3,
    missionKey: "FLIGHT_QUESTION",
    questionKey: "flight.intent",
    prompt: "How much are you flying this year?",
    subtext: "This one question can shift your whole picture.",
    options: [
      { value: "none", label: "Not flying this year" },
      { value: "one_short", label: "One short trip" },
      { value: "one_long", label: "One longer trip" },
      { value: "two_plus", label: "Two or more trips" },
      { value: "frequent", label: "I fly most months" },
    ],
  },
  {
    id: 4,
    missionKey: "FOOD_CHOICES",
    questionKey: "food.diet_type",
    prompt: "What does a typical week of eating look like?",
    subtext: "No judgement. Just an honest picture.",
    options: [
      { value: "heavy_meat", label: "Red meat several times a week" },
      { value: "meat", label: "Mostly chicken and pork" },
      { value: "flexitarian", label: "Meat a few days a week" },
      { value: "pescatarian", label: "Fish but no meat" },
      { value: "vegetarian", label: "Vegetarian" },
      { value: "vegan", label: "Fully plant-based" },
    ],
  },
  {
    id: 5,
    missionKey: "HOME_BASELINE",
    questionKey: "home.heating_fuel",
    prompt: "What heats your home?",
    subtext: "Heating is often the invisible half of a home footprint.",
    options: [
      { value: "electric", label: "Electricity or heat pump" },
      { value: "gas", label: "Natural gas" },
      { value: "oil", label: "Heating oil" },
      { value: "district", label: "District heating" },
      { value: "none", label: "No central heating" },
    ],
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Insight generator
// ────────────────────────────────────────────────────────────────────────────

function generateInsight(breakdown: { home: number; flights: number; food: number; digital: number }, monthlyTCO2e: number): string {
  const total = breakdown.home + breakdown.flights + breakdown.food + breakdown.digital;
  if (total === 0) return "Your footprint is remarkably light. The full picture will tell you more.";

  const flightPct = breakdown.flights / total;
  const homePct = breakdown.home / total;
  const foodPct = breakdown.food / total;

  if (flightPct > 0.45) {
    return "Your flights are quietly carrying most of your footprint. Everything else you do matters less than that one decision.";
  }
  if (homePct > 0.45) {
    return "Your home is the biggest part of the picture right now. How you heat it and power it matters more than most people expect.";
  }
  if (foodPct > 0.40) {
    return "What you eat is shaping your footprint more than you might think. A few shifts on your plate can move the needle faster than almost anything else.";
  }
  if (monthlyTCO2e < 0.3) {
    return "You\u2019re already lighter than most. The full picture will show you exactly where the remaining weight sits.";
  }
  return "Your footprint is spread across a few areas. The full picture will show you which ones are worth focusing on first.";
}

// ────────────────────────────────────────────────────────────────────────────
// Types for parent communication
// ────────────────────────────────────────────────────────────────────────────

export type QuizResult = {
  score: number;
  monthlyTCO2e: number;
  breakdown: { home: number; flights: number; food: number; digital: number };
  insight: string;
  answers: Record<string, string>;
};

type Props = {
  onComplete: (result: QuizResult) => void;
};

// ────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────

export function QuizFlow({ onComplete }: Props) {
  const [phase, setPhase] = useState<"landing" | "question" | "fact">("landing");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [animating, setAnimating] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<string>("");

  const currentQ = QUIZ_QUESTIONS[step];
  const progress = (step + (phase === "fact" ? 0.5 : 0)) / QUIZ_QUESTIONS.length;

  const handleSelect = useCallback((value: string) => {
    if (animating) return;

    const newAnswers = { ...answers, [currentQ.questionKey]: value };
    setAnswers(newAnswers);
    setLastAnswer(value);
    setAnimating(true);

    // Brief pause to show selection, then show fact card
    setTimeout(() => {
      setPhase("fact");
      setAnimating(false);
    }, 400);
  }, [answers, animating, currentQ]);

  const handleFactContinue = useCallback(() => {
    if (step < QUIZ_QUESTIONS.length - 1) {
      // Advance to next question
      setStep(step + 1);
      setPhase("question");
    } else {
      // Final question — compute signal and call onComplete
      const answerInputs: AnswerInput[] = QUIZ_QUESTIONS.map((q) => ({
        missionKey: q.missionKey,
        questionKey: q.questionKey,
        valueStr: answers[q.questionKey] ?? null,
        valueNum: null,
        valueBool: null,
      }));

      const missions: MissionStateInput[] = [
        { key: "HOME_BASELINE", status: "PARTIAL" },
        { key: "FLIGHT_QUESTION", status: "PARTIAL" },
        { key: "FOOD_CHOICES", status: "PARTIAL" },
        { key: "DIGITAL_CARBON", status: "LOCKED" },
      ];

      const result = calculateSignal({ answers: answerInputs, missions });
      const insight = generateInsight(result.breakdown, result.monthlyTCO2e);

      onComplete({
        score: result.score,
        monthlyTCO2e: result.monthlyTCO2e,
        breakdown: result.breakdown,
        insight,
        answers,
      });
    }
  }, [step, answers, onComplete]);

  // ── Landing screen ──────────────────────────────────────────────────────

  if (phase === "landing") {
    return (
      <div className="quiz-landing">
        <div className="quiz-landing-content">
          <div className="quiz-eyebrow">
            <span className="dot" /> ORBIT <span className="sep">·</span> THE SPACESHIP ACADEMY
          </div>
          <h1 className="quiz-headline">
            How heavy is your
            <br />
            <span className="italic">orbit?</span>
          </h1>
          <p className="quiz-lede">
            Five questions. Two minutes. A first honest look at the
            choices that shape your footprint &mdash; and what might
            surprise you along the way.
          </p>
          <button
            className="btn btn-mint btn-lg"
            onClick={() => setPhase("question")}
          >
            Find out
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <p className="quiz-footnote">
            Powered by The Carbon Almanac &middot; Built by The Spaceship Academy
          </p>
        </div>

        {/* Decorative signal gauge preview */}
        <div className="quiz-gauge-preview" aria-hidden="true">
          <svg viewBox="0 0 120 120" className="quiz-gauge-svg">
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--line-1)" strokeWidth="4" />
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--mint)" strokeWidth="4"
              strokeDasharray="327" strokeDashoffset="327" strokeLinecap="round"
              className="quiz-gauge-arc" />
            <text x="60" y="56" textAnchor="middle" fill="var(--ink-4)" fontSize="11" fontFamily="JetBrains Mono" letterSpacing="2">SIGNAL</text>
            <text x="60" y="76" textAnchor="middle" fill="var(--ink-5)" fontSize="10" fontFamily="JetBrains Mono">?? / 100</text>
          </svg>
        </div>
      </div>
    );
  }

  // ── Fact card (between questions) ────────────────────────────────────────

  if (phase === "fact") {
    const fact = pickFact(currentQ.questionKey, lastAnswer);
    return (
      <div className="quiz-container">
        {/* Progress bar */}
        <div className="quiz-progress">
          <div className="quiz-progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>

        <FactCard
          fact={fact}
          questionIndex={step}
          totalQuestions={QUIZ_QUESTIONS.length}
          onContinue={handleFactContinue}
        />
      </div>
    );
  }

  // ── Quiz questions ──────────────────────────────────────────────────────

  return (
    <div className="quiz-container">
      {/* Progress bar */}
      <div className="quiz-progress">
        <div className="quiz-progress-fill" style={{ width: `${progress * 100}%` }} />
      </div>

      {/* Step counter */}
      <div className="quiz-step-label">
        {step + 1} of {QUIZ_QUESTIONS.length}
      </div>

      {/* Question card */}
      <div className="quiz-card" key={currentQ.id}>
        <h2 className="quiz-prompt">{currentQ.prompt}</h2>
        <p className="quiz-subtext">{currentQ.subtext}</p>

        <div className="quiz-options">
          {currentQ.options.map((opt) => {
            const isSelected = answers[currentQ.questionKey] === opt.value;
            return (
              <button
                key={opt.value}
                className={`quiz-option ${isSelected ? "selected" : ""}`}
                onClick={() => handleSelect(opt.value)}
                disabled={animating}
                aria-pressed={isSelected}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Back button (only after first question) */}
      {step > 0 && (
        <button
          className="quiz-back"
          onClick={() => {
            if (!animating) setStep(step - 1);
          }}
          disabled={animating}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
      )}
    </div>
  );
}
