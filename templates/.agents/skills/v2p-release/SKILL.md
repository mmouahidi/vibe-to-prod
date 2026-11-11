---
name: v2p-release
description: Verify and document a production release of an AI-built web application. Use before deployment, merging a high-impact change, or preparing a release checklist.
---

# V2P Release — evidence over confidence

Follow `addyosmani/agent-skills` `shipping-and-launch`, `ci-cd-and-automation`, `security-and-hardening`, and `observability-and-instrumentation` when installed.

## Procedure

1. Confirm the intended release commit, environment and owning human. Review `AGENTS.md`, `CONSTRAINTS.md` and relevant specs.
2. Run `node .v2p/bin/v2p.mjs doctor --strict` and `node .v2p/bin/v2p.mjs gate`; include exact exit codes. Request the dependency audit gate where applicable.
3. Separately verify manual or integration-specific requirements: authorization deny-cases, tenant boundary, signed webhooks and idempotency, forward migration, backfill/recovery plan, secret scanning and rotation, error and health alerts, rollback.
4. Produce a release evidence packet containing exact source commit, environment, checks executed and not executed, failures, reviewer, rollback and decision.
5. **Never deploy or mutate billing, access permissions or production data without explicit authorization.** A passing V2P gate is necessary but not sufficient for launch.

## Red flags

- Missing test commands or skipped checks presented as passes.
- CI modified to ignore failures.
- Schema change without a tested rollout/backfill strategy.
- Unreviewed privilege changes or a new payment path.
- A release note calling a structural scan "security certified".

## Exit criteria

Either `BLOCKED` with evidence and actionable remediation, or `READY FOR HUMAN REVIEW` with checks passed and unresolved risks stated. Do **not** claim `production certified`.
