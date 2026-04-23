#!/usr/bin/env python3
"""
Regenerate `translate` (and optional `key_points_zh`) for all Bab 3 zh-units
from `bm_original` using Malay → Simplified Chinese machine translation.

This produces full Chinese sentences (like Bab 1/2 style) instead of
`释义：（原文：…）` scaffolding or BM–particle hybrids.

Requires: pip install deep-translator

Run from repo root:
  python3 scripts/regen-bab3-zh-translates.py
"""

from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path

try:
    from deep_translator import GoogleTranslator
except ImportError:
    print("Install: pip install deep-translator", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
ZH_DIR = ROOT / "data" / "zh-units"
FILES = sorted(ZH_DIR.glob("bab-3*.json"))

# Light post-pass for common MS→ZH quirks in this curriculum (optional).
POST_REPLACEMENTS: list[tuple[str, str]] = [
    (r"\b日本侵略\b", "日本占领"),  # occupation nuance
]


def strip_html(s: str) -> str:
    t = re.sub(r"<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", t).strip()


def post_process(zh: str) -> str:
    out = zh.strip()
    for pat, rep in POST_REPLACEMENTS:
        out = re.sub(pat, rep, out)
    return out


def translate_batch(translator: GoogleTranslator, texts: list[str]) -> list[str]:
    """Translate list of strings; one API call per string for reliability."""
    out: list[str] = []
    for i, raw in enumerate(texts):
        src = strip_html(raw)
        if not src:
            out.append("")
            continue
        last_err: Exception | None = None
        for attempt in range(4):
            try:
                zh = translator.translate(src)
                out.append(post_process(zh))
                break
            except Exception as e:
                last_err = e
                time.sleep(0.8 * (2**attempt))
        else:
            print(f"WARN: translate failed after retries: {src[:80]}… {last_err}", file=sys.stderr)
            out.append(src)
        if (i + 1) % 40 == 0:
            time.sleep(0.6)
        else:
            time.sleep(0.08)
    return out


def process_file(path: Path, translator: GoogleTranslator) -> tuple[int, int]:
    data = json.loads(path.read_text(encoding="utf-8"))
    units = data.get("units")
    if not isinstance(units, list):
        return 0, 0

    originals: list[tuple[int, str]] = []
    for idx, u in enumerate(units):
        if not isinstance(u, dict):
            continue
        bm = u.get("bm_original", "")
        if not isinstance(bm, str) or not bm.strip():
            continue
        originals.append((idx, bm))

    if not originals:
        return 0, 0

    texts = [t for _, t in originals]
    zh_list = translate_batch(translator, texts)

    n = 0
    for (idx, _bm), zh in zip(originals, zh_list, strict=True):
        u = units[idx]
        old = u.get("translate", "")
        u["translate"] = zh
        if old != zh:
            n += 1
        if "key_points_zh" in u:
            u["key_points_zh"] = [zh] if zh else []

    meta = data.get("meta")
    if isinstance(meta, dict):
        meta["rollout"] = "gelombang-1-ms-zh-regenerated"
        meta["notes"] = (
            "Translate fields regenerated from bm_original (ms→zh-CN) for fluent "
            "Simplified Chinese; proper names follow translator output—verify against BM notes."
        )

    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return n, len(originals)


def main() -> None:
    translator = GoogleTranslator(source="ms", target="zh-CN")
    total_units = 0
    total_changed = 0
    for path in FILES:
        changed, count = process_file(path, translator)
        total_changed += changed
        total_units += count
        print(f"{path.name}: {count} units, {changed} translate fields updated")
    print(f"Done. Total units: {total_units}, fields changed: {total_changed}")


if __name__ == "__main__":
    main()
