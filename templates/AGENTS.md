# Project-wide AI Engineering Contract

These requirements apply to Cursor, Claude Code, Codex, Copilot, Gemini CLI and other coding agents.

## Mandatory workflow

1. For non-trivial changes, write a spec using `node .v2p/bin/v2p.mjs spec <slug>`; get product approval for risk/impact before coding.
2. Prefer the lifecycle skills from [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) when available: `using-agent-skills`, `spec-driven-development`, `planning-and-task-breakdown`, `incremental-implementation`, `test-driven-development`, `security-and-hardening`, `code-review-and-quality`, `shipping-and-launch`.
3. For an existing AI-built app use `.agents/skills/v2p-rescue/SKILL.md`; before release use `.agents/skills/v2p-release/SKILL.md`.
4. Build an atomic vertical slice (schema / API / UI / tests). No unrelated refactoring.
5. Run `node .v2p/bin/v2p.mjs gate`. Do not claim a pass without actual command output and a successful exit status.
6. Never silence TypeScript, skip tests, weaken lint rules, edit lockfiles without dependency changes, or hide failures to make CI green.

## Architectural boundaries

- Domain logic is independent from React components, HTTP handlers, frameworks, queues and persistence adapters.
- Validate untrusted input at the server boundary; authorization is required on every sensitive mutation and query.
- Treat tenant ID as an authorization boundary, never as a client-supplied selector of trust.
- DB schema changes require committed migrations, deploy ordering and tested rollback/recovery.
- Payments require signed webhook verification, idempotency and replay handling.
- No plaintext secrets, fabricated test results, or unaudited dependency installation.
- Public API, types and schema changes must be backward-compatible or have an explicit migration plan.
- User-facing features must cover loading, empty, error, responsive and accessibility states.

## Evidence before release

Provide: affected files, tests executed with results, schema migration evidence, risk assessment, known limitations and rollback path. `doctor` checks are structural signals, **not** a security audit.

See `CONSTRAINTS.md`, `docs/architecture.md` and `v2p.config.json`. Skills are installed separately using `npx skills add addyosmani/agent-skills`.
