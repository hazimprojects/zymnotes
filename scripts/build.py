#!/usr/bin/env python3
"""
ZymNotes build system.
Reads content/*.yaml → generates notes/*.html, updates sw.js precache list.

Usage: python scripts/build.py [--all] [content/bab-X-Y.yaml ...]
  --all   Force regenerate all files even if HTML is up-to-date.
"""

from __future__ import annotations
import json
import re
import sys
from pathlib import Path

# Allow importing sibling scripts
sys.path.insert(0, str(Path(__file__).parent))

import yaml
from content_parser import load_content_file, is_subtopik, get_fail_ini
from html_generator import gen_page_subtopik, gen_page_bab

ROOT = Path(__file__).parent.parent
CONTENT_DIR = ROOT / "content"
NOTES_DIR = ROOT / "notes"
SW_PATH = ROOT / "sw.js"
VERSIONS_PATH = ROOT / "data" / "asset-versions.json"


def load_asset_versions() -> dict:
    with open(VERSIONS_PATH, encoding="utf-8") as f:
        return json.load(f)


def needs_rebuild(yaml_path: Path, html_path: Path, force: bool) -> bool:
    if force:
        return True
    if not html_path.exists():
        return True
    return yaml_path.stat().st_mtime > html_path.stat().st_mtime


def build_file(yaml_path: Path, av: dict, force: bool = False):
    """Build one YAML → HTML.

    Returns:
      True     – file has passthrough: true, skipped intentionally
      None     – HTML already up-to-date, nothing written
      Path     – HTML was (re)generated at this path
    """
    data = load_content_file(yaml_path)

    if data.get("passthrough"):
        return True  # HTML managed manually; skip generation

    fail_ini = get_fail_ini(data)
    out_path = NOTES_DIR / fail_ini

    if not needs_rebuild(yaml_path, out_path, force):
        return None

    if is_subtopik(data):
        html = gen_page_subtopik(data, av)
    else:
        html = gen_page_bab(data, av)

    out_path.write_text(html, encoding="utf-8")
    return out_path


def update_sw_precache(generated_html: list[Path]) -> None:
    """Update the notes/bab-*.html entries in sw.js PRECACHE_URLS.

    Strategy: parse the full PRECACHE_URLS array, remove all '/notes/bab-*'
    entries, add fresh sorted notes entries at the end, then rewrite the block.
    Quiz entries and CSS/JS entries are left untouched.
    """
    sw_text = SW_PATH.read_text(encoding="utf-8")

    # New notes entries (no trailing comma — JS array trailing comma is handled below)
    new_notes = sorted(f"  '/notes/{p.name}'" for p in generated_html)

    # Find the PRECACHE_URLS array boundaries
    start_match = re.search(r'const PRECACHE_URLS\s*=\s*\[', sw_text)
    end_match = re.search(r'\n\];', sw_text)
    if not start_match or not end_match:
        print("  [warn] Could not locate PRECACHE_URLS in sw.js.")
        return

    array_start = start_match.end()  # index right after '['
    array_end = end_match.start()    # index of '\n' before '];'

    # Extract current array body and split into lines
    array_body = sw_text[array_start:array_end]
    lines = array_body.split('\n')

    # Keep all lines that are NOT '/notes/bab-*' entries
    kept_lines = []
    for line in lines:
        stripped = line.strip().strip(',').strip("'")
        if re.match(r'/notes/bab-', stripped):
            continue  # drop — will be replaced
        kept_lines.append(line)

    # Remove trailing empty lines at the end of kept_lines
    while kept_lines and not kept_lines[-1].strip():
        kept_lines.pop()

    # Ensure the last kept entry has a trailing comma (needed before new entries)
    if kept_lines:
        last = kept_lines[-1]
        if last.strip() and not last.rstrip().endswith(','):
            kept_lines[-1] = last.rstrip() + ','

    # Build new array body
    new_array_body = '\n'.join(kept_lines)
    if kept_lines:
        new_array_body += '\n'
    new_array_body += '\n'.join(new_notes)

    # Reconstruct sw.js
    new_sw = (
        sw_text[:array_start] +
        new_array_body +
        sw_text[array_end:]
    )
    SW_PATH.write_text(new_sw, encoding="utf-8")


def main() -> None:
    args = sys.argv[1:]
    force = "--all" in args
    explicit_files = [Path(a) for a in args if not a.startswith("--")]

    if explicit_files:
        yaml_files = explicit_files
    else:
        if not CONTENT_DIR.exists():
            print(f"content/ directory not found at {CONTENT_DIR}")
            sys.exit(1)
        yaml_files = sorted(CONTENT_DIR.glob("*.yaml"))

    if not yaml_files:
        print("No YAML content files found.")
        sys.exit(0)

    av = load_asset_versions()
    NOTES_DIR.mkdir(exist_ok=True)

    generated: list[Path] = []
    passthrough = 0
    skipped = 0
    errors = 0

    for yf in yaml_files:
        try:
            result = build_file(yf, av, force=force)
            if result is True:  # passthrough sentinel
                passthrough += 1
            elif result:
                generated.append(result)
                print(f"  built  {result.name}")
            else:
                skipped += 1
        except Exception as exc:
            print(f"  ERROR  {yf.name}: {exc}")
            errors += 1

    print(f"\nDone: {len(generated)} built, {skipped} skipped, {passthrough} passthrough, {errors} errors.")

    if generated:
        # Get all notes HTML for sw.js update (not just newly generated)
        all_notes_html = sorted(NOTES_DIR.glob("bab-*.html"))
        update_sw_precache(all_notes_html)
        print(f"sw.js precache updated ({len(all_notes_html)} note pages).")

    if errors:
        sys.exit(1)


if __name__ == "__main__":
    main()
