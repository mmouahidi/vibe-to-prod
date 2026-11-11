import { readFile, readdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

async function exists(path) { try { await access(path); return true; } catch { return false; } }
async function readJson(path, fallback = null) { try { return JSON.parse(await readFile(path, 'utf8')); } catch { return fallback; } }
async function hasAny(root, paths) {
  for (const p of paths) if (await exists(join(root, p))) return p;
  return null;
}
async function hasMigrationFiles(root) {
  if (await hasAny(root, ['prisma/migrations', 'drizzle', 'supabase/migrations', 'db/migrations', 'migrations'])) return true;
  return false;
}
const AUTH_PACKAGES = ['better-auth','next-auth','@auth/core','@clerk/nextjs','@supabase/supabase-js','lucia'];
const DB_PACKAGES = ['drizzle-orm','@prisma/client','prisma','kysely','@supabase/supabase-js','pg'];
const PAYMENT_PACKAGES = ['stripe','@stripe/stripe-js','@polar-sh/sdk','@lemonsqueezy/lemonsqueezy.js'];
const DEFAULT_BLOCKERS = ['typescript_strict','typecheck_script','test_script','build_script','ci_workflow'];

export async function auditProject(root) {
  const pkg = await readJson(join(root, 'package.json'));
  const configPath = join(root, 'v2p.config.json');
  let config = {};
  let configError = null;
  if (await exists(configPath)) {
    try { config = JSON.parse(await readFile(configPath, 'utf8')); }
    catch (error) { configError = error.message; }
  }
  const ts = await readJson(join(root, 'tsconfig.json'));
  const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) };
  const scripts = pkg?.scripts || {};
  const results = [];
  const add = (id, status, evidence, detail, assurance = 'structural') => results.push({ id, status, evidence, detail, assurance });
  add('package_json', pkg ? 'pass' : 'fail', 'package.json', pkg ? 'Node project manifest located' : 'No package.json found');
  add('typescript_strict', ts?.compilerOptions?.strict === true ? 'pass' : 'fail', 'tsconfig.json compilerOptions.strict', ts ? (ts.compilerOptions?.strict === true ? 'Strict mode enabled' : 'Strict mode not explicitly enabled; inherited configs are not resolved') : 'TypeScript configuration absent');
  for (const script of ['typecheck','lint','test','build']) {
    add(`${script}_script`, typeof scripts[script] === 'string' && scripts[script].trim() ? 'pass' : 'fail', `package.json scripts.${script}`, scripts[script] ? 'Executable command declared (not yet run)' : 'Command missing');
  }
  const ci = await hasAny(root, ['.github/workflows/vibe-to-prod.yml','.github/workflows/ci.yml','.github/workflows/ci.yaml','.gitlab-ci.yml']);
  add('ci_workflow', ci ? 'pass' : 'fail', ci || '.github/workflows/', ci ? 'Recognized CI workflow present (behavior not yet verified)' : 'No recognized CI workflow; other workflow names are not auto-detected');
  const env = await hasAny(root, ['.env.example','.env.sample']);
  add('env_contract', env ? 'pass' : 'warn', env || '.env.example', env ? 'Environment example present; values not validated' : 'Add a documented environment-variable contract');
  const auth = AUTH_PACKAGES.find(x => deps[x]);
  add('auth_dependency', auth ? 'pass' : 'warn', auth || 'package dependencies', auth ? `Auth library declared: ${auth}; authorization rules have NOT been verified` : 'No supported authentication dependency detected; custom auth requires manual review', 'signal-only');
  const db = DB_PACKAGES.find(x => deps[x]);
  add('database_dependency', db ? 'pass' : 'warn', db || 'package dependencies', db ? `DB library declared: ${db}; tenant scoping not verified` : 'No supported DB dependency detected', 'signal-only');
  const migration = await hasMigrationFiles(root);
  add('migrations_present', migration ? 'pass' : 'warn', 'migration directory', migration ? 'Migration directory found; migration replay/drift not tested' : 'No recognized migrations directory; configure for your ORM', 'signal-only');
  const pay = PAYMENT_PACKAGES.find(x => deps[x]);
  add('payments_dependency', pay ? 'pass' : 'warn', pay || 'package dependencies', pay ? `Payment package declared: ${pay}; webhook and replay protections not verified` : 'Optional: add payments only if the product needs them', 'signal-only');
  const skillRoot = await hasAny(root, ['.cursor/skills', '.agents/skills', '.claude/skills']);
  add('agent_skills', skillRoot ? 'pass' : 'warn', skillRoot || '.cursor/skills', skillRoot ? 'Skills directory present; individual skill integrity not audited' : 'Install agent-skills using upstream recommended installer', 'signal-only');
  const ignore = await exists(join(root, '.gitignore')) ? await readFile(join(root, '.gitignore'), 'utf8') : '';
  const ignoreMatches = ignore.split(/\r?\n/).map(x=>x.trim()).some(x=>['.env*','.env','.env.local','*.env'].includes(x));
  const ls = spawnSync('git', ['ls-files', '--cached', '--', '.env', '.env.local', '.env.production'], {cwd:root, encoding:'utf8', timeout:5000});
  const trackedEnv = ls.status === 0 && Boolean(ls.stdout.trim());
  add('secrets_hygiene', trackedEnv ? 'fail' : ignoreMatches ? 'pass' : 'warn', '.gitignore and git index', trackedEnv ? 'DANGER: a real .env path is git-tracked' : ignoreMatches ? 'Environment filename ignore pattern present; secret scanning not executed' : 'Add .env* to .gitignore with an allowlist for .env.example', 'structural');
  // The baseline is immutable through config; teams may add stricter checks only.
  const blockers = [...new Set([...DEFAULT_BLOCKERS, ...(Array.isArray(config.blocking_checks) ? config.blocking_checks : [])])];
  if (configError) add('invalid_policy', 'fail', 'v2p.config.json', `Invalid policy JSON: ${configError}`);
  const unrecognized = blockers.filter(x => !results.some(r=>r.id===x));
  if (unrecognized.length) add('invalid_policy', 'fail', 'v2p.config.json blocking_checks', `Unknown blocker IDs: ${unrecognized.join(', ')}`);
  const blocked = results.filter(r => (blockers.includes(r.id) || r.id === 'invalid_policy' || r.id === 'secrets_hygiene' && trackedEnv) && r.status !== 'pass');
  return {
    tool: 'vibe-to-prod', version: '0.1.0', root, mode: config.mode || 'saas',
    summary: { pass: results.filter(r=>r.status==='pass').length, warn: results.filter(r=>r.status==='warn').length, fail: results.filter(r=>r.status==='fail').length, requiredFailures: blocked.length },
    disclaimers: ['Structural passes are not security verification. Auth, database isolation, payment webhooks and migrations require integration tests and manual review.', 'Only commands actually executed by v2p gate count as verified execution evidence.'],
    blockers: blocked.map(r=>r.id), checks: results
  };
}

export function printReport(report) {
  console.log(`Vibe-to-Prod Doctor · ${report.root}`);
  for (const r of report.checks) console.log(`  ${r.status === 'pass' ? '✓' : r.status === 'fail' ? '✗' : '!'} ${r.id.padEnd(21)} ${r.status.toUpperCase().padEnd(5)} ${r.detail}`);
  console.log(`\n${report.summary.pass} signals found · ${report.summary.fail} missing · ${report.summary.warn} review items`);
  console.log(report.blockers.length ? `Blocking requirements: ${report.blockers.join(', ')}` : 'No structural blockers detected. Execute the real tests and security review before shipping.');
  console.log('Important: structural checks ≠ security certification.');
}
