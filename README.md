# Job Agent — Phase 1 + 2 + 3 (Candidate Brain + Job Intelligence + Browser Agent)

Built on a machine without Docker/Ollama/Playwright's browser binaries;
intended to actually run on your 2nd system. Full architecture and roadmap:
[PROJECT_PLAN.md](./PROJECT_PLAN.md).

This Phase 3 work is on branch `phase-3-browser-agent` (not yet merged to
`main`) — see [Branches](#branches) below.

## What's here

- `apps/web` — Next.js dashboard: profile (upload/view/edit), jobs (paste a JD, see ranked matches, trigger an apply run), applications (status of apply runs)
- `apps/api` — NestJS API: profile CRUD + resume parsing, job ingestion + dedup + scoring, application tracking + BullMQ producer, Mongo storage — the only process that touches Mongo directly
- `apps/worker` — BullMQ consumer: runs the actual browser-automation fill for each apply request, reports results back to `apps/api` over HTTP
- `packages/shared` — shared TS types (`CandidateProfile`, `Job`, `MatchScore`, `Application`, `ApplyRunPayload`, ...) and the dedup-key util
- `packages/ai-engine` — Ollama client, model/host configurable via env
- `packages/profile-engine` — PDF text extraction + Ollama structuring call
- `packages/jd-parser` — job description text → structured requirements (Ollama)
- `packages/job-matcher` — candidate/job match scoring — **deterministic, not an LLM call**
- `packages/browser-agent` — Playwright session management, DOM-based field detection, **deterministic** green/yellow/red field classification (same "consequential decisions stay rule-based" principle as job-matcher), fill execution
- `packages/ats-adapters` — URL-pattern ATS detection (reporting only for now — see Known gaps)
- `packages/queue` — shared BullMQ queue name + Redis connection config, so `apps/api` (producer) and `apps/worker` (consumer) can't drift apart on either
- `infrastructure/docker/docker-compose.yml` — Mongo + Redis (Redis now actually used, by the apply-run queue)

## Required steps to run this on your 2nd system

1. **Clone the repo**
   ```
   git clone https://github.com/king-defender/job-finder.git
   cd job-finder
   git checkout phase-3-browser-agent
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
5. **Install Playwright's browser binary** (this downloads Chromium —
   ~150-300MB — deliberately not run on the machine this branch was built on):
   ```
   npx playwright install chromium
   ```
6. **Env files** — copy the examples and adjust only if your Ollama/Mongo/Redis
   aren't on default ports:
   ```
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.local.example apps/web/.env.local
   cp apps/worker/.env.example apps/worker/.env
   ```
7. **Run all three** (three terminals, from repo root):
   ```
   npm run dev:api
   npm run dev:web
   npm run dev:worker
   ```
8. Open `http://localhost:3000`, upload a PDF resume, confirm the parsed profile
   looks right, edit anything wrong, save. (Phase 1 exit criteria.)
9. Go to `/jobs`, paste a real job description you're considering, and check
   the score/recommendation against your own judgment. (Phase 2 exit criteria.)
10. On a job with a real posting URL, click **Apply (Copilot mode)**. Watch
    the worker's terminal — it should open a visible Chromium window, navigate
    to the posting, and fill what it recognizes. Go to `/applications` to see
    the run's status; once it says `needs review`, switch to the browser
    window the worker opened, check what got filled, fill in anything listed
    under "Needs your input" yourself, and submit it — the agent never submits
    on its own. (Phase 3 exit criteria.)

Everything here compiles and builds cleanly, but step 10 in particular is
genuinely unverified — this branch was written on a machine without
Playwright's browser binaries installed, so the DOM-walk field detection and
fill logic have never been run against a live page of any kind. Expect the
label-matching in `packages/browser-agent/src/classify.ts` to need real-world
tuning once you see what an actual ATS page's markup looks like.

## Branches

- `main` — Phase 1 + 2, verified-buildable
- `phase-3-browser-agent` — this work; merge to `main` once verified per step 10 above

## Pushing changes back

This repo is the shared source of truth now — `git pull` before starting work on
either machine, commit and `git push` when a change is ready, rather than copying
folders by hand.

## Known gaps (by design, not oversights)

- Only PDF resumes are accepted; DOCX support is a fast-follow.
- `experience`/`education` are view-only in the profile dashboard for now — only
  the top-level fields and skills are editable. Full nested-array editing lands
  when it's actually blocking use, not before.
- Job ingestion is manual paste only — no LinkedIn/Naukri/Indeed scraping yet,
  per PROJECT_PLAN.md's deliberate ordering (browser-automation reliability
  proven on one target first).
- Salary matching is a best-effort regex parse of free text, not guaranteed
  accurate — treat the salary sub-score as a rough signal, not ground truth.
- The fill run only auto-fills text/email/tel/textarea/file inputs.
  Select/checkbox/radio fields are always left for manual completion — filling
  those correctly needs the field's actual option set, which isn't handled yet.
- `ats-adapters` detects which ATS a posting uses (for the `atsDetected` label)
  but doesn't yet scope form-detection to an ATS-specific container — every
  ATS, Greenhouse included, gets the same whole-page generic scan for now.
- The review screenshot's path is shown as text in `/applications`, not
  rendered inline — there's no static-file-serving endpoint for it yet. The
  actual review happens in the live browser tab the worker leaves open, which
  is the primary mechanism; the screenshot is just an audit trail.
- Single-profile, single-user by design — this is a personal tool, not a
  multi-tenant app. No auth exists or is planned.
