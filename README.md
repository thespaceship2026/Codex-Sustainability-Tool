# Sustainability Tracker

Sustainability Tracker is a local-first web app for small businesses that want a simple way to record monthly environmental metrics, see emissions trends, set improvement goals, and get practical next-step recommendations.

It is designed for a founder or small operations team who wants one place to answer questions like:

- How are our emissions trending month to month?
- Which category is driving the most impact right now?
- Are we on track against our sustainability goals?
- Can we import or export our data without relying on a paid tool?

## What The App Does

Each month, you can record:

- Electricity usage
- Water usage
- Waste generated
- Recycling amount
- Business travel distance
- Employee commuting distance
- Optional notes

The app then:

- Calculates total emissions using editable local emission factors
- Shows KPIs and charts on a dashboard
- Tracks goals by category
- Generates rules-based recommendations from the largest emission sources
- Imports and exports CSV locally

## Features

- Dashboard with KPI cards, trend chart, category chart, and recommendation highlight
- Monthly create and edit flow for sustainability records
- Editable emission factors stored in SQLite
- Goal tracking with progress bars and on-track/off-track status
- Rules-based recommendations with no AI API
- CSV export, CSV import validation, and sample CSV template download
- 12 months of realistic demo seed data
- Mobile-friendly responsive UI

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Prisma
- SQLite
- Local route handlers and local calculation utilities
- No paid APIs, no hosted auth, no external AI dependency

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create your environment file

```bash
cp .env.example .env
```

### 3. Create the local database and Prisma client

```bash
npm run db:generate
npm run db:migrate
```

### 4. Seed demo data

```bash
npm run db:seed
```

### 5. Start the app

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Database Setup

This app uses SQLite for local development.

- Database file: `prisma/dev.db`
- Prisma schema: [`prisma/schema.prisma`](/Users/craigvezina/Documents/Codex/prisma/schema.prisma)
- Seed script: [`prisma/seed.ts`](/Users/craigvezina/Documents/Codex/prisma/seed.ts)

If you want a fresh demo database:

```bash
npm run db:reset
```

### Backup your database

```bash
npm run db:backup
```

This creates a timestamped copy in the `backups/` folder.

### Restore from a backup

Restore the latest backup:

```bash
npm run db:restore
```

Restore a specific backup:

```bash
npm run db:restore -- --file backups/your-backup-file.db
```

The restore script creates a safety backup of your current database before replacing it.

### Check database health

```bash
npm run db:doctor
```

This checks for:

- missing current factors
- duplicate current factors
- metrics missing factor snapshots
- duplicate month records

## Seed Command

```bash
npm run db:seed
```

The seed creates:

- 1 demo organization
- 1 demo user
- 12 months of monthly metrics
- Default emission factors
- Goal examples for each category
- Recommendation rules for key categories

## How To Edit Emission Factors

1. Open the **Settings** page.
2. Find the **Emission factors** section.
3. Update the factor values, labels, units, or descriptions.
4. Click **Save factors**.

Changes are stored locally in SQLite and used immediately in future calculations.
If a factor changes, the app creates a new factor version instead of overwriting the old one.
You can review factor history in the Settings page.

## How To Import And Export CSV

### Export

1. Go to **Settings**.
2. In **CSV import and export**, click **Export CSV**.

This downloads all monthly metrics as a CSV file.

### Download a template

1. Go to **Settings**.
2. Click **Download sample template**.

This gives you a starter CSV with the correct headers.

### Import

1. Open the sample template or exported CSV.
2. Add or edit rows.
3. Paste the CSV into the import box in **Settings**.
4. Click **Import CSV**.

The import summary will tell you:

- how many rows were imported
- how many rows are new
- how many rows will overwrite existing months
- how many rows were skipped
- which rows were invalid and why

Use **Preview import** before applying changes if you want to check overwrites first.

## Calculation Logic

The calculation module lives in [`lib/emissions.ts`](/Users/craigvezina/Documents/Codex/lib/emissions.ts).

Formulas:

- Electricity emissions = `electricityKwh * electricity factor`
- Water emissions = `waterM3 * water factor`
- Waste emissions = `wasteKg * waste factor`
- Recycling emissions = `recyclingKg * recycling factor * -1`
- Business travel emissions = `businessTravelKm * business travel factor`
- Commuting emissions = `commutingKm * commuting factor`

Recycling is treated as an avoided-emissions credit, so it reduces the total.

## Tests

The formula tests live in [`tests/emissions.test.ts`](/Users/craigvezina/Documents/Codex/tests/emissions.test.ts).

Run them with:

```bash
npm test
```

## Netlify Deployment

