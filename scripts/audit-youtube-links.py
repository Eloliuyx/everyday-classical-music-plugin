#!/usr/bin/env python3
"""Audit public YouTube watch-page metadata without downloading media.

Python 3.10+, standard library only. The reported `playable` status means
YouTube returned playabilityStatus=OK in this environment at checked_at;
it does not certify playback in every region, nor verify the musical content.
No cookies, authentication, proxy rotation, or restriction bypass is used.
"""
import argparse
import concurrent.futures
import csv
import datetime as dt
import hashlib
import json
from pathlib import Path
import re
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter


def utcnow():
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")


def load_items(source):
    text = source.read_text(encoding="utf-8")
    match = re.search(r"const embeddedMusicData[^=]*=\s*(\{.*?\n\});", text, re.S)
    if not match:
        raise ValueError("Could not locate the embeddedMusicData JSON object")
    data = json.loads(match.group(1))
    return [{"date": date, "title": value["name"], "creator": value["author"],
             "url": value["link"]} for date, value in data.items()]


def video_id(url):
    parsed = urllib.parse.urlparse(url)
    host = (parsed.hostname or "").lower()
    if parsed.scheme not in ("http", "https"):
        return None
    if host == "youtu.be":
        candidate = parsed.path.strip("/")
    elif host in ("youtube.com", "www.youtube.com", "m.youtube.com"):
        candidate = urllib.parse.parse_qs(parsed.query).get("v", [""])[0] if parsed.path == "/watch" else ""
    else:
        return None
    return candidate if re.fullmatch(r"[A-Za-z0-9_-]{11}", candidate) else None


def text_parts(value):
    if isinstance(value, dict):
        for key, child in value.items():
            if key in ("simpleText", "text") and isinstance(child, str):
                yield child
            elif isinstance(child, (dict, list)):
                yield from text_parts(child)
    elif isinstance(value, list):
        for child in value:
            yield from text_parts(child)


def classify(status, message):
    value = message.lower()
    if status == "OK":
        return "playable"
    # Bot challenges and transport errors are never evidence of a dead video.
    if any(part in value for part in ("not a bot", "confirm you’re not", "confirm you're not", "too many requests", "unusual traffic")):
        return "rate_limited_or_uncertain"
    if "private" in value:
        return "private"
    if any(part in value for part in ("your country", "your region", "not available in this country", "geo restricted")):
        return "geo_restricted"
    if status in ("LOGIN_REQUIRED", "AGE_CHECK_REQUIRED", "AGE_VERIFICATION_REQUIRED", "CONTENT_CHECK_REQUIRED"):
        return "age_or_login_restricted"
    if any(part in value for part in ("age-restricted", "confirm your age", "sign in", "log in")):
        return "age_or_login_restricted"
    if status in ("ERROR", "UNPLAYABLE") and any(part in value for part in (
        "unavailable", "not available", "removed", "deleted", "terminated", "copyright", "does not exist"
    )):
        return "deleted_or_unavailable"
    return "rate_limited_or_uncertain"


class Checker:
    def __init__(self, interval, timeout):
        self.interval, self.timeout = interval, timeout
        self.lock = threading.Lock()
        self.next_request = 0.0
        self.stop = threading.Event()

    def check(self, item):
        result = {**item, "video_id": video_id(item["url"]), "checked_at": utcnow(),
                  "method": "youtube_public_watch_page", "status": "rate_limited_or_uncertain",
                  "youtube_status": "", "returned_title": "", "channel": "", "channel_id": "",
                  "duration_seconds": "", "error_message": "", "http_status": ""}
        if not result["video_id"]:
            result.update(status="invalid_url", error_message="Not a supported YouTube video URL")
            return result
        with self.lock:
            if self.stop.is_set():
                result["error_message"] = "Not requested: stopped after HTTP 429 to respect rate limit"
                return result
            time.sleep(max(0, self.next_request - time.monotonic()))
            self.next_request = time.monotonic() + self.interval
        url = "https://www.youtube.com/watch?" + urllib.parse.urlencode({"v": result["video_id"], "hl": "en"})
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Accept-Language": "en-US,en;q=0.9"})
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as response:
                result["http_status"] = response.status
                html = response.read(6_000_000).decode("utf-8", errors="replace")
            match = re.search(r"(?:var\s+)?ytInitialPlayerResponse\s*=\s*", html)
            if not match:
                result["error_message"] = "No public player status found (possibly consent or challenge page)"
                return result
            data = json.JSONDecoder().raw_decode(html[match.end():])[0]
            play = data.get("playabilityStatus", {})
            details = data.get("videoDetails", {})
            message = " | ".join(dict.fromkeys([play.get("reason", ""), *text_parts(play.get("errorScreen", {}))]))
            result.update(youtube_status=play.get("status", ""), returned_title=details.get("title", ""),
                          channel=details.get("author", ""), channel_id=details.get("channelId", ""),
                          duration_seconds=details.get("lengthSeconds", ""), error_message=message.strip(" |"),
                          checked_at=utcnow())
            result["status"] = classify(result["youtube_status"], result["error_message"])
            if details.get("videoId") and details["videoId"] != result["video_id"]:
                result.update(status="rate_limited_or_uncertain", error_message="Returned video ID does not match requested ID")
        except urllib.error.HTTPError as error:
            result.update(http_status=error.code, error_message=f"HTTP {error.code}: {error.reason}")
            if error.code == 429:
                self.stop.set()
        except Exception as error:
            result["error_message"] = f"{type(error).__name__}: {error}"
        return result


