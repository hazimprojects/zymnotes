#!/usr/bin/env python3
"""Replace OpenMoji CDN img src in quiz/*.html with Microsoft Fluent UI Emoji 3D PNGs."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
QUIZ_DIR = ROOT / "quiz"
FLUENT_REF = "62ecdc0d7ca5"
FLUENT_BASE = (
    f"https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@{FLUENT_REF}/assets"
)


def fluent_url(folder: str, filename: str) -> str:
    from urllib.parse import quote

    return f"{FLUENT_BASE}/{quote(folder)}/3D/{filename}"


# OpenMoji hex filename -> (Fluent folder display name, png filename)
OPENMOJI_TO_FLUENT: dict[str, tuple[str, str]] = {
    "1F9E9.svg": ("Puzzle piece", "puzzle_piece_3d.png"),
    "1F9E0.svg": ("Brain", "brain_3d.png"),
    "1F3AF.svg": ("Bullseye", "bullseye_3d.png"),
    "1F4C8.svg": ("Chart increasing", "chart_increasing_3d.png"),
    "1F501.svg": ("Repeat button", "repeat_button_3d.png"),
    "1F4D6.svg": ("Open book", "open_book_3d.png"),
    "27A1.svg": ("Right arrow", "right_arrow_3d.png"),
    "2705.svg": ("Check mark button", "check_mark_button_3d.png"),
    "1F4A1.svg": ("Light bulb", "light_bulb_3d.png"),
    "1F504.svg": (
        "Counterclockwise arrows button",
        "counterclockwise_arrows_button_3d.png",
    ),
    "2728.svg": ("Sparkles", "sparkles_3d.png"),
}

OPENMOJI_SRC_RE = re.compile(
    r'https://cdn\.jsdelivr\.net/npm/openmoji@15\.0\.0/color/svg/([^"\'\s>]+)'
)


def replace_openmoji_src(match: re.Match[str]) -> str:
    hex_file = match.group(1)
    pair = OPENMOJI_TO_FLUENT.get(hex_file)
    if not pair:
        raise ValueError(f"Unhandled OpenMoji file in quiz HTML: {hex_file}")
    return fluent_url(pair[0], pair[1])


def process_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    updated = text

    # img class openmoji -> fluent-3d-emoji (preserve modifier classes)
    updated = re.sub(
        r'<img class="openmoji ',
        '<img class="fluent-3d-emoji ',
        updated,
    )

    updated = OPENMOJI_SRC_RE.sub(replace_openmoji_src, updated)

    if updated == text:
        return False
    path.write_text(updated, encoding="utf-8")
    return True


def main() -> None:
    changed = 0
    for path in sorted(QUIZ_DIR.glob("*.html")):
        if process_file(path):
            changed += 1
            print(path.name)
    print(f"Updated {changed} quiz file(s).")


if __name__ == "__main__":
    main()
