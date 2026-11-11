import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { initialize } from '../src/init.mjs';
import { auditProject } from '../src/audit.mjs';
import { runGate } from '../src/gate.mjs';
import { createSpec } from '../src/spec.mjs';

async function fixture() { return mkdtemp(join(tmpdir(), 'v2p-fixture-')); }
async function pkg(root, scripts) { await writeFile(join(root,'package.json'),JSON.stringify({name:'fixture',version:'1.0.0',scripts},null,2)); }
async function passable(root) {
  await initialize(root);
  await pkg(root,{typecheck:'node -e "process.exit(0)"',lint:'node -e "process.exit(0)"',test:'node -e "process.exit(0)"',build:'node -e "process.exit(0)"'});
  await writeFile(join(root,'tsconfig.json'),JSON.stringify({compilerOptions:{strict:true}}));
  return root;
}

test('init installs actual local runner and preserves existing project instructions',async()=>{
  const root = await fixture();
  await writeFile(join(root,'AGENTS.md'),'my custom rules\n');
  const a = await initialize(root);
  const b = await initialize(root);
  assert.equal(await readFile(join(root,'AGENTS.md'),'utf8'),'my custom rules\n');
  assert.ok(a.created.some(x=>x==='.v2p/bin/v2p.mjs'));
  assert.ok(b.skipped.some(x=>x==='.v2p/bin/v2p.mjs'));
  await access(join(root,'.cursor/rules/vibe-to-prod.mdc'));
  await access(join(root,'.github/workflows/vibe-to-prod.yml'));
  await access(join(root,'.v2p/templates/AGENTS.md'));
});

test('doctor fails structural requirements on empty project, no false pass',async()=>{
  const root = await fixture();
  const report = await auditProject(root);
  assert.ok(report.blockers.includes('typescript_strict'));
  assert.ok(report.blockers.includes('ci_workflow'));
  assert.equal(report.checks.find(x=>x.id==='auth_dependency').status,'warn');
});

test('doctor is transparent about weaker signals and accepts healthy structural fixture',async()=>{
  const root = await passable(await fixture());
  const report = await auditProject(root);
  assert.deepEqual(report.blockers,[]);
  assert.equal(report.checks.find(x=>x.id==='auth_dependency').assurance,'signal-only');
  assert.ok(report.disclaimers[0].includes('not security verification'));
});

test('gate executes actual commands and blocks on a failing test',async()=>{
  const root = await passable(await fixture());
  const green = await runGate(root,{silent:true});
  assert.equal(green.passed,true);
  assert.equal(green.tasks.filter(x=>x.status==='pass').length,4);
  await pkg(root,{typecheck:'node -e "process.exit(0)"',lint:'node -e "process.exit(0)"',test:'node -e "process.exit(7)"',build:'node -e "process.exit(0)"'});
  const red = await runGate(root,{silent:true});
  assert.equal(red.passed,false);
  assert.equal(red.tasks.find(x=>x.command==='npm run test').status,'fail');
});

test('gate does not say pass when required commands are missing',async()=>{
  const root = await fixture();
  await initialize(root);
  await pkg(root,{});
  const gate = await runGate(root,{silent:true});
  assert.equal(gate.passed,false);
  assert.ok(gate.report.blockers.includes('test_script'));
});

test('spec generation is exclusive and rejects path traversal',async()=>{
  const root = await fixture();
  const file = await createSpec(root,'team-invitations');
  assert.ok((await readFile(file,'utf8')).includes('cross-tenant'));
  await assert.rejects(createSpec(root,'team-invitations'));
  await assert.rejects(createSpec(root,'../danger'));
  await assert.rejects(createSpec(root,'A-B'));
});

test('init refuses writing through a symlink in destination', async()=>{
  const {symlink} = await import('node:fs/promises');
  const root = await fixture();
  const outside = await fixture();
  await symlink(outside,join(root,'.cursor'));
  await assert.rejects(initialize(root),/symlinked destination directory/);
});


test('policy cannot silently disable the immutable baseline',async()=>{
  const root=await fixture();
  await initialize(root);
  await pkg(root,{});
  await writeFile(join(root,'v2p.config.json'),JSON.stringify({blocking_checks:[]}));
  const report=await auditProject(root);
  assert.ok(report.blockers.includes('test_script'));
  await writeFile(join(root,'v2p.config.json'),'{ invalid json');
  const broken=await auditProject(root);
  assert.ok(broken.blockers.includes('invalid_policy'));
});