def write_reports(out, records, metadata):
    out.mkdir(parents=True, exist_ok=True)
    counts = dict(Counter(row["status"] for row in records))
    payload = {**metadata, "finished_at": utcnow(), "total": len(records), "counts": counts, "items": records}
    (out / "youtube-link-audit.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if records:
        with (out / "youtube-link-audit.csv").open("w", encoding="utf-8-sig", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=list(records[0]), lineterminator="\n")
            writer.writeheader()
            writer.writerows(records)
    lines = ["# YouTube link audit", "", f"Checked: {payload['finished_at']}",
             f"Source SHA-256: `{metadata['source_sha256']}`", "",
             "Metadata only; no media downloaded. `playable` means the public YouTube watch page returned status OK in this environment at the recorded time. It does not guarantee playback elsewhere or certify the recording matches the work.", "",
             "| Status | Count |", "| --- | ---: |"]
    lines.extend(f"| {status} | {count} |" for status, count in sorted(counts.items()))
    lines.extend(["", "## Links needing review", "", "| Date | Work | Status | Evidence |", "| --- | --- | --- | --- |"])
    for row in records:
        if row["status"] != "playable":
            clean = lambda s: str(s).replace("|", "/").replace("\n", " ")
            lines.append(f"| {row['date']} | [{clean(row['title'])} — {clean(row['creator'])}]({row['url']}) | {row['status']} | {clean(row['error_message'])} |")
    (out / "YOUTUBE_LINK_AUDIT_SUMMARY.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=Path(__file__).resolve().parents[1] / "main.ts")
    parser.add_argument("--items-json", type=Path, help="Optional array of date/title/creator/url records")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--interval", type=float, default=1.2, help="Minimum seconds between request starts")
    parser.add_argument("--timeout", type=float, default=20)
    parser.add_argument("--workers", type=int, choices=(1, 2), default=2)
    parser.add_argument("--resume", action="store_true")
    args = parser.parse_args()
    if args.interval < 1:
        parser.error("Use at least one second between request starts")
    source = args.items_json or args.source
    items = json.loads(source.read_text(encoding="utf-8")) if args.items_json else load_items(source)
    metadata = {"started_at": utcnow(), "source": str(source), "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
                "method": "youtube_public_watch_page", "request_interval_seconds": args.interval}
    args.output.mkdir(parents=True, exist_ok=True)
    progress = args.output / "progress.jsonl"
    existing = {}
    if args.resume and progress.exists():
        for line in progress.read_text(encoding="utf-8").splitlines():
            try:
                row = json.loads(line)
                existing[(row["date"], row["url"])] = row
            except (ValueError, KeyError):
                continue
    else:
        progress.write_text("", encoding="utf-8")
    pending = [item for item in items if (item["date"], item["url"]) not in existing]
    checker = Checker(args.interval, args.timeout)
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = [executor.submit(checker.check, item) for item in pending]
        for future in concurrent.futures.as_completed(futures):
            row = future.result()
            existing[(row["date"], row["url"])] = row
            with progress.open("a", encoding="utf-8") as handle:
                handle.write(json.dumps(row, ensure_ascii=False) + "\n")
            count = len(existing)
            if row["status"] != "playable" or count % 25 == 0:
                print(json.dumps({"checked": count, "total": len(items), "date": row["date"], "status": row["status"],
                                  "title": row["title"], "error": row["error_message"]}, ensure_ascii=False), flush=True)
    records = [existing[(item["date"], item["url"])] for item in items]
    write_reports(args.output, records, metadata)
    print(json.dumps({"complete": len(records), "counts": dict(Counter(row["status"] for row in records))}), flush=True)


if __name__ == "__main__":
    main()
