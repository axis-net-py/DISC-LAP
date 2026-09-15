# DISC-LAP Corporate Platform Specification

## Objective

Transform the current static DISC questionnaire into a credible corporate behavioral-assessment application with centralized persistence, authenticated administration, country-aware phone normalization, and participant-confirmed WhatsApp delivery.

## Product boundaries

- The assessment is a behavioral self-report instrument, not a psychological diagnosis.
- The product must not claim psychometric validation without a documented validation study.
- WhatsApp delivery is participant-confirmed: the application opens WhatsApp with the result addressed to the registered number; the participant presses Send.
- Automatic WhatsApp sending is outside this version because it requires the official WhatsApp API and approved credentials/templates.
- Portuguese defaults to Brazil and Spanish defaults to Paraguay, but the participant can explicitly change the country.

## Participant journey

1. Choose language and confirm Brazil or Paraguay.
2. Provide full name and a local WhatsApp number; country code is optional.
3. Read and accept the privacy/assessment consent.
4. Complete 24 statements without seeing their DISC dimension.
5. Submit once; the backend validates, scores, stores, and returns the report.
6. Review a participant report with dominant and secondary profiles, ties handled explicitly.
7. Open WhatsApp to the normalized registered number with a concise result message ready to send.

## Phone rules

- Strip punctuation, spaces, and an optional leading plus sign.
- Preserve valid numbers already beginning with `55` or `595`.
- For Brazil, add `55` to a valid 10- or 11-digit national number.
- For Paraguay, remove a domestic trunk `0` when present and add `595` to a valid 9-digit mobile number beginning with `9`.
- Reject invalid or ambiguous lengths and display a localized, actionable error.
- Language only selects the initial country; explicit country selection is authoritative.

## Scoring and reporting

- Each dimension has six items rated 1 through 4, producing a raw score from 6 through 24.
- Display normalized intensity `(raw - 6) / 18 * 100`, clearly labelled as profile intensity rather than population percentile.
- Sort deterministically and declare ties rather than silently selecting the first dimension.
- Include primary and secondary profile, strengths, watch-outs, communication, decision-making, teamwork/leadership, and practical development actions.
- Keep one shared canonical question set and translated copy so changing language mid-test cannot change scoring semantics.

## Corporate administration

- Store submissions centrally in PostgreSQL.
- Protect the admin area with a server-side session; no secret or access decision may live in browser storage.
- Support pagination, search, date filtering, detail view, and CSV export.
- Do not expose the participant phone in logs.
- Store consent timestamp, locale, selected country, normalized phone, scores, profile result, and completion timestamp.

## Security and privacy

- Validate all API payloads server-side with strict schemas and size limits.
- Add rate limiting and idempotency to result submission.
- Use secure, HTTP-only, same-site cookies for admin sessions.
- Hash the configured admin password and compare safely.
- Apply restrictive security headers and never allow arbitrary client-configured webhook URLs.
- Escape spreadsheet-formula prefixes during CSV export.
- Provide a retention configuration and deletion action for individual submissions.

## Architecture

- Node.js/Vercel serverless API endpoints.
- PostgreSQL through `DATABASE_URL`.
- Static, mobile-first frontend served by Vercel.
- Shared pure modules for phone normalization and scoring, used by the API and unit tests.
- Vitest for unit and API-contract tests; Playwright for the critical participant flow.

## Acceptance criteria

- Brazilian and Paraguayan local-number examples normalize correctly; invalid and ambiguous examples are rejected.
- A completed assessment survives reload and is visible from another authenticated browser through the admin API.
- Dimension labels are absent from assessment questions.
- A submission with tied top scores produces an explicit combined/tied result.
- The WhatsApp URL always targets the normalized number stored for that participant.
- Unauthenticated admin requests are rejected.
- Test, lint, build, and the critical browser flow pass in CI.
