# Changelog

## Unreleased

- Restore the centered, standalone Feed the Markhor footer shown in the original settings page, without the additional support heading or description. Keep settings search, the donation link, and keyboard focus visibility.

## 1.1.1 — 2026-09-23

- Add searchable setting definitions for Obsidian 1.13+, with English and Chinese search aliases. Keep the legacy settings page for older versions; both use the same controls and actions. Search indexing does not read or write notes.
- Pin the development-only Obsidian API definitions to 1.13.1 to type-check the new settings interface. The plugin’s minimum app version is unchanged.
- Replace the build-only `builtin-modules` dependency with Node.js's built-in module list. The generated plugin is byte-for-byte unchanged by this replacement.
- Replace the inactive author website with the author's GitHub profile.
- Replace the persistent backfill toggle with a manual **Backfill now** button. Previously saved backfill flags are ignored; startup and upgrades never trigger backfill.
- Register new-note handling after the vault finishes loading, and handle initialization, note-writing, settings-saving, and cleanup errors.
- Report backfill results, continue after individual failures, and prevent overlapping backfill runs and duplicate writes to the same note.
- Preserve existing music blocks and note text, including whitespace; insert correctly when frontmatter is absent, and leave unclosed frontmatter untouched. Link removal supports both LF and CRLF line endings.

- Document local data use, user-triggered external links, and the vault enumeration needed for manual backfill and cleanup.
- Add a contribution guide, a disposable test-vault generator, and automated lint/test/build checks.
- Build tagged releases in GitHub Actions and attach provenance attestations to all three installable files. Releases are created as drafts for review before publication.
- Keep all 366 musical works, date mappings, and URLs unchanged from 1.0.1.

The 1.1.0 tag was an unpublished packaging attempt. Its release upload failed; 1.1.1 corrects draft-release lookup and contains the maintenance changes above.

## 1.0.1 — 2026-09-23

URL validation and replacement only.

- Checked all 366 YouTube links and replaced 16 inaccessible URLs (15 unavailable, 1 private) with verified links to the same musical works.
- Preserved every date-to-work mapping, title, composer, and the remaining 350 URLs.
- Added a reusable maintenance checker and [the full audit and replacement report](reports/youtube-links-2026-09-23/YOUTUBE_LINK_AUDIT_SUMMARY.md).
- No product features, settings, note-writing behavior, or runtime network behavior changed. Previously inserted note links are not rewritten by this update.

Validation: production build passed; all 366 mappings preserved; the built plugin differs from the previous production artifact only in the 16 URLs. Link checks used public metadata, without downloading media.
