#!/usr/bin/env python3
"""Static QA checks for ZH unit metadata completeness."""

from __future__ import annotations

import glob
import json
import sys
from pathlib import Path
from typing import Iterable

DEFAULT_PATTERNS = ["data/zh-units.json", "data/zh-units/*.json"]
REQUIRED_FIELDS = ("key_points_zh", "bm_focus_phrase")


def expand_patterns(patterns: list[str]) -> list[Path]:
    paths: list[Path] = []
    for pattern in patterns:
        matches = glob.glob(pattern)
        if matches:
            paths.extend(Path(m) for m in matches)
        elif Path(pattern).is_file():
            paths.append(Path(pattern))
    deduped = sorted(set(paths), key=lambda p: str(p))
    return deduped


def unit_iter(payload: object) -> Iterable[tuple[str, dict]]:
    if isinstance(payload, list):
        for idx, unit in enumerate(payload):
            if isinstance(unit, dict):
                yield str(unit.get("id") or f"index:{idx}"), unit
        return

    if isinstance(payload, dict):
        units = payload.get("units")
        if isinstance(units, list):
            for idx, unit in enumerate(units):
                if isinstance(unit, dict):
                    yield str(unit.get("id") or f"index:{idx}"), unit


def field_present(value: object) -> bool:
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, list):
        return any(isinstance(item, str) and item.strip() for item in value)
    return value is not None


def validate_file(path: Path) -> list[str]:
    issues: list[str] = []

    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as err:
        return [f"{path}: JSON tidak sah ({err})"]

    units = list(unit_iter(payload))
    if not units:
        issues.append(f"{path}: tiada unit ditemui (jangkaan: list root atau objek dengan kunci 'units').")
        return issues

    for unit_id, unit in units:
        missing = [key for key in REQUIRED_FIELDS if not field_present(unit.get(key))]
        if missing:
            issues.append(f"{path} -> unit '{unit_id}': medan wajib tiada/kosong: {', '.join(missing)}")

    return issues


def main() -> int:
    patterns = sys.argv[1:] or DEFAULT_PATTERNS
    files = expand_patterns(patterns)

    if not files:
        print("Tiada fail unit dijumpai. Semakan dilangkau.")
        print("Petua: beri path, contoh: python3 scripts/check-zh-units.py data/zh-units.json")
        return 0

    failures: list[str] = []
    for path in files:
        failures.extend(validate_file(path))

    if failures:
        print("Semakan ZH unit gagal:")
        for item in failures:
            print(f" - {item}")
        return 1

    print(f"Semakan ZH unit lulus untuk {len(files)} fail.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
