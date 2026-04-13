"use client";

// Orbit v2 — FactCard
//
// A learning moment that appears between quiz questions. After the user
// picks an answer, instead of jumping straight to the next question,
// the FactCard slides in with a surprising, relevant fact from The
// Carbon Almanac. Tap "Continue" to advance.
//
// Design goals:
//   - Feels like a reward, not a lecture
//   - Short enough to read in 4 seconds
//   - Non-judgmental — curiosity, not guilt
//   - Carbon Almanac branding (partner credit)

import type { AlmanacFact } from "@/lib/orbit/almanac-facts";

type Props = {
  fact: AlmanacFact;
  questionIndex: number;
  totalQuestions: number;
  onContinue: () => void;
};

const CATEGORY_ICONS: Record<string, string> = {
  energy: "⚡",
  transport: "✈️",
  food: "🌱",
  digital: "💻",
  systems: "🌍",
};

export function FactCard({ fact, questionIndex, totalQuestions, onContinue }: Props) {
  return (
    <div className="fact-card" role="complementary" aria-label="Did you know?">
      {/* Category badge */}
      <div className="fact-badge">
        <span className="fact-badge-icon">{CATEGORY_ICONS[fact.category] ?? "🌍"}</span>
        <span className="fact-badge-label">DID YOU KNOW?</span>
      </div>

      {/* Headline */}
      <h3 className="fact-headline">{fact.headline}</h3>

      {/* Body */}
      <p className="fact-body">{fact.body}</p>

      {/* Optional quote */}
      {fact.quote && (
        <blockquote className="fact-quote">
          <p>&ldquo;{fact.quote.text}&rdquo;</p>
          <cite>— {fact.quote.attribution}</cite>
        </blockquote>
      )}

      {/* Almanac credit */}
      <div className="fact-source">
        <span className="fact-source-book">📖 The Carbon Almanac</span>
        <span className="fact-source-partner">Partner of The Spaceship Academy</span>
      </div>

      {/* Continue button */}
      <button className="btn btn-mint fact-continue" onClick={onContinue}>
        {questionIndex < totalQuestions - 1 ? "Next question" : "See your results"}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Progress dots */}
      <div className="fact-dots" aria-hidden="true">
        {Array.from({ length: totalQuestions }).map((_, i) => (
          <span
            key={i}
            className={`fact-dot ${i <= questionIndex ? "filled" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
