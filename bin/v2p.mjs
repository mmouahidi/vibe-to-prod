#!/usr/bin/env node
import { resolve } from 'node:path';
import { initialize } from '../src/init.mjs';
import { auditProject, printReport } from '../src/audit.mjs';
import { runGate } from '../src/gate.mjs';
import { createSpec } from '../src/spec.mjs';

const HELP = `v2p v0.1.0 — Production guardrails for agent-built apps

Usage:
  v2p init [directory]             Add agent policies, CI and local gate runner
  v2p doctor [--root PATH] [--json] [--strict]
                                   Inspect project readiness with evidence
  v2p gate [--root PATH] [--json] [--audit]
                                   Enforce policy and execute real quality scripts
  v2p spec <feature-slug> [--root PATH]
                                   Create a verifiable feature specification
  v2p skills                     Show how to install Addy Osmani's official skills
  v2p skills install             Explicitly invoke upstream skills installer

Safety: init never overwrites existing files. No AI API calls or telemetry.
Use Node 22+. Generated .v2p runner works without installing this CLI from npm.`;

function getOption(args, name, fallback = undefined) {
  const i = args.indexOf(name);
  if (i < 0) return fallback;
  if (i === args.length - 1 || args[i + 1].startsWith('--')) throw new Error(`${name} requires a value`);
  return args[i + 1];
}
function argWithoutOptions(args) {
  const values = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--root') { i++; continue; }
    if (!args[i].startsWith('--')) values.push(args[i]);
  }
  return values;
}

async function main() {
  const [command = 'help', ...args] = process.argv.slice(2);
  if (['help', '--help', '-h'].includes(command)) { console.log(HELP); return; }
  const root = resolve(getOption(args, '--root', process.cwd()));
  if (command === 'init') {
    const path = resolve(argWithoutOptions(args)[0] || getOption(args, '--root', process.cwd()));
    const result = await initialize(path);
    console.log(`Initialized ${result.root}\nCreated ${result.created.length} files; preserved ${result.skipped.length} existing files.`);
    if (result.skipped.length) console.log(`Preserved: ${result.skipped.join(', ')}`);
    console.log('Next: install Addy Osmani skills using `npx skills add addyosmani/agent-skills`, then run `node .v2p/bin/v2p.mjs doctor`.');
    return;
  }
  if (command === 'doctor') {
    const report = await auditProject(root);
    if (args.includes('--json')) console.log(JSON.stringify(report, null, 2));
    else printReport(report);
    if (args.includes('--strict') && report.blockers.length) process.exitCode = 1;
    return;
  }
  if (command === 'gate') {
    const gate = await runGate(root, { audit: args.includes('--audit'), silent: args.includes('--json') });
    if (args.includes('--json')) console.log(JSON.stringify(gate, null, 2));
    else {
      printReport(gate.report);
      console.log('\nQuality gate commands:');
      for (const task of gate.tasks) console.log(`  ${task.status === 'pass' ? 'PASS' : task.status === 'fail' ? 'FAIL' : 'SKIP'} ${task.command} ${task.note || ''}`);
      console.log(gate.passed ? '\nPASS: required policy and executed quality checks' : '\nBLOCKED: fix failed checks before shipping');
    }
    if (!gate.passed) process.exitCode = 1;
    return;
  }
  if (command === 'spec') {
    const slug = argWithoutOptions(args)[0];
    if (!slug) throw new Error('Supply a feature slug (e.g. team-invitations).');
    console.log(`Created ${await createSpec(root, slug)}`);
    return;
  }
  if (command === 'skills') {
    if (argWithoutOptions(args)[0] === 'install') {
      const { spawnSync } = await import('node:child_process');
      console.log('Installing upstream skills; this runs npx and accesses the network by explicit request.');
      const result = spawnSync('npx', ['skills', 'add', 'addyosmani/agent-skills'], { stdio: 'inherit', cwd: root });
      if (result.error) throw result.error;
      if (result.status !== 0) process.exitCode = result.status || 1;
    } else {
      console.log('Official integration: npx skills add addyosmani/agent-skills');
      console.log('List first:          npx skills add addyosmani/agent-skills --list');
      console.log('Source: https://github.com/addyosmani/agent-skills (MIT)');
      console.log('Cursor: .cursor/rules/*.mdc for policy; .cursor/skills/ for workflows.');
    }
    return;
  }
  throw new Error(`Unknown command: ${command}. Run v2p help.`);
}

main().catch(error => { console.error(`v2p: ${error.message}`); process.exitCode = 1; });
