# Orbit v2 — Status & Handoff

**Branch:** `v2-orbit`
**Scope of this rewrite:** replace the legacy B2B sustainability dashboard
with Orbit, a consumer-facing climate-signal tool for young people
(ages 18–25). The app is a lead magnet for The Spaceship Academy's
Summer Leadership Institute at The Hun School of Princeton — and
specifically for the **Thrive Lab** course.

---

## What's in the branch

### Phase 1 — Scaffold (commit `5d4a1ae`)

A full replacement of the app's data model, design system, and render
tree. Everything that made it in:

**Data model (`prisma/schema.prisma`)**
`Traveller`, `MissionState`, `MissionAnswer`, `SignalSnapshot`,
`LogEntry`, `EmissionFactor`. Factors are versioned; every answer
captures a `factorSnapshot` JSON blob at write time so historical
scores stay reproducible even as factors are updated.

**Core logic (`lib/orbit/`)**

- `factors.ts` — sourced emission factor catalogue (UK DEFRA 2024,
  EPA eGRID, Poore & Nemecek, IEA, etc.) plus `FAIR_SHARE_TCO2E_YEAR`
  = 2.0 and `GLOBAL_AVG_TCO2E_YEAR` = 4.7 constants.
- `missions.ts` — four missions × ~30 total questions. Questions are
  typed: number, choice, or bool. Mission 01 defaults ACTIVE; the
  rest default LOCKED.
- `signal.ts` — piecewise 0–100 score (100 at fair share, 60 at
  global average, 20 at 2× global, 0 at 3× global) plus a +2 bonus
  per lit mission. Trajectory is computed by comparing the current
  monthly tCO₂e to the most recent `SignalSnapshot`.
- `types.ts` — framework-agnostic shared types for server → client
  handoff. No Prisma imports.
- `data.ts` — `loadOrbitSnapshot()` returns the full dashboard data
  object in one call.

**Design system**
`tailwind.config.ts` with the deep-navy / mint tokens, plus
`app/globals.css` with the sky atmosphere, UFO drift, orbital-ring
rotation, `.mcard` / `.starmap` / `.descent` / `.perspective`
component styles, button primitives, and reveal animations — all
lifted from the HTML prototype.

**Components (`components/orbit/`)**

- `SkyBackdrop` — deep-space gradient plus three drifting UFOs.
- `TopNav` — brand mark, mode switcher (SOLO / HOUSEHOLD / CLASSROOM),
  week stamp, CTA.
- `Hero` — the big "Your orbit, this week." headline with the signal
  card (score, trajectory pill, bar fill, delta row).
- `Starmap` — SVG with three orbital rings, a central pulsing "You"
  star, four mission nodes whose render state reflects LOCKED /
  ACTIVE / PARTIAL / LIT, plus the telemetry readout and
  `MissionCards` strip underneath.
- `Descent` — tCO₂e/mo ladder with You / Household / Campus / City
  rungs and a fair-share line.
- `Perspective` — editorial essay with drop cap + pullquote and the
  `#bridge` card linking to the Summer Leadership Institute page.
- `ObservationLog` — two-column ship's log with MISSION_PROGRESS,
  QUICK_LOG, INSIGHT, and SYSTEM entries.
- `MissionControlFooter` — telemetry row with version + mode +
  last sync.
- `Dock` — floating quicklog chips (Flight / Meal / Energy / Trip).

**App shell**
`app/layout.tsx` loads Satoshi, General Sans, Newsreader, and
JetBrains Mono, mounts the `SkyBackdrop` once, and renders the `Dock`
on every route. `app/page.tsx` is an async server component that
calls `loadOrbitSnapshot()` and composes the dashboard sections.

**Seed (`prisma/seed.ts`)**
Drops the `solo` demo traveller with a Week 14 scenario: Mission 01
LIT, Mission 02 ACTIVE at 58%, Mission 03 PARTIAL at 34%, Mission 04
LOCKED. Writes a previous `SignalSnapshot` so the trajectory shows
SETTLING rather than STEADY, and seeds a realistic observation log.

---

### Phase 2 — API routes and action layer (commit `7ba3631`)

The write path. Every mutation funnels through `lib/orbit/actions.ts`
so the routes stay thin.

**`lib/orbit/actions.ts`**

- `saveMissionAnswers(travellerId, missionKey, answers)` — upserts
  answers (writing a factor snapshot on each row), recomputes mission
  status + progress via `lib/orbit/progress.ts`, reruns the signal
  across every answer on file, upserts a `SignalSnapshot` for the
  current ISO week, and drops a `MISSION_PROGRESS` log entry the
  instant a mission transitions to LIT for the first time. Returns
  enough info for the client to re-render without a page reload.
