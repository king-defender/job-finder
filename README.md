# Job Agent — Phase 1 (Candidate Brain)

Built on a machine without Docker/Ollama; intended to actually run on your 2nd
system. Full architecture and roadmap: [PROJECT_PLAN.md](./PROJECT_PLAN.md).

## What's here

- `apps/web` — Next.js dashboard: upload a resume, view/edit the parsed profile
- `apps/api` — NestJS API: resume parsing (via `packages/profile-engine`), profile CRUD, Mongo storage
- `packages/shared` — shared TS types (`CandidateProfile`, `Job`, `Application`, ...)
- `packages/ai-engine` — Ollama client, model/host configurable via env
- `packages/profile-engine` — PDF text extraction + Ollama structuring call
- `infrastructure/docker/docker-compose.yml` — Mongo + Redis (Redis unused until Phase 2's queue)

## Required steps to run this on your 2nd system

1. **Clone the repo**
   ```
   git clone https://github.com/king-defender/job-finder.git
   cd job-finder
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
   looks right, edit anything wrong, save.

Step 7 is Phase 1's exit criteria — once it works reliably, we move to Phase 2
(job intelligence / matching).

## Pushing changes back

This repo is the shared source of truth now — `git pull` before starting work on
either machine, commit and `git push` when a change is ready, rather than copying
folders by hand.

## Known Phase 1 gaps (by design, not oversights)

- Only PDF resumes are accepted; DOCX support is a fast-follow.
- `experience`/`education` are view-only in the dashboard for now — only the
  top-level fields and skills are editable. Full nested-array editing lands
  when it's actually blocking use, not before.
- Single-profile, single-user by design — this is a personal tool, not a
  multi-tenant app. No auth exists or is planned.
