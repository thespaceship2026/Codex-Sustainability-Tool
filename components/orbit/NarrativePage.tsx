"use client";

// Orbit v2 — NarrativePage
//
// The single-page scrolling narrative experience. Replaces the old
// dashboard-first approach with a story-driven page:
//
//   1. Hero: live global CO₂ counter (ticking in real time)
//   2. Three Carbon Almanac facts (scroll-reveal)
//   3. Pivot + inline quiz (5 questions with fact interludes)
//   4. Signal reveal (score, breakdown, swap lever)
//   5. Close (Almanac quote, Thrive Lab bridge, email capture)
//
// Target audience: 18–25 year olds discovering their carbon footprint
// for the first time. Designed to create a "wow" in the first 5 seconds.

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  calculateSignal,
  type AnswerInput,
  type MissionStateInput,
} from "@/lib/orbit/signal";
import { REVEAL_QUOTES, pickFact } from "@/lib/orbit/almanac-facts";

// ════════════════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════════════════

// ~36.8 Gt CO₂/year from fossil fuels (2022) → ~1,167 tonnes per second
const CO2_TONNES_PER_SECOND = 1167;

// Three curated Almanac facts for the scroll narrative
// Arc: SCALE → SURPRISE → AGENCY
const SCROLL_FACTS = [
  {
    num: "01",
    headline: "One metric ton is huge.",
    body: "A single metric ton of CO\u2082 would fill a cube about 10 metres on each side. The average American is responsible for about 14 of those cubes every year. The target to stay within safe limits? Around two and a half.",
    source: "The Carbon Almanac",
    accent: "var(--mint)",
  },
  {
    num: "02",
    headline: "One flight can change everything.",
    body: "A single round-trip flight from San Francisco to London produces about as much CO\u2082 as an entire year of driving. One trip. One year. Same number.",
    source: "The Carbon Almanac",
    accent: "var(--cyan)",
  },
  {
    num: "03",
    headline: "Your plate is a lever.",
    body: "Livestock accounts for 61% of all food production emissions. Shifting even a few meals a week from beef to plants is one of the fastest levers any individual can pull.",
    source: "The Carbon Almanac",
    accent: "var(--sky)",
  },
];

// ── Quiz questions ──────────────────────────────────────────────────────────

type QuizOption = { value: string; label: string };
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
      { value: "none", label: "No car \u2014 walk, bike, or transit" },
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

// ── Swap options for the reveal ─────────────────────────────────────────────

type SwapOption = {
  id: string;
  label: string;
  description: string;
  savingsKg: number;
  relevantTo: string[];
  icon: string;
};

