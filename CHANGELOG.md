# Changelog

## Unreleased

- Underline **Feed the Markhor** while hovered or pressed.

- Place **Feed the Markhor** in a separate, unboxed footer below the gray settings area in Obsidian 1.13+. Keep the original standalone footer on older versions.

## 1.1.2 — 2026-09-23

- Replace the persistent backfill toggle with a **Backfill now** button. Backfill runs only when clicked; startup, restart, and upgrades do not add music to existing notes, even when an older installation saved the toggle as enabled.
- Keep automatic music insertion for newly created daily notes after the vault finishes loading. Preserve existing music blocks and their original links.
- Add settings search for Obsidian 1.13+, including English and Chinese aliases. Keep the settings page available in older versions.
- Preserve frontmatter, note text, and whitespace when inserting music. Skip unclosed frontmatter, report per-note backfill results, prevent duplicate writes, and handle asynchronous errors. Cleanup supports both LF and CRLF line endings.
- Keep **Feed the Markhor** centered below the settings, with the original standalone appearance and donation link.
- Replace the inactive author website with the author's GitHub profile.
- Document network and vault access, add contribution and testing instructions, and remove the unnecessary build-only builtin-modules dependency.
- Build releases in GitHub Actions and provide provenance attestations for main.js, manifest.json, and styles.css.
- Preserve all 366 works, date mappings, and music URLs from 1.0.1. The plugin ID and minimum app version are unchanged.

Validation: 38 automated tests, lint, and production build pass. The maintainer completed testing in a separate Obsidian 1.13.7 vault, including the restored footer. The main.js and styles.css files match that tested build byte for byte.

Versions 1.1.0 and 1.1.1 were unpublished preparation builds.

## 1.0.1 — 2026-09-23

URL validation and replacement only.

- Checked all 366 YouTube links and replaced 16 inaccessible URLs (15 unavailable, 1 private) with verified links to the same musical works.
- Preserved every date-to-work mapping, title, composer, and the remaining 350 URLs.
- Added a reusable maintenance checker and [the full audit and replacement report](reports/youtube-links-2026-09-23/YOUTUBE_LINK_AUDIT_SUMMARY.md).
- No product features, settings, note-writing behavior, or runtime network behavior changed. Previously inserted note links are not rewritten by this update.

Validation: production build passed; all 366 mappings preserved; the built plugin differs from the previous production artifact only in the 16 URLs. Link checks used public metadata, without downloading media.
