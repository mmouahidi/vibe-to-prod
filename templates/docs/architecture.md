# Architecture contract — replace placeholders with your real boundaries

## Dependency direction

`UI → application services → domain interfaces ← infrastructure adapters`

- `domain/`: business rules and types; must not import framework/router/ORM packages.
- `application/`: use cases, transaction boundaries, authorization policies.
- `infrastructure/`: DB adapters, queue providers, API SDKs, mailers, payment gateway.
- `app/` or `routes/`: transport, validation, session parsing, presentation only.

## Auth, authorization and tenants

Treat credentials, sessions, user membership, permissions and tenant context separately. Gate all sensitive data access server-side. Never trust a tenant identifier because it was sent by the browser. Add regression tests for BOLA/IDOR and cross-tenant data exfiltration.

## Database changes

Commit migrations in the same change as code. Prefer expand/migrate/contract for deployed apps. Verify migrations on clean and existing datasets; document rollback strategy including irreversible steps and backup restore.

## External actions and payments

Validate signed webhooks; process idempotently using durable event keys. Ensure retryable jobs, bounded timeouts and structured logging without PII or secrets.

## Operational readiness

Health endpoint, error tracking, logs, traces, metrics, alert routing, on-call owner and rollback instructions must be documented and tested before real users depend on the system.

## Automated evidence

`node .v2p/bin/v2p.mjs doctor` gives structural signals. `node .v2p/bin/v2p.mjs gate` executes scripts. Passing neither alone implies that the service is safe to operate.
