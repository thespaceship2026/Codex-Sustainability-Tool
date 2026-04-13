"use client";

// Orbit v2 — OrbitExperience
//
// Client wrapper that orchestrates the three phases of the Orbit experience:
//
//   1. Quiz — five questions, builds signal from scratch
//   2. Reveal — animated score, insight, email capture, Thrive Lab bridge
//   3. Dashboard — the full data dashboard (server-rendered, passed as children)
//
// First-time visitors start at the quiz. Once they complete the reveal
// (either by capturing email or skipping), they see the full dashboard.
// A localStorage flag remembers returning visitors and sends them straight
// to the dashboard.

import { useState, useEffect } from "react";
import { QuizFlow, type QuizResult } from "./QuizFlow";
import { RevealScreen } from "./RevealScreen";

type Props = {
  children: React.ReactNode; // The full dashboard (server-rendered sections)
};

type Phase = "quiz" | "reveal" | "dashboard";

export function OrbitExperience({ children }: Props) {
  const [phase, setPhase] = useState<Phase>("quiz");
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [mounted, setMounted] = useState(false);

  // Check if returning visitor (avoid hydration mismatch by deferring to useEffect)
  useEffect(() => {
    setMounted(true);
    try {
      // Use sessionStorage instead of localStorage (more ephemeral, right for a lead magnet)
      if (sessionStorage.getItem("orbit_seen") === "1") {
        setPhase("dashboard");
      }
    } catch {
      // Private browsing or storage blocked — start fresh
    }
  }, []);

  function handleQuizComplete(result: QuizResult) {
    setQuizResult(result);
    setPhase("reveal");
    // Scroll to top for the reveal
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleExplore() {
    setPhase("dashboard");
    try {
      sessionStorage.setItem("orbit_seen", "1");
    } catch {
      // Ignore storage errors
    }
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

  // Dashboard phase — render the server-rendered children plus a re-entry
  // link to retake the quiz
  return (
    <>
      {children}
    </>
  );
}
