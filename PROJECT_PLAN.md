# Job Application Agent — Project Plan

## 1. Vision

A personal system that discovers relevant job postings, scores them against your
profile, fills out applications (including arbitrary ATS forms), asks you when it
hits information it doesn't have, and tracks every application through to outcome —
eventually feeding results back into a strategy layer ("React roles convert 3x
better than Webflow roles for you").

Not a blind auto-clicker. A copilot that becomes more autonomous as it earns trust.

## 2. Guiding principles

- **Single source of truth**: one structured Candidate Profile, not "the resume PDF."
  Resumes/cover letters are *generated from* the profile, not the other way round.
- **No password storage**: automation operates inside a browser session you log
  into yourself (Playwright persistent context), never stores platform credentials.
- **Never guess on consequential questions**: legal declarations, work authorization,
  disability/veteran status, criminal history — always human-confirmed, every time,
  even if answered before.
- **Red-question classification is deterministic, not an LLM judgment call**: whether
  a question is legal/work-authorization/disability/criminal-history is decided by a
  keyword/regex ruleset, local or hosted model alike. The LLM may help recognize
  phrasing variants, but the ruleset is authoritative — if the two disagree, default
  to asking you.
- **Trust is earned, not assumed**: system starts in Copilot mode (fills, you click
  submit) and only graduates to auto-submit for a narrow, explicitly-configured slice
  of applications once you've validated its judgment.
- **A circuit breaker sits above the per-application gates**: match-score and
  known-answer thresholds decide whether *one* application is safe to auto-submit;
  they don't protect against a scoring bug or bad field-mapping regression firing
  correctly-gated-but-wrong applications repeatedly. Any unattended run auto-stops
  after N submissions (or after any anomaly) and waits for you, regardless of how
  well each individual application scored.
- **Outreach is always human-sent**: the agent may draft a recruiter email; it never
  sends one on its own, in any mode, indefinitely — not just during a trust-building
  period. Sending is an irreversible action under your name to a real person.
- **Generic form understanding over per-site scripts**: one DOM/accessibility-tree
  based form engine with ATS-specific adapters as a thin layer on top, not bespoke
  automation per company.
- **Respect platform ToS and rate limits**: this automates *your own* browser session
  for *your own* applications — not scraping at volume or evading bot detection.
  Expect LinkedIn/Naukri/Indeed to be the most fragile and rate-limit-sensitive
  targets; company ATS pages (Greenhouse, Lever, etc.) are lower-risk.

## 3. Architecture overview

```
                    Scheduler (BullMQ repeatable jobs)
                                │
                                ▼
Candidate Profile ──┐   Job Discovery → JD Parsing → Match Scoring → Apply Decision
                     │                                                     │
                     ▼                                                     ▼
                                                        Browser Agent (Playwright)
                                                        ├─ ATS detection
                                                        ├─ Form understanding (DOM + a11y tree)
                                                        ├─ Field mapping → profile
                                                        ├─ Missing-info → ask user, save to Answer Memory
                                                        └─ Fill → validate → submit (per current Mode)
                                                                     │
                                          ┌──────────────────────────┼─────────────────────────┐
                                          ▼                          ▼                          ▼
                              Application Tracker + Analytics   Notifications (you)   Outreach drafts (never auto-sent)
```

## 4. Component map

The system is several components working together — "agent" is the orchestration
logic that decides what to do next, not the whole application.

| Conceptual component | Where it lives |
|---|---|
| Scheduler ("run at 7am") | BullMQ repeatable jobs in `apps/worker` |
| AI/LLM (reasoning) | `packages/ai-engine` |
| Browser automation (actuation) | `packages/browser-agent` + `packages/ats-adapters` |
| Database (memory) | MongoDB, typed via `packages/shared` |
| Queue/worker (reliable execution) | `apps/worker` (BullMQ) |
| Dashboard (control) | `apps/web` |
| Agent (decides what to do next) | orchestration logic inside `apps/worker`, calling job-matcher → form-engine → ats-adapters in sequence |
| Notifications | `packages/notifications` (new — see §10) |

## 5. Tech stack

TypeScript monorepo (Turborepo or Nx):

| Layer | Choice | Why |
|---|---|---|
| Dashboard | Next.js + Tailwind + shadcn/ui | Fast to build, good for a data-dense review UI |
| API | NestJS | Structured modules map cleanly to the domain (profile, jobs, applications) |
| DB | MongoDB | Job postings/answers are semi-structured; schema will shift early on |
| Queue | Redis + BullMQ | Job discovery, JD parsing, and browser-apply runs are all async workloads |
| Browser automation | Playwright (persistent context) | Real DOM + a11y tree access, handles JS-heavy ATS pages |
| AI | Ollama (local inference), model configurable via env — start with Qwen3 | JD parsing, form-field understanding, resume tailoring; resume/salary/answers never leave your machine |
| File storage | S3-compatible (or local disk for MVP) | Resumes, generated cover letters, screenshots for audit |
| Notifications | Transactional email (e.g. Resend/SES) | Daily digest + "needs your input" alerts |

Kept as proposed — solo tool today, but the module boundaries (profile-engine,
job-matcher, form-engine, ats-adapters) pay off the moment this needs to survive
you not touching it for a month, and NestJS/Mongo/BullMQ are cheap to self-host.

`ai-engine` talks to Ollama over its local HTTP API and stays provider-agnostic
(`AI_PROVIDER=ollama`, `AI_MODEL=qwen3`), so switching models — or falling back to
a hosted model for a specific task the local model handles poorly — is a config
change, not a rewrite. Start with one model end-to-end; don't split into a
fast/reasoning/embedding tier setup until Phase 3 usage shows an actual bottleneck
to optimize for.

## 6. Repo layout

```
job-agent/
├── apps/
│   ├── web/          # Next.js dashboard
│   ├── api/           # NestJS API
│   └── worker/         # BullMQ workers + scheduler + orchestration
├── packages/
│   ├── profile-engine/   # Candidate profile CRUD + resume parsing
│   ├── jd-parser/         # JD → structured requirements (AI)
│   ├── job-matcher/       # Scoring engine
│   ├── form-engine/       # DOM/a11y-tree field understanding + mapping
│   ├── browser-agent/     # Playwright session mgmt, navigation, fill/submit
│   ├── ats-adapters/       # Greenhouse/Lever/Workday/Ashby adapters + generic fallback
│   ├── ai-engine/          # Ollama client + prompts; provider-agnostic, model set via env
│   ├── notifications/      # Digest/alert emails, recruiter-outreach drafting (send always manual)
│   └── shared/             # Types shared across packages (Profile, Job, Application, Answer)
└── infrastructure/
    └── docker/            # Mongo, Redis, docker-compose for local dev
```

## 7. Core data model (v1)

- **CandidateProfile**: personal, professional (experience, current role, notice
  period, CTC), skills[], experience[], education[], links, documents (resume,
  cover letters), preferences (locations, remote, salary floor).
- **Job**: title, company, location, remote, salary, description, parsed
  requirements, source, url, application_url, posted_date, dedup_key.
- **Application**: job ref, resume version used, cover letter, match score,
  answers[], status (discovered → matched → ready → applying → applied →
  assessment → interview → offer → rejected), timestamps, notes.
- **AnswerMemory**: question (normalized) → answer, classification
  (green/yellow/red), last_confirmed_at. Red-classified questions are never
  auto-filled from memory — always re-asked.
- **OutreachDraft**: recipient, generated message, related job/application,
  status (drafted → approved → sent), always requires manual `approved → sent`
  transition — no code path sends without it.

## 8. Question policy engine

| Class | Examples | Behavior |
|---|---|---|
| Green | name, email, phone, links, skills, experience, education | Auto-fill from profile, no confirmation |
| Yellow | expected salary, relocation, notice period, remote pref | Auto-fill from configured preference, shown in review queue before submit |
| Red | work authorization, legal declarations, disability/veteran status, criminal history | Always pauses and asks, every application, never cached |

## 9. Application modes

1. **Copilot** (default, and where the project starts and stays for a while): agent
   fills the form, you review and hit submit yourself.
2. **Controlled auto-apply**: auto-submits only when match > 85%, zero unknown
   questions, zero red-flag questions, no CAPTCHA — subject to the circuit breaker
   in §2 on any unattended/scheduled run.
3. **Full auto**: only after Copilot/Controlled modes have run long enough that
   you trust the answer memory and scoring — not built until 1 and 2 are proven.

Note: even Full auto never extends to sending recruiter outreach (§2, §10) — that
stays manual-send permanently, independent of which application mode is active.

## 10. Communication module

Two capabilities that look similar but carry very different risk, kept as
separate code paths:

- **Notify you** (low risk): daily digest ("12 applications submitted today"),
  and real-time "needs your input" alerts. Straightforward to automate fully —
  it's a delivery channel next to the dashboard's review queue, not an action
  taken on your behalf toward a third party.
- **Recruiter/company outreach** (high risk): the agent may identify a contact
  and draft a personalized message, but sending is always a manual click, in
  every mode, permanently — not something that graduates to autonomous as trust
  builds. Treated like a Red-classified question: draft, never auto-submit.

## 11. Phased roadmap

### Phase 1 — Candidate Brain (foundation) — scaffolded, pending real-machine verification
- Monorepo scaffold, docker-compose (Mongo + Redis)
- Resume upload + parsing → structured CandidateProfile
- Profile CRUD UI (skills, experience, preferences)
- Answer Memory store (schema only, empty at first)
- **Exit criteria**: you can upload a resume and see an accurate structured profile in the dashboard.
  Code is in `main`; not yet run against real Docker/Ollama (built on a machine
  without them) — verify this on the 2nd system before trusting it.

### Phase 2 — Job Intelligence — scaffolded, pending real-machine verification
- Job ingestion via manually-pasted JD (title/company/location/salary/description
  form) — LinkedIn/Naukri/Indeed scraping intentionally deferred, per the note
  below the roadmap
- JD parser (Ollama) → structured `JobRequirements` (skills/experience/seniority)
- Dedup logic — deterministic `title+company+location` key, not fuzzy/semantic
- Match scoring engine (deterministic, not an LLM call — see `job-matcher`) +
  APPLY/SKIP recommendation, weighted skill 40% / experience 25% / location 20%
  / salary 15%
- **Exit criteria**: pasting/importing a batch of jobs produces ranked, scored
  recommendations you agree with on spot-check. Same caveat as Phase 1 — needs
  verification against a real Ollama instance, since scoring quality depends
  entirely on the JD parser's actual output, not just the code compiling.

### Phase 3 — Browser Application Agent — scaffolded, pending real-machine verification
- Playwright persistent-context session (manual login, agent reuses session);
  one long-lived context per worker process, each apply-run gets its own tab
  rather than its own context — a persistent context locks its user-data-dir,
  so a second one on the same dir fails to launch while a prior run's browser
  is still open for review
- Generic form-engine: DOM walk → field label detection → deterministic
  green/yellow/red classification (keyword rules, not an LLM call — same
  principle as the Red-question policy in §2) → profile mapping → fill
- Text-like fields only (text/email/tel/textarea/file) are auto-filled;
  select/checkbox/radio are deliberately left for the human — answering those
  correctly needs the actual option set, which is a harder, separate problem
  not tackled yet
- ATS detection (`ats-adapters`) is URL-pattern-only for now, used for
  reporting (`Application.atsDetected`), not to scope field detection — no
  adapter-specific selector has been verified against a real posting yet, and
  a guessed one that doesn't match would silently return zero fields, which
  is worse than scanning the whole page
- `apps/worker`: BullMQ consumer, talks to `apps/api` over HTTP for Job/
  Profile reads and Application writes rather than touching Mongo directly —
  keeps `apps/api` as the single owner of persistence
- Application record written on every attempt, including failures (status
  `failed` with `errorMessage`) and successful-but-incomplete fills (status
  `needs_review` with `unmappedFields`) — a run that only partly fills the
  form still leaves useful state, not silence
- **Exit criteria**: agent correctly fills a real Greenhouse application
  end-to-end in Copilot mode. Not yet verified — this was built on a machine
  without Playwright's browser binaries installed (`npx playwright install
  chromium` is a real file download, deliberately left as a 2nd-system setup
  step rather than run here — see README). Code compiles and the queue/API
  wiring is exercised by typecheck and Nest/Next builds, but the actual
  DOM-walk field detection and fill logic have not been run against a live
  page of any kind yet.

### Phase 4 — Human-in-the-loop
- Missing-info modal (blocks fill, waits for your answer)
- Answer Memory writes (green/yellow only) + red-question re-ask logic
- CAPTCHA/MFA pause-and-resume
- Review queue in dashboard ("Needs your input")
- Notification emails (digest + alerts)
- **Exit criteria**: a form with 2-3 unknown questions pauses correctly, you answer once, and equivalent questions on a later application reuse yellow/green answers but still re-ask red ones.

### Phase 5 — Scale out + auto-apply
- Additional ATS adapters (Lever, Workday, Ashby, generic fallback)
- Controlled auto-apply mode (thresholds above) + circuit breaker enforcement
- Resume/cover-letter tailoring per job
- Application tracker analytics (response rates by role/skill/location)
- Recruiter-outreach drafting (manual-send only)
- **Exit criteria**: a week of Controlled auto-apply runs with zero bad submissions and the circuit breaker never needing to fire.

### Phase 6 — Scheduled autonomy + deployment
- Scheduler-driven unattended runs (the "wake up to N applications" scenario) —
  only enabled once Phase 5's exit criteria hold for a sustained period
- Move from local execution to a server: encrypt stored browser-session auth
  state at rest, restrict access to it like any other credential
- Monitor for elevated bot-detection friction from datacenter IPs vs. the home
  connection it worked from during Phases 1-5; slow down or fall back to
  interactive-only if platforms start challenging the automation more
- **Exit criteria**: a full week of unattended cloud runs with no account
  restrictions, no circuit-breaker trips, and digest emails you don't have to
  double-check against the dashboard.

Do not start Phase 2's LinkedIn/Naukri/Indeed scraping until Phase 3-4 are solid
on a single well-behaved ATS — that's where the real complexity (and risk) lives,
and it's cheaper to debug against one predictable target first.

## 12. Key risks

- **Platform ToS / account risk**: automating LinkedIn/Naukri/Indeed UI can trigger
  bot detection and risks account restriction. Mitigate by keeping volume low,
  human-paced, and never bypassing CAPTCHA/verification (pause-and-hand-off only).
- **Silent misfilling**: a wrong auto-filled answer (e.g. salary, experience years)
  submitted without review is worse than no application. Copilot-first mode and the
  red-question policy exist specifically to prevent this.
- **Resume fabrication**: tailoring must reorder/emphasize real experience only —
  never invent skills or history not in the profile.
- **ATS DOM drift**: adapters will break when vendors change markup. The generic
  a11y-tree fallback exists so a broken adapter degrades to "ask for review" rather
  than silently failing.
- **Unattended-run blast radius**: a bug that passes every per-application gate can
  still repeat itself across a whole overnight run. The circuit breaker (§2) is the
  mitigation — without it, "controlled" auto-apply is only controlled per-item, not
  per-run.
- **Server-side session credentials**: once browser sessions run in the cloud (Phase
  6), the stored auth state for LinkedIn/Naukri/Indeed is credential material. A
  compromised server there is a compromised job-platform account, not just a
  compromised app.
- **Local model reliability on safety-critical classification**: local models (Ollama)
  are more prone than frontier hosted models to misclassify a sensitive question as
  safe-to-auto-answer. Mitigated by keeping red-question classification a deterministic
  ruleset (§2) rather than an LLM judgment call, regardless of which model is running.
- **Latency from per-field LLM calls**: the fill loop calls the model roughly once per
  form field. On "High" hardware-demand local models this can make each application
  slow. Pick the starting model against actual available GPU/RAM, not benchmark
  quality alone, and re-evaluate once Phase 3 shows real per-application latency.

## 13. Optional: portable USB deployment (deferred, not a Phase 1 dependency)

Storing Ollama's model files on a USB drive (via the `OLLAMA_MODELS` env var,
pointed at the drive) while keeping the Ollama runtime, Node, Playwright, and
MongoDB on the laptop is workable. It's a config change, not an architectural
one, so there's no reason to build it before the core pipeline works.

- **Model choice is constrained by this machine's RTX 4050 (6GB VRAM) / 16GB
  RAM**: start with Qwen3 8B (or 4B) at Q4_K_M quantization. Rule out 14B+ or
  large Nemotron variants outright — they'll offload to CPU and be slow,
  compounding the per-form-field call volume from §12.
- USB transfer speed affects one-time model load time only, not token
  generation speed once loaded into VRAM.
- The `.bat` launcher must resolve the USB path by **volume label**, not a
  hardcoded drive letter — Windows doesn't guarantee stable drive-letter
  assignment across replugs, and a hardcoded letter will break intermittently.
- If the Playwright persistent-context session (authenticated LinkedIn/Naukri/
  Indeed cookies) ever moves to the portable drive too, it needs the same
  encryption (BitLocker To Go) as the profile/resume data — it's live
  credential material, arguably more sensitive than the static profile.
- Build this after Phase 1-3 are solid on a normal local install, not before.

## 14. Immediate next step

Scaffold Phase 1: monorepo structure, docker-compose for Mongo/Redis, and the
resume-parser package (resume → structured CandidateProfile JSON), with a minimal
Next.js page to view/edit the parsed profile. Say the word and I'll start building.
