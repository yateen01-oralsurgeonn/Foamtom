// Prints the byte size of every file under public/models/ (recursively), one per line, then the total.
import { readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const base = join(root, 'public', 'models');

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out.sort();
}

let total = 0;
for (const file of walk(base)) {
  const size = statSync(file).size;
  total += size;
  process.stdout.write(`${relative(base, file).split('\\').join('/')}\t${size}\n`);
}
process.stdout.write(`total\t${total}\n`);
