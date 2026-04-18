#!/usr/bin/env python3
"""Sync query-string asset versions across HTML files, style.css imports, and sw.js."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSIONS_FILE = ROOT / "data" / "asset-versions.json"
SW_FILE = ROOT / "sw.js"
STYLE_FILE = ROOT / "assets" / "css" / "style.css"

# Tokens that appear in HTML <link> / <script> tags
HTML_PATTERNS = {
    "style.css?v=":     "style_css",
    "main.js?v=":       "main_js",
    "zh-mode.js?v=":    "zh_mode_js",
    "manifest.json?v=": "manifest",
}

# Tokens that appear in HTML <link rel="preload"> tags for individual CSS files
CSS_PRELOAD_PATTERNS = {
    "base.css?v=":       "base",
    "layout.css?v=":     "layout",
    "ui.css?v=":         "ui",
    "paper.css?v=":      "paper",
    "keywords.css?v=":   "keywords",
    "responsive.css?v=": "responsive",
    "themes.css?v=":     "themes",
    "lab.css?v=":        "lab",
}

# CSS filenames that appear in style.css @import lines
CSS_IMPORT_MAP = {
    "base.css":       "base",
    "layout.css":     "layout",
    "ui.css":         "ui",
    "paper.css":      "paper",
    "keywords.css":   "keywords",
    "responsive.css": "responsive",
    "themes.css":     "themes",
    "lab.css":        "lab",
}


def load_versions() -> dict:
    raw = json.loads(VERSIONS_FILE.read_text(encoding="utf-8"))
    required_top = {"style_css", "main_js", "zh_mode_js", "manifest", "sw_cache", "css"}
    missing = sorted(required_top - set(raw))
    if missing:
        raise ValueError(f"Missing keys in {VERSIONS_FILE}: {', '.join(missing)}")
    return raw


def sync_html_files(versions: dict) -> list[Path]:
    changed: list[Path] = []
    for path in sorted(ROOT.rglob("*.html")):
        original = path.read_text(encoding="utf-8")
        updated = original
        for token, key in HTML_PATTERNS.items():
            updated = re.sub(
                rf"({re.escape(token)})[^\"'\s>]+",
                rf"\g<1>{versions[key]}",
                updated,
            )
        for token, key in CSS_PRELOAD_PATTERNS.items():
            updated = re.sub(
                rf"({re.escape(token)})[^\"'\s>]+",
                rf"\g<1>{versions['css'][key]}",
                updated,
            )
        if updated != original:
            path.write_text(updated, encoding="utf-8")
            changed.append(path)
    return changed


def sync_style_imports(versions: dict) -> bool:
    """Update ?v= query strings in style.css @import lines."""
    original = STYLE_FILE.read_text(encoding="utf-8")
    updated = original
    for filename, key in CSS_IMPORT_MAP.items():
        ver = versions["css"][key]
        updated = re.sub(
            rf'({re.escape(filename)}\?v=)[^"\']+',
            rf"\g<1>{ver}",
            updated,
        )
    if updated != original:
        STYLE_FILE.write_text(updated, encoding="utf-8")
        return True
    return False


def sync_service_worker(versions: dict) -> bool:
    original = SW_FILE.read_text(encoding="utf-8")
    updated = original

    # CACHE name: hzedu-vX
    updated = re.sub(
        r"(const\s+CACHE\s*=\s*['\"])hzedu-v\d+(['\"])",
        rf"\g<1>hzedu-v{versions['sw_cache']}\2",
        updated,
    )

    # PRECACHE_URLS entries
    block_match = re.search(
        r"(const\s+PRECACHE_URLS\s*=\s*\[.*?\];)", updated, flags=re.DOTALL
    )
    if not block_match:
        raise ValueError("Unable to find `PRECACHE_URLS` in sw.js")

    block = block_match.group(1)
    new_block = re.sub(r"(/assets/css/style\.css\?v=)[^\"']+",
                       rf"\g<1>{versions['style_css']}", block)
    new_block = re.sub(r"(/assets/js/main\.js\?v=)[^\"']+",
                       rf"\g<1>{versions['main_js']}", new_block)
    new_block = re.sub(r"(/assets/js/zh-mode\.js\?v=)[^\"']+",
                       rf"\g<1>{versions['zh_mode_js']}", new_block)
    new_block = re.sub(r"(/manifest\.json\?v=)[^\"']+",
                       rf"\g<1>{versions['manifest']}", new_block)
    updated = updated.replace(block, new_block)

    if updated != original:
        SW_FILE.write_text(updated, encoding="utf-8")
        return True
    return False


def main() -> None:
    versions = load_versions()

    changed_html = sync_html_files(versions)
    changed_style = sync_style_imports(versions)
    changed_sw = sync_service_worker(versions)

    print(f"Updated {len(changed_html)} HTML file(s).")
    print(f"style.css @imports: {'updated' if changed_style else 'already in sync'}.")
    print(f"sw.js: {'updated' if changed_sw else 'already in sync'}.")


if __name__ == "__main__":
    main()
