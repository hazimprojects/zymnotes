#!/usr/bin/env python3
"""Sync query-string asset versions across HTML files and sw.js."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSIONS_FILE = ROOT / "data" / "asset-versions.json"
SW_FILE = ROOT / "sw.js"

HTML_PATTERNS = {
    "style.css?v=": "style_css",
    "main.js?v=": "main_js",
    "manifest.json?v=": "manifest",
}


def load_versions() -> dict[str, str]:
    raw = json.loads(VERSIONS_FILE.read_text(encoding="utf-8"))
    required = {"style_css", "main_js", "manifest"}
    missing = sorted(required - set(raw))
    if missing:
        raise ValueError(f"Missing keys in {VERSIONS_FILE}: {', '.join(missing)}")

    return {key: str(raw[key]) for key in required}


def sync_html_files(versions: dict[str, str]) -> list[Path]:
    changed: list[Path] = []
    html_files = sorted(ROOT.rglob("*.html"))

    for path in html_files:
        original = path.read_text(encoding="utf-8")
        updated = original

        for token, version_key in HTML_PATTERNS.items():
            updated = re.sub(
                rf"({re.escape(token)})[^\"'\s>]+",
                rf"\g<1>{versions[version_key]}",
                updated,
            )

        if updated != original:
            path.write_text(updated, encoding="utf-8")
            changed.append(path)

    return changed


def sync_service_worker(versions: dict[str, str]) -> bool:
    original = SW_FILE.read_text(encoding="utf-8")
    block_match = re.search(
        r"(const\s+PRECACHE_URLS\s*=\s*\[.*?\];)",
        original,
        flags=re.DOTALL,
    )
    if not block_match:
        raise ValueError("Unable to find `PRECACHE_URLS` in sw.js")

    block = block_match.group(1)
    updated_block = re.sub(
        r"(/assets/css/style\.css\?v=)[^\"']+",
        rf"\g<1>{versions['style_css']}",
        block,
    )
    updated_block = re.sub(
        r"(/assets/js/main\.js\?v=)[^\"']+",
        rf"\g<1>{versions['main_js']}",
        updated_block,
    )
    updated_block = re.sub(
        r"(/manifest\.json\?v=)[^\"']+",
        rf"\g<1>{versions['manifest']}",
        updated_block,
    )
    updated = original.replace(block, updated_block)

    if updated != original:
        SW_FILE.write_text(updated, encoding="utf-8")
        return True
    return False


def main() -> None:
    versions = load_versions()
    changed_html = sync_html_files(versions)
    changed_sw = sync_service_worker(versions)

    print(f"Updated {len(changed_html)} HTML file(s).")
    if changed_sw:
        print("Updated sw.js PRECACHE_URLS asset versions.")
    else:
        print("sw.js already in sync.")


if __name__ == "__main__":
    main()
