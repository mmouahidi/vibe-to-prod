# ADR 0001 — Modular boundaries and verification

- **Status:** Proposed
- **Decision:** Domain logic independent of UI and persistence; strict TypeScript, test/build scripts, reviewed migrations and CI checks.
- **Context:** AI coding increases output volume; undocumented cross-layer coupling increases correction cost.
- **Consequences:** Extra initial structure and testing; lower integration risk and easier local agent context.
- **Alternatives considered:** Unrestricted feature-first coding; a heavyweight microservices architecture. Both rejected as default starting points.
- **Review trigger:** Proven workload/profile that warrants a different dependency boundary.
