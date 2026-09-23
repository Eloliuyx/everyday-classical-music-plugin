import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function prepareRelease(version, root = process.cwd()) {
    assert.match(version ?? '', /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/, 'Use a version tag without a v prefix.');
    const readJson = name => JSON.parse(readFileSync(resolve(root, name), 'utf8'));
    const manifest = readJson('manifest.json');
    const pkg = readJson('package.json');
    const lock = readJson('package-lock.json');
    const versions = readJson('versions.json');
    assert.equal(manifest.id, 'everyday-classical-music', 'The installed plugin ID must not change.');
    for (const value of [manifest.version, pkg.version, lock.version, lock.packages[''].version]) {
        assert.equal(value, version, 'The tag and all package versions must match.');
    }
    assert.equal(versions[version], manifest.minAppVersion, 'versions.json must include the declared minimum app version.');

    const changelog = readFileSync(resolve(root, 'CHANGELOG.md'), 'utf8');
    const section = changelog.split(/^## /m).find(part => part.startsWith(`${version} — `));
    assert.ok(section, 'A dated changelog section is required.');
    const notes = section.slice(section.indexOf('\n') + 1).trim();
    assert.ok(notes, 'Release notes must not be empty.');
    const files = ['main.js', 'manifest.json', 'styles.css'];
    for (const file of files) assert.ok(statSync(resolve(root, file)).size > 0, `${file} must not be empty.`);

    const destination = resolve(root, 'release-assets');
    mkdirSync(destination, { recursive: true });
    for (const file of files) copyFileSync(resolve(root, file), resolve(destination, file));
    writeFileSync(resolve(destination, 'release-notes.md'), notes + '\n');
    return destination;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    console.log(prepareRelease(process.argv[2]));
}
