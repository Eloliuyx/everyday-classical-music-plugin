import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const requested = process.argv[2];
assert.ok(requested && isAbsolute(requested), 'Provide an absolute path to a NEW test vault.');
const destination = resolve(requested);
assert.ok(!existsSync(destination), 'Refusing to overwrite an existing directory.');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
for (const file of ['main.js', 'manifest.json', 'styles.css']) {
    assert.ok(existsSync(join(root, file)), `Missing ${file}; run npm run build first.`);
}
const pluginDir = join(destination, '.obsidian/plugins/everyday-classical-music');
mkdirSync(pluginDir, { recursive: true });
for (const file of ['main.js', 'manifest.json', 'styles.css']) copyFileSync(join(root, file), join(pluginDir, file));
writeFileSync(join(destination, '.obsidian/community-plugins.json'), JSON.stringify(['everyday-classical-music']));
// Deliberately model the old saved toggle: loading this must not backfill anything.
writeFileSync(join(pluginDir, 'data.json'), JSON.stringify({ backfillExistingNotes: true, removeLinksBeforeDate: '2026-01-03' }));
const fixtures = {
    '2026-01-01.md': '# Plain note\n\nKeep this body exactly as written.\n',
    '2026-01-02.md': '---\ntags: [test]\n---\n\nKeep this frontmatter and body.\n',
    '2026-01-03.md': '> [!tip] Daily Classical Music\n> [Existing recording](https://example.com/existing-tip)\n\nKeep this existing block.\n',
    '2026-01-04.md': '> [!info] Daily Classical Music\n> [Existing recording](https://example.com/existing-info)\n\nKeep this existing block.\n',
    '2026-01-05.md': '> [!quote] Daily Classical Music\n> [Existing recording](https://example.com/existing-quote)\n\nKeep this existing block.\n',
    '2026-01-06.md': '---\ntags: [test]\nUnclosed frontmatter; leave this entire file alone.\n',
    '2026-02-30.md': '# Invalid date; leave unchanged.\n',
    'Ordinary note.md': '# Not a daily note; leave unchanged.\n',
    'Subfolder/2026-01-07.md': 'A daily note inside a subfolder.\n',
};
for (const [name, content] of Object.entries(fixtures)) {
    const path = join(destination, name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
}
const version = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8')).version;
writeFileSync(join(destination, 'START-HERE.md'), `# Everyday Classical Music ${version}: disposable test vault

All notes here are synthetic. The app checks below have not been performed by creating this folder.

1. Open this folder as a vault in Obsidian. If prompted, enable community plugins, then enable Everyday Classical Music. Record the Obsidian version below.
2. Before clicking Backfill now, verify 2026-01-01, 2026-01-02, and Subfolder/2026-01-07 still contain no music. The saved old backfill toggle is intentionally true; it must be ignored.
3. Open the plugin settings. Verify Backfill now, the cutoff date field, Remove links, and the support button appear. On Obsidian 1.13+, search settings for 补填, 删除音乐, and 赞助. Searching and opening settings must not change notes.
4. Click Backfill now once. Expect 3 added, 3 skipped, 1 failed. The failure is the intentionally unclosed frontmatter in 2026-01-06. Existing tip/info/quote blocks and other note text must remain intact.
5. Click Backfill now again. Expect 0 added, 6 skipped, 1 failed, without duplicate music blocks.
6. Delete the music block from 2026-01-01. Restart Obsidian or disable/re-enable the plugin. That block must remain absent. Clicking Backfill now explicitly may add it again.
7. Create today’s NEW Markdown daily note using the Daily Notes workflow you normally use, with the filename format YYYY-MM-DD. Verify one music block is added; record any interaction with your note template.
8. Set the cutoff to 2026-01-03 and click Remove links. Only standard tip music blocks in notes dated before that day should disappear; note bodies and later notes remain. Enter an invalid date and verify a notice appears without changing notes.
9. The support button should open Ko-fi only when clicked. Music links should open YouTube only when clicked. The placeholder existing links in this vault are deliberately example.com links, not recordings.

## Results

- Obsidian version:
- Operating system:
- Startup / upgrade behavior:
- Settings display / search:
- One-time backfill / restart:
- New daily note / template:
- Cleanup / invalid date:
- External links:
- Remaining issues:
`);
console.log(destination);
