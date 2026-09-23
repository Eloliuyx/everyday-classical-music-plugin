import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';

const version = process.env.RELEASE_VERSION;
const repository = process.env.GITHUB_REPOSITORY;
assert.match(version ?? '', /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
assert.ok(repository, 'GITHUB_REPOSITORY is required.');
const endpoint = `repos/${repository}/releases/tags/${version}`;
const response = spawnSync('gh', ['api', endpoint], { encoding: 'utf8' });
const gh = args => execFileSync('gh', args, { stdio: 'inherit' });
const notes = 'release-assets/release-notes.md';
const title = `${version} — Everyday Classical Music`;

if (response.status === 0) {
    const release = JSON.parse(response.stdout);
    assert.equal(release.draft, true, 'Refusing to change a published release.');
    gh(['release', 'edit', version, '--repo', repository, '--draft', '--title', title, '--notes-file', notes]);
} else {
    // Authentication, permission, and network failures must not be treated as a missing release.
    assert.ok(response.status !== null && /HTTP 404/.test(response.stderr), response.stderr || 'Release lookup failed.');
    gh(['release', 'create', version, '--repo', repository, '--verify-tag', '--draft', '--title', title, '--notes-file', notes]);
}

// Check again immediately before replacing any draft assets.
const current = JSON.parse(execFileSync('gh', ['api', endpoint], { encoding: 'utf8' }));
assert.equal(current.draft, true, 'Refusing to change assets of a published release.');
gh(['release', 'upload', version, '--repo', repository, '--clobber',
    'release-assets/main.js', 'release-assets/manifest.json', 'release-assets/styles.css']);
