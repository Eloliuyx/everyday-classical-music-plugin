const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { test } = require('node:test');
const { pathToFileURL } = require('node:url');
const script = resolve(__dirname, '../scripts/prepare-release.mjs');

function fixture(t) {
    const root = mkdtempSync(join(tmpdir(), 'everyday-release-test-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const json = (name, value) => writeFileSync(join(root, name), JSON.stringify(value));
    json('manifest.json', { id: 'everyday-classical-music', version: '1.1.0', minAppVersion: '0.9.12' });
    json('package.json', { version: '1.1.0' });
    json('package-lock.json', { version: '1.1.0', packages: { '': { version: '1.1.0' } } });
    json('versions.json', { '1.1.0': '0.9.12' });
    writeFileSync(join(root, 'CHANGELOG.md'), '# Changelog\n\n## 1.1.0 — 2026-09-23\n\nNew release notes.\n\n## 1.0.1 — 2026-09-22\n\nOld notes.\n');
    writeFileSync(join(root, 'main.js'), 'const plugin = true;\n');
    writeFileSync(join(root, 'styles.css'), '.plugin { color: inherit; }\n');
    return { root, json };
}

test('release staging preserves all asset bytes and includes only this version’s notes', async t => {
    const { root } = fixture(t);
    const { prepareRelease } = await import(pathToFileURL(script).href);
    const output = prepareRelease('1.1.0', root);
    for (const file of ['main.js', 'manifest.json', 'styles.css']) {
        assert.deepEqual(readFileSync(join(root, file)), readFileSync(join(output, file)));
    }
    assert.equal(readFileSync(join(output, 'release-notes.md'), 'utf8'), 'New release notes.\n');
});

test('release staging rejects invalid tags, mismatched versions, and missing compatibility metadata before copying', async t => {
    const { root, json } = fixture(t);
    const { prepareRelease } = await import(pathToFileURL(script).href);
    for (const tag of ['v1.1.0', '1.1', '01.1.0', '1.1.0-beta', '1.0.1']) {
        assert.throws(() => prepareRelease(tag, root));
        assert.equal(existsSync(join(root, 'release-assets')), false);
    }
    json('versions.json', { '1.1.0': '1.0.0' });
    assert.throws(() => prepareRelease('1.1.0', root), /minimum app version/);
    assert.equal(existsSync(join(root, 'release-assets')), false);
});

test('release staging requires release notes and every installable file', async t => {
    const { root } = fixture(t);
    const { prepareRelease } = await import(pathToFileURL(script).href);
    rmSync(join(root, 'styles.css'));
    assert.throws(() => prepareRelease('1.1.0', root), /ENOENT/);
    writeFileSync(join(root, 'styles.css'), 'body {}');
    writeFileSync(join(root, 'CHANGELOG.md'), '## Unreleased\nDraft notes.\n');
    assert.throws(() => prepareRelease('1.1.0', root), /dated changelog/);
    assert.equal(existsSync(join(root, 'release-assets')), false);
});

for (const scenario of ['published', 'unavailable', 'missing', 'draft']) {
    test(`draft uploader handles ${scenario} releases without touching published assets`, t => {
        const { root } = fixture(t);
        const bin = join(root, 'bin');
        mkdirSync(bin);
        const log = join(root, 'calls.jsonl');
        const marker = join(root, 'created');
        const fakeGh = `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
fs.appendFileSync(process.env.TEST_LOG, JSON.stringify(args) + '\\n');
if (args[0] === 'api') {
    const state = process.env.TEST_SCENARIO;
    if (state === 'unavailable') { console.error('HTTP 503'); process.exit(1); }
    if (!args.includes('repos/test/repo/releases?per_page=100') || !args.includes('--paginate') || !args.includes('--slurp')) { console.error('HTTP 404'); process.exit(1); }
    if (state === 'missing' && !fs.existsSync(process.env.TEST_CREATED)) { console.log('[[]]'); process.exit(0); }
    console.log(JSON.stringify([[], [{ tag_name: '1.1.0', draft: state !== 'published' }]]));
} else if (args[0] === 'release' && args[1] === 'create') {
    fs.writeFileSync(process.env.TEST_CREATED, 'yes');
}
`;
        writeFileSync(join(bin, 'gh'), fakeGh, { mode: 0o755 });
        const result = spawnSync(process.execPath, [resolve(__dirname, '../scripts/draft-release.mjs')], {
            cwd: root, encoding: 'utf8',
            env: { ...process.env, PATH: bin + require('node:path').delimiter + process.env.PATH,
                RELEASE_VERSION: '1.1.0', GITHUB_REPOSITORY: 'test/repo', TEST_SCENARIO: scenario,
                TEST_LOG: log, TEST_CREATED: marker },
        });
        const calls = readFileSync(log, 'utf8').trim().split('\n').map(line => JSON.parse(line));
        if (['published', 'unavailable'].includes(scenario)) {
            assert.notEqual(result.status, 0);
            assert.equal(calls.some(args => args[0] === 'release'), false);
        } else {
            assert.equal(result.status, 0, result.stderr);
            assert.equal(calls.filter(args => args[0] === 'release' && args[1] === 'upload').length, 1);
            assert.ok(calls.find(args => args[0] === 'release' && args[1] === (scenario === 'missing' ? 'create' : 'edit')).includes('--draft'));
        }
    });
}
