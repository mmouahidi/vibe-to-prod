# Public development roadmap (proposed, not commitments)

## v0.1 — usable local CLI [implemented in this prototype]

- Non-destructive `init` with portable agent instructions for Cursor and GitHub Copilot.
- Self-contained `.v2p` runtime, install without npm publication.
- `doctor` evidence-based structural checks and JSON reporting.
- `spec` generator, `gate` actual typecheck/lint/test/build runner, optional npm audit.
- Real CLI unit/integration tests and demo.

**Acceptance:** Installation twice leaves original files unchanged; a failing npm test reliably makes gate fail; missing required scripts always block; CLI works offline except explicit optional integrations.

## v0.2 — credible production starter

- Pin one upstream Next.js + Postgres + Drizzle + tested auth + Stripe recipe and expose `v2p new <app>`.
- Real database migration up/down/recovery integration tests, session/authorization tests, signed webhook fixtures, idempotency coverage.
- Local Docker Postgres and reproducible CI matrix; template lockfiles and deterministic installs.
- Playwright E2E, typed env parsing, passwordless/reset flows, secret scan, dependency review, OpenTelemetry instrumentation.

**Acceptance:** Fresh clone CI passes on clean database, email/auth flows and billing test-mode sandbox; migration rollback and cross-tenant denial are verified automatically. Do not call it production-ready before this.

## v0.3 — rescue mode for brownfield applications

- `v2p rescue` inventories codebases and creates ranked fix proposals with file/line evidence, without rewriting by default.
- Import agent-specific skills and project rules without conflicting instructions.
- Policy drift and architecture boundary checks; SAST and secrets scanner integration.
- Multi-package/npm/pnpm/bun adapters with tests.

**Acceptance:** A public benchmark of deliberately broken apps, recall/precision measurement and independent review of fixes.

## v0.4 — launch readiness

- `v2p ship` bundles attestations, database/deploy checklists, audit logs and owner approval.
- Hosted dashboard optional; local-first privacy preserved; signed evidence and GitHub Checks integration.
- Docker and supported deployment recipes; rollback dry-run, uptime checks and deployment smoke tests.

**Acceptance:** Release receipts are reproducible from a clean CI run; no production deploy occurs without explicit approval.

## v1.0 — production-proven ecosystem

- Multiple fully validated stack recipes, plugin SDK, maintainers and security policy.
- Threat-model-reviewed reference apps and an external security assessment.
- Measured usage, public case studies and maintained support commitments.
