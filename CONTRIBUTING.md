# Contributing

Bug reports, documentation improvements, and corrections to unavailable recordings are welcome. Use [GitHub issues](https://github.com/Eloliuyx/everyday-classical-music-plugin/issues) or open a pull request.

## Manual installation

Download `main.js`, `manifest.json`, and `styles.css` from a [published release](https://github.com/Eloliuyx/everyday-classical-music-plugin/releases). Put all three files inside `yourVault/.obsidian/plugins/everyday-classical-music/`, reload Obsidian, and enable the plugin under Community plugins.

## Development

Use Node.js 22 LTS and npm. From a clone of this repository:

```sh
npm ci
npm run lint
npm test
npm run build
```

The lockfile records the development dependencies. `npm run dev` rebuilds while editing. Only `main.js`, `manifest.json`, and `styles.css` belong in an installed plugin; build tools and tests are not shipped.

## Testing changes that write notes

Automated tests run against in-memory notes and mocked Obsidian APIs. They cover startup, backfill, preservation of existing notes, error handling, cleanup, and both settings interfaces. They do not replace testing in the actual application.

Create a disposable vault containing synthetic notes and the current production build:

```sh
npm run build
node scripts/create-test-vault.mjs /absolute/path/to/a-new-test-vault
```

The script refuses to overwrite an existing directory. Open the new folder as a vault in Obsidian, enable community plugins if prompted, and follow `START-HERE.md` inside it. Record the Obsidian version and results. Check an older version’s settings page and, when available, Obsidian 1.13+ settings search. Do not use a personal vault for development tests.

Preserve these behaviors when making changes:

- Startup and upgrades must not backfill existing notes, including when an older installation saved `backfillExistingNotes: true`.
- Backfill requires a user click. Existing music blocks and their original links remain intact. Preserve frontmatter and the note body.
- New Markdown notes named `YYYY-MM-DD` still receive music after the vault has loaded.
- Both settings interfaces use the same controls and actions; search indexing has no side effects.
- Keep the 366 month/day mappings, work titles, and composers unless a change explicitly calls for altering them.
- Keep network activity and vault access accurately described in the README.

## Reporting bugs and unavailable recordings

Include the plugin version, Obsidian version, operating system, steps to reproduce, and what you expected. For note-writing bugs, provide a minimal synthetic example rather than a private vault. For a broken recording, include the date, original URL, and a replacement for the same musical work if you have one.

Maintainers can explicitly check public video metadata with:

```sh
python3 scripts/audit-youtube-links.py --output /tmp/everyday-music-link-audit
```

This command makes network requests and can take several minutes. Review uncertain results and musical identity manually before changing URLs. A metadata check does not guarantee playback in every region. The checker is not part of the installed plugin.

## Releasing

1. Complete the checks above and the actual-application checks in a disposable vault.
2. Update the version consistently in `package.json`, `package-lock.json`, `manifest.json`, and `versions.json`. Add a dated section to `CHANGELOG.md`. Keep the plugin ID unchanged.
3. Commit the release source and push a version tag such as `1.1.0` (without a `v` prefix). The tag must identify the exact source being released.
4. The **Release** workflow validates metadata, runs lint/tests/build, attests all three installable files, and creates a **draft** GitHub release. It never publishes automatically and refuses to replace assets of a published release. A failed run can be retried for the same tag while its release is still a draft.
5. Review the draft, download the files, and verify each with `gh attestation verify FILE --repo Eloliuyx/everyday-classical-music-plugin`. Confirm the source commit and tag shown by verification match the release. Test those downloaded files in the disposable vault.
6. Merge the release source to `main` and publish the reviewed draft as the latest release. Retain the attested assets unchanged. The community directory checks published releases; draft releases are not an Obsidian update.

If the built files need changes, commit the fix and use a new version tag instead of moving a tag that already produced attestations. No signing keys or personal access token are needed in repository secrets: the workflow uses GitHub’s short-lived credentials.

## Release verification

The release workflow builds from a version tag, runs automated checks, and generates GitHub artifact attestations for `main.js`, `manifest.json`, and `styles.css` before attaching those same files to a draft release. This workflow is introduced with 1.1.2; older releases do not have these attestations.

After downloading a file from a release, its provenance can be checked with the [GitHub CLI](https://cli.github.com/manual/gh_attestation_verify), for example:

```sh
gh attestation verify main.js --repo Eloliuyx/everyday-classical-music-plugin
```

An attestation establishes where and how a file was built. It is not a malware scan or a network-behavior scan. If the community scorecard says either scan is unavailable, that is not a completed scan and cannot be resolved by changing this plugin’s disclosures. Scorecard results update after the directory reviews a published release.
