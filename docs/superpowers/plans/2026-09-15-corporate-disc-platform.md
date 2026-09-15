# DISC-LAP Corporate Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a secure corporate DISC assessment with centralized storage, country-aware phone handling, authenticated administration, and participant-confirmed WhatsApp delivery.

**Architecture:** A Vercel-hosted Node application will serve the existing mobile frontend and serverless APIs backed by PostgreSQL. Pure scoring and phone modules form the domain boundary; APIs own validation, persistence, authentication, and exports, while the browser only renders state and opens a validated WhatsApp link.

**Tech Stack:** Node.js 22, Vercel Functions, PostgreSQL, `pg`, Zod, Jose, Vitest, Playwright, vanilla HTML/CSS/JavaScript.

**Spec:** `docs/superpowers/specs/2026-09-15-corporate-disc-platform.md`

## Global Constraints

- Do not claim psychometric validation or diagnosis.
- Participant-confirmed WhatsApp delivery only; no automatic sending.
- Portuguese defaults to Brazil; Spanish defaults to Paraguay; explicit selection wins.
- All scoring and phone validation must execute server-side before persistence.
- No admin secret, webhook target, or authorization decision in browser storage.
- Preserve a mobile-first bilingual participant experience.

---

### Task 1: Project foundation and quality gates

**Files:**
- Create: `package.json`
- Create: `vitest.config.js`
- Create: `playwright.config.js`
- Create: `.env.example`
- Create: `vercel.json`
- Create: `.github/workflows/ci.yml`
- Modify: `README.md`