const SWAP_OPTIONS: SwapOption[] = [
  {
    id: "flight",
    label: "Skip one flight",
    description:
      "One fewer round-trip this year saves the equivalent of months of driving.",
    savingsKg: 230,
    relevantTo: ["one_short", "one_long", "two_plus", "frequent"],
    icon: "\u2708\uFE0F",
  },
  {
    id: "meat",
    label: "Two plant days a week",
    description:
      "Swap beef for plants just two days. That\u2019s 30 fewer pounds of CO\u2082 each time.",
    savingsKg: 45,
    relevantTo: ["heavy_meat", "meat", "flexitarian"],
    icon: "\uD83C\uDF31",
  },
  {
    id: "transport",
    label: "Commute without driving",
    description:
      "Bike, bus, or walk one day a week. A small shift in how you move changes the math.",
    savingsKg: 60,
    relevantTo: ["petrol", "shared"],
    icon: "\uD83D\uDEB2",
  },
  {
    id: "heat",
    label: "Switch to a heat pump",
    description:
      "Heat pumps use a fraction of the energy that gas or oil furnaces do.",
    savingsKg: 80,
    relevantTo: ["gas", "oil"],
    icon: "\uD83C\uDFE0",
  },
  {
    id: "digital",
    label: "Unplug what you\u2019re not using",
    description:
      "Standby power adds up. Gaming consoles alone can use 150\u2013216 Wh per hour of play.",
    savingsKg: 15,
    relevantTo: ["US", "UK", "FR", "DE", "OTHER"],
    icon: "\uD83D\uDD0C",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateInsight(
  breakdown: { home: number; flights: number; food: number; digital: number },
  monthlyTCO2e: number
): string {
  const total =
    breakdown.home + breakdown.flights + breakdown.food + breakdown.digital;
  if (total === 0) return "Your footprint is remarkably light.";

  const flightPct = breakdown.flights / total;
  const homePct = breakdown.home / total;
  const foodPct = breakdown.food / total;

  if (flightPct > 0.45)
    return "Your flights are quietly carrying most of your footprint. Everything else you do matters less than that one decision.";
  if (homePct > 0.45)
    return "Your home is the biggest part of the picture. How you heat it and power it matters more than most people expect.";
  if (foodPct > 0.4)
    return "What you eat is shaping your footprint more than you might think. A few shifts on your plate can move the needle faster than almost anything else.";
  if (monthlyTCO2e < 0.3)
    return "You\u2019re already lighter than most. The full picture will show exactly where the remaining weight sits.";
  return "Your footprint is spread across a few areas. The full picture will show which ones are worth focusing on first.";
}

// ════════════════════════════════════════════════════════════════════════════
// Component
// ════════════════════════════════════════════════════════════════════════════

export default function NarrativePage() {
  // ── CO₂ counter ────────────────────────────────────────────────────────
  const [co2, setCo2] = useState(0);

  // ── Quiz state ─────────────────────────────────────────────────────────
  const [quizPhase, setQuizPhase] = useState<"idle" | "question" | "fact">(
    "idle"
  );
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [lastAnswer, setLastAnswer] = useState("");
  const [animating, setAnimating] = useState(false);

  // ── Reveal state ───────────────────────────────────────────────────────
  const [quizComplete, setQuizComplete] = useState(false);
  const [signal, setSignal] = useState<{
    score: number;
    monthlyTCO2e: number;
    breakdown: {
      home: number;
      flights: number;
      food: number;
      digital: number;
    };
    insight: string;
  } | null>(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [revealPhase, setRevealPhase] = useState<
    "counting" | "insight" | "swap" | "done"
  >("counting");
  const [selectedSwap, setSelectedSwap] = useState<string | null>(null);

  // ── Email capture ──────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(true);
  const [captureStatus, setCaptureStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  // ── Refs ───────────────────────────────────────────────────────────────
  const quizRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const scoreTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Computed values ────────────────────────────────────────────────────
  const quote = signal
    ? REVEAL_QUOTES[signal.score % REVEAL_QUOTES.length]
    : REVEAL_QUOTES[0];

  const relevantSwaps = useMemo(() => {
    const vals = Object.values(answers);
    return SWAP_OPTIONS.filter((sw) =>
      sw.relevantTo.some((v) => vals.includes(v))
    ).slice(0, 3);
  }, [answers]);

  const swapSavingsMonthly = useMemo(() => {
    if (!selectedSwap) return 0;
    const sw = SWAP_OPTIONS.find((s) => s.id === selectedSwap);
    return sw ? sw.savingsKg / 1000 : 0;
  }, [selectedSwap]);

  const adjustedMonthly = signal
    ? Math.max(0, signal.monthlyTCO2e - swapSavingsMonthly)
    : 0;

  const currentQ = QUIZ_QUESTIONS[step];
  const trajectory = signal
    ? signal.score >= 70
      ? "LIGHT"
      : signal.score >= 40
      ? "STEADY"
      : "HEAVY"
    : "STEADY";
  const total = signal
    ? signal.breakdown.home +
      signal.breakdown.flights +
      signal.breakdown.food +
      signal.breakdown.digital
    : 0;
  const bars = signal
    ? [
        {
          key: "home",
          label: "Home",
          value: signal.breakdown.home,
          color: "var(--mint)",
        },
        {
          key: "flights",
          label: "Flights",
          value: signal.breakdown.flights,
          color: "var(--cyan)",
        },
        {
          key: "food",
          label: "Food",
          value: signal.breakdown.food,
          color: "var(--sky)",
        },
        {
          key: "digital",
          label: "Digital",
          value: signal.breakdown.digital,
          color: "var(--ink-4)",
        },
      ].filter((b) => b.value > 0)
    : [];

  // ── Effects ────────────────────────────────────────────────────────────

  // CO₂ counter — ticks from 0 on page load
  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      setCo2(Math.round(elapsed * CO2_TONNES_PER_SECOND));
    }, 50);
    return () => clearInterval(timer);
  }, []);

  // Scroll-reveal observer — adds .n-visible to sections on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("n-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );

    document
      .querySelectorAll(".n-reveal-on-scroll")
      .forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [quizComplete]); // re-observe when reveal sections mount

  // Score counter animation
  useEffect(() => {
    if (!quizComplete || !signal) return;

    const duration = 2000;
    const start = Date.now();

    scoreTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayScore(Math.round(eased * signal.score));

      if (progress >= 1) {
        if (scoreTimerRef.current) clearInterval(scoreTimerRef.current);
        setTimeout(() => setRevealPhase("insight"), 400);
        setTimeout(() => setRevealPhase("swap"), 1600);
        setTimeout(() => setRevealPhase("done"), 3000);
      }
    }, 16);

    return () => {
      if (scoreTimerRef.current) clearInterval(scoreTimerRef.current);
    };
  }, [quizComplete, signal]);

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleStartQuiz = useCallback(() => {
    setQuizPhase("question");
    setStep(0);
    setTimeout(() => {
      quizRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }, []);

  const handleSelect = useCallback(
    (value: string) => {
      if (animating) return;
      const q = QUIZ_QUESTIONS[step];
      const newAnswers = { ...answers, [q.questionKey]: value };
      setAnswers(newAnswers);
      setLastAnswer(value);
      setAnimating(true);

      setTimeout(() => {
        setQuizPhase("fact");
        setAnimating(false);
      }, 350);
    },
    [step, answers, animating]
  );

  const handleFactContinue = useCallback(() => {
    if (step < QUIZ_QUESTIONS.length - 1) {
      setStep(step + 1);
      setQuizPhase("question");
    } else {
      // Final question — compute signal
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

      setSignal({
        score: result.score,
        monthlyTCO2e: result.monthlyTCO2e,
        breakdown: result.breakdown,
        insight,
      });
      setQuizComplete(true);
      setQuizPhase("idle");

      setTimeout(() => {
        revealRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 300);
    }
  }, [step, answers]);

  async function handleCapture(e: React.FormEvent) {
    e.preventDefault();
    if (captureStatus === "submitting" || captureStatus === "success") return;
    const trimmed = email.trim();
    if (!trimmed || !consent) return;

    setCaptureStatus("submitting");
    try {
      const res = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          source: "orbit_narrative",
          signalAtCapture: signal?.score,
          monthlyTCO2e: signal?.monthlyTCO2e,
          consent,
          selectedSwap,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setCaptureStatus("success");
    } catch {
      setCaptureStatus("error");
    }
  }

  // Fact for quiz interludes
  const currentFact =
    quizPhase === "fact" ? pickFact(currentQ.questionKey, lastAnswer) : null;

  // ════════════════════════════════════════════════════════════════════════
  // Render
  // ════════════════════════════════════════════════════════════════════════

  return (
    <div className="n-page">
      {/* ──────────────────────────────────────────────────── HERO */}
      <section className="n-hero">
        <div className="n-hero-inner">
          <div className="n-hero-live">
            <span className="n-live-dot" />
            <span>LIVE</span>
          </div>
          <div className="n-counter-wrap">
            <div className="n-counter" aria-label="Global CO2 emissions counter">
              {co2.toLocaleString("en-US")}
            </div>
            <div className="n-counter-label">tonnes of CO\u2082</div>
            <div className="n-counter-sub">
              emitted globally since you opened this page
            </div>
          </div>
          <div className="n-hero-credit">
            Data: <strong>The Carbon Almanac</strong> &middot; Penguin Random
            House, 2022
          </div>
        </div>
        <div className="n-scroll-hint" aria-hidden="true">
          <span>SCROLL</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5v14M5 12l7 7 7-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </section>

      {/* ──────────────────────────────────────────── SCROLL FACTS */}
      {SCROLL_FACTS.map((fact) => (
        <section
          key={fact.num}
          className="n-fact n-reveal-on-scroll"
          style={{ "--fact-accent": fact.accent } as React.CSSProperties}
        >
          <div className="n-fact-inner">
            <span className="n-fact-num">{fact.num}</span>
            <h2 className="n-fact-headline">{fact.headline}</h2>
            <p className="n-fact-body">{fact.body}</p>
            <div className="n-fact-credit">
              <span className="n-fact-book">
                {"\uD83D\uDCD6"} {fact.source}
              </span>
            </div>
          </div>
        </section>
      ))}

      {/* ──────────────────────────────────────── PIVOT + QUIZ */}
      <section className="n-pivot n-reveal-on-scroll" ref={quizRef}>
        <div className="n-pivot-inner">
          {/* Idle — invitation to start */}
          {quizPhase === "idle" && !quizComplete && (
            <div className="n-pivot-content" key="pivot-idle">
              <h2 className="n-pivot-headline">
                You{"\u2019"}ve seen the numbers.
                <br />
                <span className="n-italic">Now let{"\u2019"}s find yours.</span>
              </h2>
              <p className="n-pivot-body">
                Five questions. Two minutes. A first honest look at the choices
                that shape your footprint.
              </p>
              <button className="n-btn n-btn-mint" onClick={handleStartQuiz}>
                Find my signal
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14M13 5l7 7-7 7"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Question phase */}
          {quizPhase === "question" && currentQ && (
            <div className="n-quiz-card" key={`q-${currentQ.id}`}>
              <div className="n-quiz-step">
                {step + 1} / {QUIZ_QUESTIONS.length}
              </div>
              <h2 className="n-quiz-prompt">{currentQ.prompt}</h2>
              <p className="n-quiz-subtext">{currentQ.subtext}</p>
              <div className="n-quiz-options">
                {currentQ.options.map((opt) => (
                  <button
                    key={opt.value}
                    className={`n-quiz-option ${
                      answers[currentQ.questionKey] === opt.value
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => handleSelect(opt.value)}
                    disabled={animating}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="n-quiz-progress">
                <div
                  className="n-quiz-progress-fill"
                  style={{
                    width: `${(step / QUIZ_QUESTIONS.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Fact interlude between questions */}
          {quizPhase === "fact" && currentFact && (
            <div className="n-interlude" key={`fact-${step}`}>
              <div className="n-interlude-badge">
                {"\u2728"} DID YOU KNOW?
              </div>
              <h3 className="n-interlude-headline">{currentFact.headline}</h3>
              <p className="n-interlude-body">{currentFact.body}</p>
              <div className="n-interlude-credit">
                {"\uD83D\uDCD6"} The Carbon Almanac
              </div>
              <button
                className="n-btn n-btn-mint n-btn-full"
                onClick={handleFactContinue}
              >
                {step < QUIZ_QUESTIONS.length - 1
                  ? "Next question"
                  : "See my signal"}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14M13 5l7 7-7 7"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Quiz complete prompt */}
          {quizComplete && (
            <div className="n-quiz-done" key="quiz-done">
              <div className="n-quiz-done-check">{"\u2713"}</div>
              <p>All five answered. Scroll down to see your signal.</p>
            </div>
          )}
        </div>
      </section>

      {/* ──────────────────────────────────────────────── REVEAL */}
      {quizComplete && signal && (
        <>
          <section className="n-signal n-reveal-on-scroll" ref={revealRef}>
            <div className="n-signal-inner">
              <div className="n-signal-eyebrow">YOUR SIGNAL</div>

              {/* Score gauge */}
              <div className="n-gauge">
                <svg viewBox="0 0 200 200" className="n-gauge-svg">
                  <circle
                    cx="100"
                    cy="100"
                    r="82"
                    fill="none"
                    stroke="var(--line-1)"
                    strokeWidth="5"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="82"
                    fill="none"
                    stroke="var(--mint)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 82}
                    strokeDashoffset={
                      2 * Math.PI * 82 * (1 - displayScore / 100)
                    }
                    transform="rotate(-90 100 100)"
                  />
                </svg>
                <div className="n-gauge-text">
                  <span className="n-gauge-num">{displayScore}</span>
                  <span className="n-gauge-denom">/ 100</span>
                </div>
              </div>

              <div className="n-signal-trajectory">
                <span className={`n-pill ${trajectory.toLowerCase()}`}>
                  {trajectory}
                </span>
              </div>

              <div className="n-signal-tco2e">
                {signal.monthlyTCO2e.toFixed(1)} tonnes CO{"\u2082"} per month
              </div>

              {/* Breakdown bars */}
              {total > 0 && (
                <div className="n-breakdown">
                  {bars.map((b) => (
                    <div key={b.key} className="n-bar-row">
                      <span className="n-bar-label">{b.label}</span>
                      <div className="n-bar-track">
                        <div
                          className="n-bar-fill"
                          style={{
                            width: `${(b.value / total) * 100}%`,
                            backgroundColor: b.color,
                          }}
                        />
                      </div>
                      <span className="n-bar-pct">
                        {Math.round((b.value / total) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Insight */}
              <div
                className={`n-insight ${
                  revealPhase !== "counting" ? "n-visible" : ""
                }`}
              >
                <p>{signal.insight}</p>
              </div>
            </div>
          </section>

          {/* ──────────────────────────────────────── SWAP LEVER */}
          <section
            className={`n-swap n-reveal-on-scroll ${
              revealPhase === "swap" || revealPhase === "done"
                ? "n-visible"
                : ""
            }`}
          >
            <div className="n-swap-inner">
              <h3 className="n-swap-headline">
                What if you changed one thing?
              </h3>
              <p className="n-swap-subtext">
                Pick a swap. See how it moves the needle.
              </p>

              <div className="n-swap-options">
                {relevantSwaps.map((sw) => (
                  <button
                    key={sw.id}
                    className={`n-swap-btn ${
                      selectedSwap === sw.id ? "active" : ""
                    }`}
                    onClick={() =>
                      setSelectedSwap(
                        selectedSwap === sw.id ? null : sw.id
                      )
                    }
                  >
                    <span className="n-swap-icon">{sw.icon}</span>
                    <span className="n-swap-label">{sw.label}</span>
                  </button>
                ))}
              </div>

              {selectedSwap && (
                <div className="n-swap-result">
                  <p className="n-swap-description">
                    {
                      SWAP_OPTIONS.find((s) => s.id === selectedSwap)
                        ?.description
                    }
                  </p>
                  <div className="n-swap-savings">
                    <span className="n-swap-from">
                      {signal.monthlyTCO2e.toFixed(2)}
                    </span>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M5 12h14M13 5l7 7-7 7"
                        stroke="var(--mint)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="n-swap-to">
                      {adjustedMonthly.toFixed(2)}
                    </span>
                    <span className="n-swap-unit">tonnes/mo</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ──────────────────────────────────── ALMANAC QUOTE */}
          <section className="n-quote n-reveal-on-scroll">
            <div className="n-quote-inner">
              <blockquote>
                <p>
                  {"\u201C"}
                  {quote.text}
                  {"\u201D"}
                </p>
                <cite>
                  {"\u2014"} {quote.attribution}
                </cite>
              </blockquote>
              <div className="n-quote-credit">
                From <strong>The Carbon Almanac</strong> &middot; Partner of The
                Spaceship Academy
              </div>
            </div>
          </section>

          {/* ──────────────────────────────── THRIVE LAB BRIDGE */}
          <section className="n-bridge n-reveal-on-scroll">
            <div className="n-bridge-inner">
              <div className="n-bridge-kicker">FROM UNDERSTANDING TO ACTION</div>
              <h3>
                Ready to go deeper?{" "}
                <span className="n-italic">Thrive Lab</span> is where this gets
                real.
              </h3>
              <p>
                One week at The Hun School of Princeton. Systems thinking,
                planetary boundaries, and the kind of learning that changes how
                you see every decision. Grades 9{"\u2013"}12. Summer 2026.
              </p>
              <a
                className="n-btn n-btn-mint"
                href="https://www.hunschool.org/summer/summer-leadership-institute"
                target="_blank"
                rel="noreferrer"
              >
                Explore the programme
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14M13 5l7 7-7 7"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
          </section>

          {/* ──────────────────────────────────── EMAIL CAPTURE */}
          <section className="n-capture n-reveal-on-scroll">
            <div className="n-capture-inner">
              {captureStatus === "success" ? (
                <div className="n-capture-done">
                  <h3>You{"\u2019"}re on the list.</h3>
                  <p>Your first Orbit digest lands Sunday.</p>
                </div>
              ) : (
                <>
                  <h3>Get your weekly signal.</h3>
                  <p>
                    Your score updates each week with new data. One email. One
                    number. One thing worth trying.
                  </p>
                  <form
                    className="n-capture-form"
                    onSubmit={handleCapture}
                    noValidate
                  >
                    <div className="n-capture-row">
                      <input
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="you@somewhere.earth"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={captureStatus === "submitting"}
                      />
                      <button
                        type="submit"
                        className="n-btn n-btn-mint"
                        disabled={captureStatus === "submitting"}
                      >
                        {captureStatus === "submitting"
                          ? "Sending\u2026"
                          : "Send my report"}
                      </button>
                    </div>
                    <label className="n-capture-consent">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                      />
                      <span>
                        Yes, send me the weekly Orbit digest. I can unsubscribe
                        any Sunday.
                      </span>
                    </label>
                  </form>
                </>
              )}
            </div>
          </section>
        </>
      )}

      {/* ──────────────────────────────────────────────── FOOTER */}
      <footer className="n-footer">
        <div className="n-footer-inner">
          <span>
            Powered by <strong>The Carbon Almanac</strong>
          </span>
          <span className="n-footer-sep">&middot;</span>
          <span>
            Built by <strong>The Spaceship Academy</strong>
          </span>
        </div>
      </footer>
    </div>
  );
}
