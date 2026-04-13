"use client";

// Orbit v2 — OrbitExperience
//
// Client wrapper that orchestrates the Orbit experience.
//
// Default: dashboard-first. Everyone lands on the full data dashboard
// immediately. The quiz ("How heavy is your orbit?") is accessible via
// a CTA on the page — it's an opt-in learning experience, not a gate.
//
// When a visitor completes the quiz, they see the reveal screen (score,
// insight, swap lever, Almanac quote, Thrive Lab bridge), then return
// to the dashboard.

import { useState, useEffect } from "react";
import { QuizFlow, type QuizResult } from "./QuizFlow";
import { RevealScreen } from "./RevealScreen";

type Props = {
  children: React.ReactNode; // The full dashboard (server-rendered sections)
};

type Phase = "dashboard" | "quiz" | "reveal";

export function OrbitExperience({ children }: Props) {
  const [phase, setPhase] = useState<Phase>("dashboard");
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleStartQuiz() {
    setPhase("quiz");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleQuizComplete(result: QuizResult) {
    setQuizResult(result);
    setPhase("reveal");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleExplore() {
    setPhase("dashboard");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Don't render until client mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  if (phase === "quiz") {
    return <QuizFlow onComplete={handleQuizComplete} />;
  }

  if (phase === "reveal" && quizResult) {
    return <RevealScreen result={quizResult} onExplore={handleExplore} />;
  }

  // Dashboard phase — the default landing
  return (
    <>
      {children}
      {/* Floating quiz CTA — invites visitors to take the quiz */}
      <div className="quiz-cta-float">
        <button className="quiz-cta-btn" onClick={handleStartQuiz}>
          <span className="quiz-cta-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="quiz-cta-text">
            <strong>How heavy is your orbit?</strong>
            <span>Take the 2-minute quiz</span>
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </>
  );
}
