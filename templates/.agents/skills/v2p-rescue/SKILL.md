---
name: v2p-rescue
description: Evidence-first workflow to rescue an existing AI-built application. Use when a prototype fails CI, has unsafe architecture, or needs a production-readiness plan.
---

# V2P Rescue — repair without rewriting everything

Use the official `addyosmani/agent-skills` `using-agent-skills`, `debugging-and-error-recovery`, `test-driven-development`, `security-and-hardening` and `code-review-and-quality` workflows whenever available.

## 1. Baseline evidence

Execute `node .v2p/bin/v2p.mjs doctor --json` and `node .v2p/bin/v2p.mjs gate --json`. Record exit statuses and distinguish **actually executed** checks from structural or heuristic signals. Never treat a detected auth dependency as proof of authorization.

## 2. Map the failure

- Identify the minimal failing behavior and ownership boundary (UI, transport, domain, persistence, infrastructure).
- Inspect repo conventions, CI, docs, tests and applicable skill process.
- Check for exposed secrets, auth bypass and cross-tenant information disclosure; escalate confirmed exposure immediately.
- Rank issues by: reproducibility, production impact, exploitability, number of users and change cost. Avoid speculative scoring and fabricated security claims.

## 3. Repair only the smallest safe vertical slice

Create a feature/bug specification in `specs/<slug>/SPEC.md`, propose a narrow plan, ask for approval before schema or authentication changes, then write failing tests before fixing the defect.

## 4. Prove the repair

Rerun typecheck, tests, build, dependency audit if configured, and negative-path authorization checks if relevant. Attach actual logs and known unknowns. Do not weaken CI to make it green.

## Rationalizations to reject

- "The auth package is installed, so access control is safe." No; prove denial of forbidden access.
- "The tests passed earlier." No; run them against this exact commit.
- "This is just a prototype." If it accepts real users or payments, production obligations apply.

## Exit criteria

A reproducible before/after failure, scoped code change, passing gate with logs, documented remaining risks and a human review for sensitive operations.
