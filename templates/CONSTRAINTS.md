# Engineering constraints — executable + reviewable

| Constraint | Enforcement | Failure behavior |
|---|---|---|
| TypeScript strict mode | `v2p doctor` structural check; `npm run typecheck` actual check | Block merge |
| Linting | `npm run lint` | Block if configured, add to `blocking_checks` for missing script |
| Unit/integration tests | `npm test` | Block merge; do not skip |
| Production build | `npm run build` | Block merge |
| Continuous integration | CI workflow present + CI job runs v2p gate | Block merge |
| Authentication | Auth library heuristic + authorization tests | Human/security approval required |
| Data migrations | Migration directory heuristic + apply/revert tests | Human/database approval required |
| Billing | Dependency heuristic + signed webhook replay tests | Human/security approval required |
| Accessibility | Automated checks + manual keyboard testing | Release owner approval required |
| Secrets | `.gitignore`, repository scanning, rotation procedure | Immediately stop on confirmed exposure |
| Dependency security | `v2p gate --audit` (npm lockfile required), SBOM, periodic review | Block high/critical issues by policy |
| Availability/performance | Synthetic checks, SLOs, tracing, rollback runbooks | Release owner approval required |

**Important:** An agent instruction cannot enforce security by itself. Required checks live in CI and must return nonzero on failure. Static presence checks never prove that authentication, isolation or webhook processing is correct.

## Release evidence packet

- Commit/PR ID:
- Spec and acceptance criteria:
- Typecheck/lint/test/build logs:
- Database migration rollout and rollback plan:
- Authorization/tenant isolation test results:
- Dependency audit/secret scan results:
- Owner and sign-off:
