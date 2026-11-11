# Vibe-to-Prod installed

This project has a **versioned local Vibe-to-Prod runtime** under `.v2p/` and safety-first agent policies.

Start:

```bash
node .v2p/bin/v2p.mjs doctor
node .v2p/bin/v2p.mjs spec my-feature
node .v2p/bin/v2p.mjs gate
```

Install upstream Addy Osmani agent skills deliberately (network and npm required):

```bash
npx skills add addyosmani/agent-skills
```

Review `CONSTRAINTS.md` before deploying. **Important:** your app's auth, migrations, billing, integration testing and observability remain your responsibility. The installer does not create them and the doctor cannot prove security.

The GitHub workflow uses `npm ci --ignore-scripts`; if your build requires trusted install-time scripts, review and adjust this explicitly. For pnpm/yarn/bun repos, adapt the workflow and gate command runner before relying on CI.
