# Job Agent — Phase 1 + 2 (Candidate Brain + Job Intelligence)

Built on a machine without Docker/Ollama; intended to actually run on your 2nd
system. Full architecture and roadmap: [PROJECT_PLAN.md](./PROJECT_PLAN.md).

This Phase 2 work is on branch `phase-2-job-intelligence` (not yet merged to
`main`) — see [Branches](#branches) below.

## What's here

- `apps/web` — Next.js dashboard: profile (upload/view/edit) + jobs (paste a JD, see ranked matches)
- `apps/api` — NestJS API: profile CRUD + resume parsing, job ingestion + dedup + scoring, Mongo storage
- `packages/shared` — shared TS types (`CandidateProfile`, `Job`, `MatchScore`, `Application`, ...) and the dedup-key util
- `packages/ai-engine` — Ollama client, model/host configurable via env
- `packages/profile-engine` — PDF text extraction + Ollama structuring call
- `packages/jd-parser` — job description text → structured requirements (Ollama)
- `packages/job-matcher` — candidate/job match scoring — **deterministic, not an LLM call** (see PROJECT_PLAN.md §2 on why consequential scoring/classification stays rule-based)
- `infrastructure/docker/docker-compose.yml` — Mongo + Redis (Redis still unused — nothing async enough yet to need the queue)

## Required steps to run this on your 2nd system

1. **Clone the repo**
   ```
   git clone https://github.com/king-defender/job-finder.git
   cd job-finder
   git checkout phase-2-job-intelligence
   ```
2. **Start infra**
   ```
   cd infrastructure/docker
   docker compose up -d
   cd ../..
   ```
3. **Pull the model** (see [PROJECT_PLAN.md](./PROJECT_PLAN.md) §13 for why Qwen3 8B
   was picked for a 6GB-VRAM GPU — don't reach for a larger variant):
   ```
   ollama pull qwen3:8b
   ```
4. **Install dependencies** (from repo root — this regenerates `node_modules/`,
   which is gitignored and never pushed):
   ```
   npm install
   ```
5. **Env files** — copy the examples and adjust only if your Ollama/Mongo aren't
   on default ports:
   ```
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.local.example apps/web/.env.local
   ```
6. **Run both apps** (two terminals, from repo root):
   ```
   npm run dev:api
   npm run dev:web
   ```
7. Open `http://localhost:3000`, upload a PDF resume, confirm the parsed profile
   looks right, edit anything wrong, save. (Phase 1 exit criteria.)
8. Go to `http://localhost:3000/jobs`, paste a real job description you're
   considering, and check the score/recommendation against your own judgment.
   (Phase 2 exit criteria.)

Everything here compiles and builds cleanly, but it was written on a machine
without Ollama/Docker — steps 7 and 8 are the actual verification, not the
build passing. If the JD parser or scorer produces something clearly wrong on
real jobs, that's expected to need tuning once you can see real output.

## Branches

- `main` — Phase 1 only, verified-buildable
- `phase-2-job-intelligence` — this work; merge to `main` once verified on
  real jobs per step 8 above

## Pushing changes back

This repo is the shared source of truth now — `git pull` before starting work on
either machine, commit and `git push` when a change is ready, rather than copying
folders by hand.

## Known gaps (by design, not oversights)

- Only PDF resumes are accepted; DOCX support is a fast-follow.
- `experience`/`education` are view-only in the profile dashboard for now — only
  the top-level fields and skills are editable. Full nested-array editing lands
  when it's actually blocking use, not before.
- Job ingestion is manual paste only — no LinkedIn/Naukri/Indeed scraping yet.
  Per PROJECT_PLAN.md, that's deliberately deferred until the browser-automation
  and human-in-the-loop phases (3-4) are proven on one well-behaved ATS first.
- Salary matching is a best-effort regex parse of free text (see
  `packages/job-matcher/src/salary.ts`), not guaranteed accurate — treat the
  salary sub-score as a rough signal, not ground truth.
- Single-profile, single-user by design — this is a personal tool, not a
  multi-tenant app. No auth exists or is planned.
