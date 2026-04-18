#!/usr/bin/env python3
"""Auto-bump asset versions based on which files changed.

Usage:
  python3 scripts/bump-versions.py --staged       # pre-commit hook (staged files)
  python3 scripts/bump-versions.py --last-commit  # CI (files in latest commit)
  python3 scripts/bump-versions.py --files a b c  # explicit list
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSIONS_FILE = ROOT / "data" / "asset-versions.json"

# Map: changed file → list of version keys to bump.
# Keys with a dot (e.g. "css.ui") refer to nested JSON paths.
# "sw_cache" is always bumped when any tracked asset changes.
RULES: list[tuple[str, list[str]]] = [
    ("assets/css/base.css",       ["css.base",       "style_css", "sw_cache"]),
    ("assets/css/layout.css",     ["css.layout",     "style_css", "sw_cache"]),
    ("assets/css/ui.css",         ["css.ui",         "style_css", "sw_cache"]),
    ("assets/css/paper.css",      ["css.paper",      "style_css", "sw_cache"]),
    ("assets/css/keywords.css",   ["css.keywords",   "style_css", "sw_cache"]),
    ("assets/css/responsive.css", ["css.responsive", "style_css", "sw_cache"]),
    ("assets/css/themes.css",     ["css.themes",     "style_css", "sw_cache"]),
    ("assets/css/lab.css",        ["css.lab",        "style_css", "sw_cache"]),
    ("assets/css/style.css",      ["style_css",      "sw_cache"]),
    ("assets/js/main.js",         ["main_js",        "sw_cache"]),
    ("assets/js/zh-mode.js",      ["zh_mode_js",     "sw_cache"]),
    ("assets/js/subtopic-lab.js", ["sw_cache"]),
    ("sw.js",                     ["sw_cache"]),
    ("manifest.json",             ["manifest",       "sw_cache"]),
]


def git_staged_files() -> list[str]:
    r = subprocess.run(
        ["git", "diff", "--cached", "--name-only"],
        capture_output=True, text=True, cwd=ROOT,
    )
    return r.stdout.strip().splitlines()


def git_last_commit_files() -> list[str]:
    r = subprocess.run(
        ["git", "diff", "HEAD~1..HEAD", "--name-only"],
        capture_output=True, text=True, cwd=ROOT,
    )
    return r.stdout.strip().splitlines()


def get_nested(d: dict, key: str):
    parts = key.split(".")
    for p in parts:
        d = d[p]
    return d


def set_nested(d: dict, key: str, value: str) -> None:
    parts = key.split(".")
    for p in parts[:-1]:
        d = d[p]
    d[parts[-1]] = value


def bump_key(versions: dict, key: str) -> str:
    old = get_nested(versions, key)
    new = str(int(old) + 1)
    set_nested(versions, key, new)
    return new


def main() -> None:
    args = sys.argv[1:]

    if "--staged" in args:
        changed = git_staged_files()
    elif "--last-commit" in args:
        changed = git_last_commit_files()
    elif "--files" in args:
        idx = args.index("--files")
        changed = args[idx + 1:]
    else:
        # Default: staged (suits most local workflows)
        changed = git_staged_files()

    if not changed:
        print("No tracked asset changes detected — versions unchanged.")
        sys.exit(0)

    versions = json.loads(VERSIONS_FILE.read_text(encoding="utf-8"))
    keys_to_bump: set[str] = set()

    for f in changed:
        for pattern, keys in RULES:
            if f == pattern:
                keys_to_bump.update(keys)
                break

    if not keys_to_bump:
        print("No version-tracked assets changed.")
        sys.exit(0)

    print("Bumping versions:")
    for key in sorted(keys_to_bump):
        new_val = bump_key(versions, key)
        label = key.replace("css.", "css/") + ".css" if key.startswith("css.") else key
        print(f"  {label}: → {new_val}")

    VERSIONS_FILE.write_text(
        json.dumps(versions, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Saved {VERSIONS_FILE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
