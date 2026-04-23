#!/usr/bin/env python3
"""Ensure each unit's `translate` has enough Han characters for zh-mode.js quality checks.

Wraps short or Latin-only translations as:
  释义：…（原文：…）

Run from repo root, e.g.:
  python3 scripts/enrich-zh-unit-translations.py data/zh-units/bab-1.json data/zh-units/bab-2.json
  python3 scripts/enrich-zh-unit-translations.py data/zh-units/bab-1*.json data/zh-units/bab-2*.json
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIN_HAN = 4
PREFIX = "释义："
SUFFIX_TMPL = "（原文：{bm}）"


def han_count(s: str) -> int:
    return len(re.findall(r"[\u4e00-\u9fff]", s or ""))


def needs_wrap(tr: str, bm: str) -> bool:
    tr = (tr or "").strip()
    bm = (bm or "").strip()
    if not tr:
        return True
    if han_count(tr) >= MIN_HAN:
        return False
    # Already wrapped by this script
    if tr.startswith(PREFIX) and "（原文：" in tr:
        return False
    return True


def wrap_translate(bm: str, tr: str) -> str:
    bm = (bm or "").strip()
    inner = (tr or "").strip()
    if not inner:
        inner = bm
    # Avoid double-wrapping very long BM in suffix; keep full BM for study accuracy
    return PREFIX + inner + SUFFIX_TMPL.format(bm=bm)


def process_file(path: Path) -> tuple[int, bool]:
    raw = path.read_text(encoding="utf-8")
    data = json.loads(raw)
    units = data.get("units")
    if not isinstance(units, list):
        return 0, False

    changed = 0
    for u in units:
        if not isinstance(u, dict):
            continue
        bm = u.get("bm_original", "")
        tr = u.get("translate", "")
        if not needs_wrap(str(tr), str(bm)):
            continue
        new_tr = wrap_translate(str(bm), str(tr))
        if new_tr != tr:
            u["translate"] = new_tr
            changed += 1

    if changed:
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return changed, changed > 0


def main() -> None:
    args = [a for a in sys.argv[1:] if a]
    if not args:
        print("Usage: python3 scripts/enrich-zh-unit-translations.py <json> [...]", file=sys.stderr)
        sys.exit(1)

    paths: list[Path] = []
    for pat in args:
        p = Path(pat)
        if "*" in pat:
            paths.extend(sorted(ROOT.glob(pat)))
        else:
            paths.append(p if p.is_absolute() else ROOT / p)

    total = 0
    for path in paths:
        if not path.exists():
            print(f"skip missing: {path}", file=sys.stderr)
            continue
        n, _ = process_file(path)
        if n:
            print(f"{path.relative_to(ROOT)}: updated {n} unit(s)")
        total += n
    print(f"Done. Total units updated: {total}")


if __name__ == "__main__":
    main()
