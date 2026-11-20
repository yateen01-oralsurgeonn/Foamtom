// Copies the MediaPipe WASM runtime from node_modules into public/models/wasm/ so the
// game serves it from its own origin. Local file copy only: no network call.
// File names are the ones recorded in docs/review/MEDIAPIPE-DOC-CHECK.md (default, non-module pair).
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const from = join(root, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const to = join(root, 'public', 'models', 'wasm');

const FILES = ['vision_wasm_internal.js', 'vision_wasm_internal.wasm'];

mkdirSync(to, { recursive: true });
for (const name of FILES) {
  const source = join(from, name);
  if (!existsSync(source)) {
    process.stderr.write(`Missing ${source}. Run npm install first.\n`);
    process.exit(1);
  }
  copyFileSync(source, join(to, name));
  process.stdout.write(`copied ${name}\n`);
}
