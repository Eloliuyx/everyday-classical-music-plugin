# Changelog

## 1.0.1 — 2026-09-23

URL validation and replacement only.

- Checked all 366 YouTube links and replaced 16 inaccessible URLs (15 unavailable, 1 private) with verified links to the same musical works.
- Preserved every date-to-work mapping, title, composer, and the remaining 350 URLs.
- Added a reusable maintenance checker and [the full audit and replacement report](reports/youtube-links-2026-09-23/YOUTUBE_LINK_AUDIT_SUMMARY.md).
- No product features, settings, note-writing behavior, or runtime network behavior changed. Previously inserted note links are not rewritten by this update.

Validation: production build passed; all 366 mappings preserved; the built plugin differs from the previous production artifact only in the 16 URLs. Link checks used public metadata, without downloading media.
