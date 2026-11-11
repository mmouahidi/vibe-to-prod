# Security policy

This repository is a prototype and has not undergone an independent security assessment. Report vulnerabilities privately to the eventual maintainers using a private GitHub security advisory once the repository is published. Until a security contact is available, do not post exploit details in public issues.

The CLI does not collect telemetry or send source code to external services. `skills install` executes a separate upstream installer on explicit request; `gate --audit` connects to npm audit on explicit request. Inspect dependencies and third-party code before using in a sensitive environment.
