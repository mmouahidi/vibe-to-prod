import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
export async function createSpec(root, slug) {
  if (!/^[a-z][a-z0-9-]{1,59}$/.test(slug) || slug.endsWith('-') || slug.includes('--')) throw new Error('Slug must be 2–60 lowercase letters, digits and hyphens, beginning with a letter.');
  const folder = join(root,'specs',slug);
  await mkdir(folder,{recursive:true});
  const path = join(folder,'SPEC.md');
  const title = slug.replace(/-/g,' ');
  const contents = `# Feature: ${title}\n\nStatus: DRAFT — approval required before implementation.\n\n## User outcome\nWho is affected and what measurable result should they get?\n\n## Scope and non-goals\nList included workflows and explicitly excluded work.\n\n## Threat model and permissions\nActors, tenants, access checks, rate limits, abuse cases, data sensitivity.\n\n## Data contract and migrations\nSchema changes, versioning, rollback plan, backfill and recovery.\n\n## API / UI contracts\nInputs, outputs, error handling, accessibility and empty states.\n\n## Acceptance criteria\n- [ ] Happy path proven by automated test\n- [ ] Authorization and cross-tenant denial tested where applicable\n- [ ] Invalid input and failure handling tested\n- [ ] Typecheck, lint, unit tests and build pass\n- [ ] Migration applied and rollback tested if schema changes\n- [ ] Monitoring, ownership and rollback instructions documented\n\n## Verification evidence\nCommands, test output, screenshots where relevant, commit hash, reviewer.\n`;
  await writeFile(path,contents,{flag:'wx'});
  return path;
}
