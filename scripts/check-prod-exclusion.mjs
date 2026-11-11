// Decision 0004: build the playground for production and prove the library
// (identified by its MARKER string) is absent from the output.
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MARKER = '__GRID_AUDITOR__';
const outDir = 'playground/dist';

execSync('pnpm --filter playground build', { stdio: 'inherit' });

const files = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });

const leaks = files(outDir).filter((f) => readFileSync(f, 'utf8').includes(MARKER));
if (leaks.length > 0) {
  console.error(`FAIL: library code found in production build:\n  ${leaks.join('\n  ')}`);
  process.exit(1);
}
console.log(`OK: ${MARKER} absent from ${outDir} (${files(outDir).length} files checked)`);