**Interfaces:**
- Produces: npm scripts `test`, `test:e2e`, `lint`, and `build`; runtime variables `DATABASE_URL`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`, `DATA_RETENTION_DAYS`.

- [ ] **Step 1: Add a failing configuration smoke test**

Create `tests/config.test.js` that imports `src/config.js`, supplies a minimal test environment, and asserts parsed runtime settings; the import must initially fail because the module does not exist.

- [ ] **Step 2: Verify the test fails for the missing configuration module**

Run `npm test -- tests/config.test.js` and expect module-not-found failure.

- [ ] **Step 3: Add Node/Vercel dependencies, scripts, environment example, CI, and minimal configuration parser**

Create `src/config.js` exporting `readConfig(env)` with strict required production variables and safe test defaults. Configure Vitest, Playwright, Vercel rewrites/headers, and GitHub Actions for install, test, lint, and build.

- [ ] **Step 4: Verify the configuration test and clean install**

Run `npm ci && npm test -- tests/config.test.js && npm run lint && npm run build`; expect all commands to succeed.

- [ ] **Step 5: Commit**

Commit with `chore: establish application quality gates`.

### Task 2: Phone normalization domain

**Files:**
- Create: `src/domain/phone.js`
- Create: `tests/phone.test.js`

**Interfaces:**
- Produces: `normalizePhone(input, country): { e164: string, digits: string, national: string, country: 'BR'|'PY' }` and typed `PhoneValidationError`.

- [ ] **Step 1: Write failing table-driven tests**

Cover BR 10/11-digit local numbers, BR numbers already prefixed with 55, PY 9-digit mobile numbers, PY domestic `09...`, PY numbers already prefixed with 595, punctuation, wrong prefix, invalid length, and cross-country ambiguity.

- [ ] **Step 2: Verify failures identify the missing normalizer**

Run `npm test -- tests/phone.test.js`; expect failures caused by missing exports.

- [ ] **Step 3: Implement the minimal explicit-country normalizer**

Reject empty/nonconforming inputs, preserve valid DDI input, add the selected country code only to valid national patterns, and return canonical E.164 plus digits.

- [ ] **Step 4: Verify every normalization edge case**

Run `npm test -- tests/phone.test.js`; expect all cases to pass.

- [ ] **Step 5: Commit**

Commit with `feat: normalize Brazilian and Paraguayan phones`.

### Task 3: Canonical assessment and defensible scoring

**Files:**
- Create: `src/domain/assessment.js`
- Create: `src/content/pt.js`
- Create: `src/content/es.js`
- Create: `tests/scoring.test.js`

**Interfaces:**
- Produces: `ASSESSMENT_ITEMS`, `scoreAssessment(answers)`, and `buildProfile(scores, locale)` returning raw scores, intensity values, ordered profiles, `isTie`, dominant dimensions, and localized report sections.

- [ ] **Step 1: Write failing scoring tests**

Assert 24 answers are required, values outside 1–4 fail, each dimension receives six answers, minimum maps to 0 intensity, maximum maps to 100, ordering is deterministic, and top-score ties are explicit.

- [ ] **Step 2: Verify the tests fail because scoring does not exist**

Run `npm test -- tests/scoring.test.js`; expect missing-module/export failures.

- [ ] **Step 3: Implement canonical items, translated presentation copy, normalized intensity, ties, and combined profiles**

Use stable item IDs and dimensions in the shared module; translations refer to IDs and never duplicate scoring metadata.

- [ ] **Step 4: Verify scoring in both locales**

Run `npm test -- tests/scoring.test.js`; expect all assertions to pass.

- [ ] **Step 5: Commit**

Commit with `feat: add canonical DISC scoring and reports`.

### Task 4: Database and secure submission API

**Files:**
- Create: `db/migrations/001_create_assessments.sql`
- Create: `src/db.js`
- Create: `src/http.js`
- Create: `api/assessments.js`
- Create: `tests/assessments-api.test.js`

**Interfaces:**
- Consumes: `normalizePhone`, `scoreAssessment`, `buildProfile`.
- Produces: `POST /api/assessments` accepting `{ idempotencyKey, name, phone, country, locale, consent, answers }` and returning `{ id, participant, scores, profile, whatsappUrl, completedAt }`.

- [ ] **Step 1: Write failing API-contract tests**

Test successful BR/PY submissions, rejected missing consent, invalid name/phone/answers, idempotent replay, excessive body size, rate-limit response, and a WhatsApp URL targeting the stored normalized phone.

- [ ] **Step 2: Verify contract tests fail on the missing endpoint**

Run `npm test -- tests/assessments-api.test.js`; expect endpoint import failure.

- [ ] **Step 3: Implement schema, persistence, rate limiting, idempotency, and response mapping**

Create a UUID primary key, unique idempotency key, consent/completion timestamps, JSONB scores/profile, indexed normalized phone and completion time; use parameterized SQL exclusively.

- [ ] **Step 4: Verify API behavior and migration**

Run `npm test -- tests/assessments-api.test.js`; apply the migration to a disposable database and expect all tests to pass.

- [ ] **Step 5: Commit**

Commit with `feat: persist validated assessment submissions`.

### Task 5: Professional participant experience

**Files:**
- Modify: `index.html`
- Create: `public/app.js`
- Create: `public/styles.css`
- Create: `tests/participant-flow.spec.js`

**Interfaces:**
- Consumes: `POST /api/assessments` response.
- Produces: accessible bilingual intake, assessment, submission states, report, retry path, and participant-confirmed WhatsApp action.

- [ ] **Step 1: Write the failing critical browser journey**

Assert country defaults follow language, explicit override persists, local phone validation is helpful, consent is mandatory, no dimension labels appear during questions, progress survives navigation, double-submit is blocked, the report shows primary/secondary profiles and intensity, and the WhatsApp link targets the API-returned phone.

- [ ] **Step 2: Verify the browser test fails on the current page**

Run `npm run test:e2e -- tests/participant-flow.spec.js`; expect failures for the missing professional flow.

- [ ] **Step 3: Split the monolithic page and implement the new states**

Move styles and logic into focused assets, use semantic form controls, inline errors, focus management, loading/error/success states, canonical questions without dimension badges, consent copy, explicit country selector, and report sections from the server response.

- [ ] **Step 4: Verify mobile and desktop participant journeys**

Run the Playwright test for a mobile viewport and Chromium desktop; expect both to pass with no console errors.

- [ ] **Step 5: Commit**

Commit with `feat: deliver professional participant assessment flow`.

### Task 6: Authenticated corporate admin

**Files:**
- Create: `src/auth.js`
- Create: `api/admin/session.js`
- Create: `api/admin/assessments.js`
- Create: `api/admin/assessments/[id].js`
- Create: `api/admin/export.js`
- Create: `admin/index.html`
- Create: `public/admin.js`
- Create: `tests/admin-api.test.js`
- Create: `tests/admin-flow.spec.js`

**Interfaces:**
- Produces: secure session login/logout; paginated/filterable assessment list; detail and individual deletion; formula-safe CSV export.

- [ ] **Step 1: Write failing auth and admin API tests**

Assert unauthorized access returns 401, login sets a secure HTTP-only same-site cookie, bad credentials fail uniformly, list pagination/filtering works, deletion requires authentication, retention filtering works, and CSV values beginning with `=`, `+`, `-`, or `@` are neutralized.

- [ ] **Step 2: Verify tests fail on missing admin endpoints**

Run `npm test -- tests/admin-api.test.js`; expect missing-module failures.

- [ ] **Step 3: Implement sessions, queries, deletion, and export**

Sign short-lived sessions with `SESSION_SECRET`, compare password hashes safely, parameterize filters, cap page sizes, and audit deletion without logging participant phone numbers.

- [ ] **Step 4: Write and pass the admin browser flow**

Test login, filtered list, detail, export, deletion confirmation, logout, and direct unauthenticated navigation; run `npm run test:e2e -- tests/admin-flow.spec.js` and expect success.

- [ ] **Step 5: Commit**

Commit with `feat: add secure corporate assessment administration`.

### Task 7: Final security, accessibility, and deployment verification

**Files:**
- Modify: `vercel.json`
- Modify: `README.md`
- Create: `docs/operations.md`
- Create: `tests/security-headers.test.js`

**Interfaces:**
- Consumes: all application components.
- Produces: documented deployment, migration, secret rotation, retention, backup, and incident procedures.

- [ ] **Step 1: Write failing security-header and production-config tests**

Assert CSP, frame denial, referrer policy, MIME sniffing protection, permissions policy, HTTPS-sensitive cookies, and rejection of default/weak secrets.

- [ ] **Step 2: Verify the tests expose missing hardening**

Run `npm test -- tests/security-headers.test.js`; expect explicit missing-header/config failures.

- [ ] **Step 3: Add security headers and operational documentation**

Document database migration, password hashing, Vercel environment setup, retention execution, backups, rollback, and the precise limitation of participant-confirmed WhatsApp delivery.

- [ ] **Step 4: Run the full release gate**

Run `npm ci && npm test && npm run lint && npm run build && npm run test:e2e`; expect zero failures and zero browser console errors.

- [ ] **Step 5: Review secrets and repository diff**

Run `rg -n "(password|secret|token|api[_-]?key)" --glob '!node_modules/**' .` and inspect every match; run `git diff --check` and `git status --short`.

- [ ] **Step 6: Commit**

Commit with `docs: add secure deployment and operations guide`.
