# YouTube link maintenance

The checker reads the embedded dataset in `main.ts` and checks the public YouTube watch-page player status. It uses Python 3.10+ and the standard library; no plugin dependency is added.

From the repository root:

```sh
python3 scripts/audit-youtube-links.py --output reports/youtube-links-YYYY-MM-DD
```

It emits CSV, JSON, a Markdown summary, and a resumable `progress.jsonl`. Use `--resume` only to continue the same run. A fresh check should use a new output directory. Requests are paced at 1.2 seconds, with at most two in flight. HTTP 429 stops new requests; do not immediately retry after a rate limit.

`playable` means the public page returned `playabilityStatus=OK` in the current environment. The script does not download media, listen to recordings, verify worldwide availability, or change links. Temporary errors and login/region restrictions are kept separate from unavailable videos. Confirm failed links separately before changing curated data.

For an independent metadata-only check, install yt-dlp in an isolated environment and run:

```sh
yt-dlp --ignore-config --no-cache-dir --no-playlist --simulate --skip-download --no-check-formats --dump-json --retries 1 --extractor-retries 1 --sleep-requests 1 'https://www.youtube.com/watch?v=VIDEO_ID'
```

Do not use cookies, authentication, proxy rotation, or restriction bypass for this audit. Match the composer, catalog/opus number, movement or complete-set scope, and recording metadata before replacing a URL. Keep the calendar keys and musical identity unchanged.
