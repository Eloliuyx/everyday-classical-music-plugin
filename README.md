# Everyday Classical Music

Bring a little classical music to your daily notes. **Everyday Classical Music** adds a daily selection with the work's title, composer, and a YouTube link.

Explore a built-in collection of 366 works. Each calendar date has a fixed selection, so the same month and day brings back the same piece each year.

## Features

- Automatically add music to new daily notes named `YYYY-MM-DD`.
- Add missing music to existing daily notes with **Backfill now**.
- Keep existing music blocks and their original links intact.
- Remove music blocks from daily notes before a date you choose.

## Get started

1. In Obsidian, open **Settings → Community plugins → Browse**.
2. Search for **Everyday Classical Music**, then install and enable it.
3. Create a new daily note named `YYYY-MM-DD`, such as `2026-09-23`.

The plugin matches daily notes by filename, including notes in subfolders. Your Daily Notes date format should be `YYYY-MM-DD`.

## Settings

**Backfill existing notes** — Click **Backfill now** to add music where it is missing. Existing music blocks are skipped, and a notice reports the results. You can run it again later without creating duplicates.

Backfill only runs when you click the button. Starting, restarting, or upgrading the plugin never backfills old notes. If you remove a music block yourself, it stays removed until you explicitly run backfill again.

**Remove music links** — Enter a cutoff date and click **Remove links**. This removes the plugin's standard `tip` music blocks from notes dated before that day. The cutoff uses the date in the note's filename. Note files, other callout types, and the rest of the note's content are retained.

**Feed the Markhor** — Open the author's Ko-fi page to support development.

On Obsidian 1.13 or later, you can also find these controls through settings search using terms such as **backfill**, **remove links**, and **support**.

## Privacy and access

- The music collection is stored locally. The plugin makes no background network requests, collects no analytics, and does not upload notes or settings.
- YouTube opens when you click a music link. Ko-fi opens when you click the support button. These external sites apply their own privacy policies.
- The plugin reads and updates matching new daily notes. Manual backfill and cleanup list Markdown files throughout the vault and read or update matching daily notes, including those in subfolders. This is the vault access needed for those features.
- The cutoff date is saved locally. The plugin never deletes note files.

## Music collection

The collection is based on the first 366 works in [this classical music recommendation list](https://docs.google.com/document/d/18t_9MHZTENbmYdezAAj4LRM0-Eak_MYO1HssZW2FX1U/edit), arranged into a fixed daily selection.

## Help and contributions

Report a problem or suggest a replacement recording through [GitHub issues](https://github.com/Eloliuyx/everyday-classical-music-plugin/issues). For manual installation, development, and release verification, see the [contribution guide](CONTRIBUTING.md).
