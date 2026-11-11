import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { auditProject } from './audit.mjs';
async function readable(path) { try { await access(path); return true; } catch { return false; } }
export async function runGate(root, options = {}) {
  const report = await auditProject(root);
  const pkgPath = join(root, 'package.json');
  let pkg = {};
  if (await readable(pkgPath)) { try { pkg = JSON.parse(await readFile(pkgPath, 'utf8')); } catch { /* doctor handles invalid */ } }
  const scripts = pkg.scripts || {};
  const tasks = [];
  for (const name of ['typecheck','lint','test','build']) {
    if (typeof scripts[name] !== 'string' || !scripts[name].trim()) {
      tasks.push({command:`npm run ${name}`, status:'skip', note:'script not declared'});
      continue;
    }
    if (/\bv2p\s+gate\b|\.v2p\/bin\/v2p\.mjs\s+gate\b/.test(scripts[name])) {
      tasks.push({command:`npm run ${name}`,status:'fail',note:'recursive gate reference blocked'});
      continue;
    }
    const res = spawnSync('npm', ['run', name], { cwd:root, encoding:'utf8', timeout:180000, maxBuffer:1024*1024*3, env:{...process.env, CI:'true'} });
    tasks.push({ command:`npm run ${name}`, status:res.status===0 && !res.error ? 'pass' : 'fail', note: res.error ? res.error.message : res.status === 0 ? 'executed successfully' : `exit ${res.status ?? 'unknown'}`, output: `${res.stdout || ''}${res.stderr || ''}`.slice(-3000) });
    if (!options.silent && (res.status !== 0 || res.error)) console.error(`\n${name} failed:\n${String(res.stdout||'').slice(-1000)}\n${String(res.stderr||'').slice(-1000)}`);
  }
  if (options.audit) {
    if (!await readable(join(root, 'package-lock.json'))) tasks.push({command:'npm audit --omit=dev --audit-level=high',status:'fail',note:'lockfile missing; audit not performed'});
    else {
      const res = spawnSync('npm',['audit','--omit=dev','--audit-level=high'],{cwd:root,encoding:'utf8',timeout:90000,maxBuffer:1024*1024*3});
      tasks.push({command:'npm audit --omit=dev --audit-level=high',status:res.status===0 && !res.error ? 'pass' : 'fail',note:res.error ? res.error.message : `exit ${res.status}`,output:`${res.stdout||''}${res.stderr||''}`.slice(-3000)});
    }
  }
  return { passed: report.blockers.length===0 && !tasks.some(t=>t.status==='fail'), report, tasks,
    assurance: 'Passing means configured structural policies and invoked command checks passed, not that application security/availability is proven.' };
}