This app can be deployed to Netlify as a public demo.

Important:

- The deployed Netlify version is intentionally read-only.
- Your seeded SQLite data is bundled for viewing.
- Editing metrics, goals, factors, or importing CSV should be done in your local app.

This keeps the public demo honest and avoids silent data loss from a non-durable server filesystem.

### Before you deploy

Make sure the local demo database is prepared:

```bash
npm install
npm run db:generate
npm run db:reset
npm run build
```

### Deploy steps

1. Push this repository to GitHub.
2. In Netlify, choose **Add new site** and import the GitHub repository.
3. Use these settings:
   - Build command: `npm run build`
   - Publish directory: leave blank for the Next.js adapter
4. Deploy the site.

The repository already includes [`netlify.toml`](/Users/craigvezina/Documents/Codex/netlify.toml), which:

- enables read-only demo mode in the UI
- bundles `prisma/dev.db` with the deployed functions

### What the public demo can do

- Show dashboard charts and KPIs
- Show seeded monthly records
- Show goals, recommendations, factor history, audit history, and data health
- Export CSV

### What the public demo will not do

- Save monthly entry changes
- Edit goals
- Edit emission factors
- Import CSV

If you need full write support, run the app locally or move to a hosting setup with durable disk or a proper persistent database layer.

## Free Deployment Options

This MVP is built to run locally first. For a free deployment, the simplest options are:

### Option 1: Vercel hobby plan

- Good for quickly sharing the app
- You will likely want to switch from SQLite to a persistent database for real shared hosting later
- Best for demos, not long-term multi-user production data storage

### Option 2: Render free web service

- Possible for demos
- SQLite persistence needs extra care and is not ideal for long-term hosted usage

### Option 3: Self-host on a small VPS later

- Best path if you want to keep full control
- You can still stay fully open-source and avoid paid SaaS lock-in

For now, the strongest path is:

1. Run locally
2. Validate the workflow
3. Decide later whether to keep SQLite or move to Postgres on your own terms

## Troubleshooting

### Prisma client errors

Run:

```bash
npm run db:generate
```

### Database looks out of sync

Run:

```bash
npm run db:reset
```

### Want a manual backup before experimenting

Run:

```bash
npm run db:backup
```

### Build or type issues after dependency install

Run:

```bash
npm run lint
npm test
npm run build
```

### Seed failed

Make sure:

- `.env` exists
- `DATABASE_URL="file:./dev.db"` is present
- you ran `npm run db:push` before `npm run db:seed`

## Known Limitations

- This MVP assumes a single local organization context and no full authentication flow
- Recommendation logic is deterministic and rules-based, not personalized AI
- SQLite is ideal for local use and demos, but not a long-term hosted multi-user production database
- CSV import currently uses paste-in workflow rather than file upload
- Audit logs are stored locally for metrics, goals, and factor changes, but there is not yet a founder-facing audit history page

## Project Structure

High-value files:

- [`app/page.tsx`](/Users/craigvezina/Documents/Codex/app/page.tsx) — dashboard
- [`app/entry/page.tsx`](/Users/craigvezina/Documents/Codex/app/entry/page.tsx) — monthly create/edit flow
- [`app/goals/page.tsx`](/Users/craigvezina/Documents/Codex/app/goals/page.tsx) — goal tracking
- [`app/recommendations/page.tsx`](/Users/craigvezina/Documents/Codex/app/recommendations/page.tsx) — rules-based recommendations
- [`app/settings/page.tsx`](/Users/craigvezina/Documents/Codex/app/settings/page.tsx) — emission factors and CSV tools
- [`app/api/metrics/route.ts`](/Users/craigvezina/Documents/Codex/app/api/metrics/route.ts) — save monthly metrics
- [`app/api/import/route.ts`](/Users/craigvezina/Documents/Codex/app/api/import/route.ts) — CSV import
- [`app/api/export/csv/route.ts`](/Users/craigvezina/Documents/Codex/app/api/export/csv/route.ts) — CSV export
- [`lib/emissions.ts`](/Users/craigvezina/Documents/Codex/lib/emissions.ts) — emissions calculation engine
- [`lib/csv.ts`](/Users/craigvezina/Documents/Codex/lib/csv.ts) — CSV parsing and formatting
- [`prisma/schema.prisma`](/Users/craigvezina/Documents/Codex/prisma/schema.prisma) — database schema
- [`prisma/seed.ts`](/Users/craigvezina/Documents/Codex/prisma/seed.ts) — demo data seed

## Final Note

This app does not depend on paid services, hosted AI, or paid SaaS tooling. Once dependencies are installed, it is designed to run fully locally with local data storage.
