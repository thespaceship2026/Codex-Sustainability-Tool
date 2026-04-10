"use client";

// Orbit v2 — EmailCapture
//
// Inline lead magnet form. Sits between the Perspective essay and the
// Thrive Lab course bridge. Posts to /api/capture, which writes a row
// to the EmailCapture table and fires the active sink (Notion in prod,
// noop locally unless env vars are set).
//
// Craig's product note: this is the soft ask. The hard CTA is the
// course bridge below it. Copy stays warm and educator-voiced, not
// marketing-voiced.

import { useState } from "react";

type Props = {
  signal?: number | null;
  monthlyTCO2e?: number | null;
  source?: string;
};

type Status = "idle" | "submitting" | "success" | "error";

export function EmailCapture({
  signal,
  monthlyTCO2e,
  source = "orbit_perspective"
}: Props) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(true);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting" || status === "success") return;

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Add an email so we know where to send the digest.");
      setStatus("error");
      return;
    }
    if (!consent) {
      setError("Tick the consent box so we know you want the digest.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setError(null);

    try {
      const res = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          source,
          signalAtCapture: typeof signal === "number" ? signal : undefined,
          monthlyTCO2e:
            typeof monthlyTCO2e === "number" ? monthlyTCO2e : undefined,
          consent
        })
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Something went wrong. Try again?");
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <aside className="capture capture-success" aria-live="polite">
        <div className="capture-kicker">
          <span className="dot" /> ORBIT DIGEST <span className="sep">·</span> SUBSCRIBED
        </div>
        <h3>You&rsquo;re on the list.</h3>
        <p>
          The next digest lands on Sunday. It&rsquo;ll show how your signal is
          moving, what one small thing is worth trying this week, and a short
          read we think is worth your time. Nothing else. If it ever feels
          like clutter, the unsubscribe link is in every email.
        </p>
      </aside>
    );
  }

  return (
    <aside className="capture" aria-labelledby="capture-title">
      <div className="capture-kicker">
        <span className="dot" /> ORBIT DIGEST <span className="sep">·</span> WEEKLY
      </div>

      <div className="capture-body">
        <div className="capture-lede">
          <h3 id="capture-title">
            Want the weekly read on how your orbit is moving?
          </h3>
          <p>
            One short email on Sundays. Your signal for the week, one thing
            worth trying, and one piece of writing we think is worth your
            time. No pitches, no 10-step plans, no guilt. You can leave any
            Sunday.
          </p>
        </div>

        <form className="capture-form" onSubmit={handleSubmit} noValidate>
          <label className="sr-only" htmlFor="capture-email">
            Email address
          </label>
          <div className="capture-row">
            <input
              id="capture-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@somewhere.earth"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === "error") {
                  setStatus("idle");
                  setError(null);
                }
              }}
              disabled={status === "submitting"}
              required
            />
            <button
              type="submit"
              className="btn btn-mint"
              disabled={status === "submitting"}
            >
              {status === "submitting" ? "Sending…" : "Send me the digest"}
            </button>
          </div>

          <label className="capture-consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              disabled={status === "submitting"}
            />
            <span>
              Yes, send me the weekly Orbit digest. I can unsubscribe any time.
            </span>
          </label>

          {status === "error" && error ? (
            <p className="capture-error" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      </div>
    </aside>
  );
}
