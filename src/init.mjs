import { access, mkdir, copyFile, readdir, lstat } from 'node:fs/promises';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
async function exists(path) { try { await access(path); return true; } catch { return false; } }
async function getFiles(root, prefix='') {
  const names = await readdir(join(root, prefix), {withFileTypes:true});
  const files = [];
  for (const entry of names) {
    const child = join(prefix,entry.name);
    if (entry.isDirectory()) files.push(...await getFiles(root,child));
    else if (entry.isFile()) files.push(child);
  }
  return files;
}
async function assertParentsAreReal(root, target) {
  // Do not follow symlinked ancestor directories during installation.
  const subpath = relative(root, dirname(target));
  if (subpath.startsWith('..')) throw new Error('Attempt to write outside target root.');
  let path = root;
  for (const part of subpath.split(/[\/]+/).filter(x => x && x !== '.')) {
    path = join(path, part);
    try {
      const stat = await lstat(path);
      if (stat.isSymbolicLink()) throw new Error(`Refusing symlinked destination directory: ${path}`);
      if (!stat.isDirectory()) throw new Error(`Destination ancestor is not a directory: ${path}`);
    } catch (err) { if (err.code !== 'ENOENT') throw err; }
  }
}
export async function initialize(root) {
  const resolved = resolve(root);
  await mkdir(resolved, {recursive:true});
  const stat = await lstat(resolved);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Target must be a real directory, not a symlink.');
  const roots = [
    {source:join(packageRoot,'templates'), destination:resolved},
    {source:join(packageRoot,'bin'), destination:join(resolved,'.v2p','bin')},
    {source:join(packageRoot,'src'), destination:join(resolved,'.v2p','src')},
    {source:join(packageRoot,'templates'), destination:join(resolved,'.v2p','templates')}
  ];
  const created = [], skipped = [];
  for (const group of roots) {
    for (const file of await getFiles(group.source)) {
      const target = join(group.destination,file);
      if (await exists(target)) { skipped.push(relative(resolved,target)); continue; }
      await assertParentsAreReal(resolved,target);
      await mkdir(dirname(target),{recursive:true});
      // COPYFILE_EXCL avoids races and accidental overwrites.
      try { await copyFile(join(group.source,file),target,(await import('node:fs')).constants.COPYFILE_EXCL); created.push(relative(resolved,target)); }
      catch (e) { if (e.code === 'EEXIST') skipped.push(relative(resolved,target)); else throw e; }
    }
  }
  return {root:resolved,created,skipped};
}
