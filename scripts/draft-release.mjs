import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const version = process.env.RELEASE_VERSION;
const repository = process.env.GITHUB_REPOSITORY;
assert.match(version ?? '', /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
assert.ok(repository, 'GITHUB_REPOSITORY is required.');
const gh = args => execFileSync('gh', args, { stdio: 'inherit' });
const notes = 'release-assets/release-notes.md';
const title = `${version} — Everyday Classical Music`;

function findRelease() {
    // The by-tag endpoint only finds published releases. Authenticated listing
    // includes drafts; paginate so an older release can never be mistaken for a missing one.
    const pages = JSON.parse(execFileSync('gh', ['api', '--paginate', '--slurp',
        `repos/${repository}/releases?per_page=100`], { encoding: 'utf8' }));
    return pages.flat().find(release => release.tag_name === version);
}

const release = findRelease();
if (release) {
    assert.equal(release.draft, true, 'Refusing to change a published release.');
    gh(['release', 'edit', version, '--repo', repository, '--draft', '--title', title, '--notes-file', notes]);
} else {
    gh(['release', 'create', version, '--repo', repository, '--verify-tag', '--draft', '--title', title, '--notes-file', notes]);
}

// Check again immediately before replacing any draft assets.
const current = findRelease();
assert.equal(current?.draft, true, 'Refusing to change assets unless this release is a draft.');
gh(['release', 'upload', version, '--repo', repository, '--clobber',
    'release-assets/main.js', 'release-assets/manifest.json', 'release-assets/styles.css']);
