#!/usr/bin/env python3
"""Normalize common BM+particle mixing artifacts in Bab 3 zh-units JSON."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = sorted((ROOT / "data/zh-units").glob("bab-3-*.json"))

# Conservative replacements for the worst hybrid patterns.
REPLACEMENTS: list[tuple[str, str]] = [
    (r"在…之后", "在……之后"),
    (r" 与 ", "和"),
    (r" 通过 ", "借助"),
    (r" 为了 ", "以求"),
]


def fix_text(s: str) -> str:
    if not isinstance(s, str) or not s.strip():
        return s
    out = s
    for pat, rep in REPLACEMENTS:
        out = re.sub(pat, rep, out)
    out = re.sub(r" {2,}", " ", out)
    return out.strip()


def process(path: Path) -> int:
    data = json.loads(path.read_text(encoding="utf-8"))
    n = 0
    for u in data.get("units", []):
        if not isinstance(u, dict):
            continue
        for key in ("translate",):
            if key not in u:
                continue
            old = u[key]
            new = fix_text(old) if isinstance(old, str) else old
            if new != old:
                u[key] = new
                n += 1
        kp = u.get("key_points_zh")
        if isinstance(kp, list):
            for i, item in enumerate(kp):
                if not isinstance(item, str):
                    continue
                new = fix_text(item)
                if new != item:
                    kp[i] = new
                    n += 1
    if n:
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return n


def main() -> None:
    total = 0
    for path in FILES:
        c = process(path)
        if c:
            print(f"{path.name}: {c} field(s) touched")
        total += c
    print(f"Total field updates: {total}")


if __name__ == "__main__":
    main()
