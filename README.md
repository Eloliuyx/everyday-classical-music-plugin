# Everyday Classical Music Plugin

The **Everyday Classical Music Plugin** for Obsidian introduces a different piece of classical music each day with a YouTube link in your daily notes. They are the first 366 pieces (randomized) recommended by [this document](https://docs.google.com/document/d/18t_9MHZTENbmYdezAAj4LRM0-Eak_MYO1HssZW2FX1U/edit).


## Features

- Automatically adds a classical music piece to newly created daily notes.
- Selects music pieces from a built-in curated list based on the date, ensuring the same suggestion for the same date in different years.
- Provides a manual, one-time action to backfill existing daily notes with music links.
- Allows removal of music links added before a specified date.

## Installation

In Obsidian, open **Settings → Community plugins → Browse**, search for **Everyday Classical Music**, then install and enable it.

For manual installation, download `main.js`, `manifest.json`, and `styles.css` from a [published release](https://github.com/Eloliuyx/everyday-classical-music-plugin/releases). Place all three files inside `yourVault/.obsidian/plugins/everyday-classical-music/`, reload Obsidian, and enable the plugin. Development setup is documented in [CONTRIBUTING.md](CONTRIBUTING.md).

## Usage

### Default Behavior

The plugin automatically adds music only to newly created Markdown notes named `YYYY-MM-DD`, after the vault has finished loading. Starting, restarting, or upgrading the plugin never runs backfill, even if the old backfill toggle was previously enabled. Existing music blocks and their links are preserved.

### Settings

On Obsidian 1.13.0 or later, these settings can be found in the app’s settings search, including aliases such as **backfill**, **补填**, **删除音乐**, and **赞助**. Earlier versions continue to use the plugin’s settings page. Searching or opening settings never modifies notes.

- **Backfill Existing Notes:**
  - Click **Backfill now** to run one pass over Markdown notes named `YYYY-MM-DD` throughout the vault.
  - Notes with an existing Daily Classical Music block are skipped. You can run this again later; it is not a scheduled or persistent setting.
  - If you manually removed a music block, restarting will leave that note alone. Explicitly running backfill will add music to it again.
  - A completion notice reports added, skipped, and failed notes. A failure in one note does not stop the remaining notes, and failed notes can be retried.
  - Notes without frontmatter receive the music block at the beginning. Valid frontmatter and existing note text are preserved; unclosed frontmatter is skipped and reported as a failure.

- **Remove Links Before Date:**
  - Enter a cutoff date in `YYYY-MM-DD` format. Cleanup uses the date in each note’s filename, not the date a link was inserted.
  - Click **Remove links** to remove the plugin’s standard `tip` music blocks from notes dated before the cutoff. Other callout styles and the rest of each note are retained.

- **Feed the Markhor:**
  - Click the "Feed the Markhor 🦌🪽" button to support the plugin developer on Ko-fi.

## Privacy, network access, and vault access

- **Local music list:** all 366 date-to-work mappings and YouTube URLs are bundled with the plugin. The installed plugin makes no background network requests, collects no analytics, and does not upload notes or settings.
- **External links:** clicking a music link opens YouTube. Clicking **Feed the Markhor** opens [Ko-fi](https://ko-fi.com/flyingmarkhor). Those sites make their own requests and apply their own privacy policies. Merely opening the plugin’s settings does not open either site.
- **New notes:** after the vault finishes loading, the plugin reads newly created Markdown notes named `YYYY-MM-DD` and inserts a music block if one is absent.
- **Existing notes:** clicking **Backfill now** or **Remove links** lists Markdown files throughout the vault and reads or modifies matching daily notes. Matching is by filename, including notes in subfolders; it is not limited to the Daily Notes plugin’s configured folder. This explains the community scorecard’s **Vault Enumeration** capability. The plugin never deletes note files.
- **Stored settings:** the cutoff date is saved locally in the plugin’s `data.json`. Old saved automatic-backfill flags are ignored. Restarting or upgrading does not backfill existing notes.

The repository also contains a maintainer-only YouTube audit script. It contacts YouTube only when someone explicitly runs it; it is not shipped in the installed plugin.

## Release verification

The release workflow builds from a version tag, runs automated checks, and generates GitHub artifact attestations for `main.js`, `manifest.json`, and `styles.css` before attaching those same files to a draft release. This workflow is introduced with 1.1.1; older releases do not have these attestations.

After downloading a file from a release, its provenance can be checked with the [GitHub CLI](https://cli.github.com/manual/gh_attestation_verify), for example:

```sh
gh attestation verify main.js --repo Eloliuyx/everyday-classical-music-plugin
```

An attestation establishes where and how a file was built. It is not a malware scan or a network-behavior scan. If the community scorecard says either scan is unavailable, that is not a completed scan and cannot be resolved by changing this plugin’s disclosures. Scorecard results update after the directory reviews a published release.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development, testing, link corrections, and release instructions.