- `activateMission(travellerId, missionKey)` — idempotent LOCKED →
  ACTIVE flip for the moment a user opens a mission.
- `quickLog(travellerId, input)` — writes a `QUICK_LOG` entry with
  default copy per chip kind.

**Routes**

- `POST /api/missions/[key]/answers` — accepts an array of answers,
  Zod-validates, returns `SaveAnswersResult`.
- `POST /api/missions/[key]/activate` — returns the current mission
  state row.
- `POST /api/log` — quick-log from the floating dock.
- `POST /api/signal/recalc` — returns a fresh signal + mission state
  without any writes. Useful after factor updates.

**Dock wiring**
`Dock.tsx` now actually posts to `/api/log`, shows a mint pulse on
success and a red border on failure, then calls `router.refresh()`
so the observation log picks up the new entry on its next render.

---

### Phase 3-4 — Mission form flows (commit `1d7049c`)

One dynamic route handles all four missions.

**`components/orbit/MissionForm.tsx`**
Shared, generic form renderer. Hydrates from prior answers, chunks
questions into steps of three with a dot nav, renders each question
using the typed `QuestionKind` union (number / choice / bool),
validates required questions on submit, POSTs the batch to the
answers route, and either bounces back to the dashboard or shows a
'Mission lit' celebration card when the server reports the write
pushed the mission to LIT for the first time. Reuses the existing
`btn-mint` / `btn-ghost` primitives.

**`app/missions/[key]/page.tsx`**
Server component. Resolves the mission by key (404s unknown),
activates it idempotently, loads every prior answer, and hands
everything to `<MissionForm />` along with the current signal.

**Starmap wiring**
Mission cards now link to `/missions/[key]` whenever the mission is
not LOCKED. Locked missions still fall through to an in-page anchor.

**Styles**
~210 lines of new CSS: mission-page container, stepped form layout,
question field cards with backdrop blur, number input with large
Satoshi numerals + mono unit label, pill-style radio groups with
mint glow on selection, celebration card with mint gradient border,
responsive tweaks.

---

## How to run it locally

```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Then open `http://localhost:3000`.

To sanity-check the database after a seed: `npm run db:doctor`.

---

## What's intentionally not built yet

- **Onboarding flow.** A new traveller currently drops straight into
  the dashboard. There's no welcome screen, no name prompt, no
  classroom/household picker. Solo mode is the only path that works.
- **Auth.** Everything runs against the hardcoded `solo` handle.
  Multi-user is out of scope for v2.
- **Mode switcher persistence.** The SOLO / HOUSEHOLD / CLASSROOM
  tabs in the TopNav are presentational — they don't yet write back
  to the Traveller row.
- **Email capture for the lead magnet.** The course bridge in
  `Perspective.tsx` links to the Hun School page but doesn't capture
  an email before handing off. This is the single highest-leverage
  thing to add before launch.
- **Analytics / tracking.** No PostHog, no Plausible, no Netlify
  Analytics hookup yet.
- **Tests.** `tests/emissions.test.ts` from v1 was removed with the
  legacy code. New unit tests for `calculateSignal()` and
  `saveMissionAnswers()` should land before the first public push.

---

## Things worth deciding before merge to `main`

1. **Email capture placement.** Inline under the Perspective section?
   A gate before mission 01? A subtle dock-level chip? My hunch is
   inline under Perspective — the reader is already in "what's this
   for me" mode when they arrive there.
2. **Copy pass.** The current mission descriptions and log entry
   copy is first-draft. A run through `craigs-writing-style` would
   tighten them without losing the warm-educator tone.
3. **Live deploy target.** `netlify.toml` still references the v1
   read-only demo mode. Needs a new build command (`prisma generate
   && prisma db push && prisma db seed && next build`) and an
   explicit decision about whether the deployed version should be
   read-only or accept writes into a per-session SQLite file.
4. **Thrive Lab course bridge.** Right now it's one card at the
   bottom of Perspective. Does Craig want a second, more direct
   "your orbit suggests Thrive Lab could help here" nudge that
   references the user's actual score or mission state?
5. **Data retention.** How long should a traveller's data live?
   SQLite on disk is fine for a single-user demo but a public lead
   magnet will need an expiration policy.

---

## Next milestones (post-merge)

1. **Email capture + webhook to a CRM** — the actual lead magnet bit.
2. **Unit tests** for `calculateSignal()` covering the piecewise
   score boundaries and the trajectory classifier, plus tests for
   `saveMissionAnswers()` covering mission-lit transitions and log
   entry creation.
3. **Copy pass** through `craigs-writing-style`.
4. **Netlify build config** for a working public deploy.
5. **Classroom mode stub** — the schema already carries `mode`, so
   this is mostly a UI switch and a story for how a teacher would
   invite students.
