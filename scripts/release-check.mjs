import { spawnSync } from 'node:child_process';

const allowDirty = process.argv.includes('--allow-dirty');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const error = new Error((result.stderr || result.stdout || '').trim() || `${command} exited with code ${result.status}`);
    error.status = result.status;
    throw error;
  }

  return (result.stdout || '').trim();
}

function fail(message) {
  console.error(`\nRelease check failed: ${message}\n`);
  process.exit(1);
}

function readOrFallback(command, fallback) {
  try {
    return run(command[0], command.slice(1));
  } catch {
    return fallback;
  }
}

const gitBin = process.platform === 'win32' ? 'git.exe' : 'git';
const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const branch = readOrFallback([gitBin, 'rev-parse', '--abbrev-ref', 'HEAD'], '');

if (!branch) {
  fail('This folder is not in a git repository.');
}

if (branch !== 'main') {
  fail(`Release thread must publish from "main". Current branch: "${branch}".`);
}

const dirtyFiles = readOrFallback([gitBin, 'status', '--porcelain'], '')
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);

if (dirtyFiles.length > 0 && !allowDirty) {
  fail(
    [
      'Working tree is not clean.',
      'Commit or stash in-progress edits before running the release thread.',
      'If you intentionally want to validate anyway, run "npm run release:check -- --allow-dirty".',
    ].join(' '),
  );
}

console.log(`\nRelease check: branch "${branch}"`);
console.log(allowDirty && dirtyFiles.length > 0 ? 'Dirty working tree allowed for this run.' : 'Working tree check passed.');

const lastCommit = readOrFallback([gitBin, 'log', '-1', '--oneline'], 'No commits found.');
console.log(`Last commit: ${lastCommit}`);

console.log('\nBuilding production bundle...');

try {
  const result = spawnSync(npmBin, ['run', 'build'], { stdio: 'inherit' });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Build exited with code ${result.status}`);
  }
} catch {
  fail('Production build failed. Fix the errors above before pushing to Vercel production.');
}

console.log('\nRelease check passed.');
console.log('Next step: push the approved "main" commit to GitHub so Vercel can deploy it to production.\n');
