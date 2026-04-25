#!/usr/bin/env python3
"""
Normalize across notes/bab-*.html:

1) Section eyebrows: <div class="paper-label small">…</div>
   → sequential Bahagian Pertama, Bahagian Kedua, … (Malay ordinals).
   Skip bab-7-1.html (timeline 'Tahun …').
   Leave unchanged if already 'Bahagian Pertama' etc.

2) Fokus outline chips: inside each Fokus board's .paper-grid.compact-kingdom-grid,
   each .paper-kingdom text becomes "N️⃣ " + title derived from the Nth following
   .section-heading > h2 (plain text, strip leading number emoji).
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NOTES = ROOT / "notes"

ORDINALS = [
    "Pertama",
    "Kedua",
    "Ketiga",
    "Keempat",
    "Kelima",
    "Keenam",
    "Ketujuh",
    "Kelapan",
    "Kesembilan",
    "Kesepuluh",
    "Kesebelas",
    "Keduabelas",
]

BAHAGIAN_RE = re.compile(
    r"^Bahagian (Pertama|Kedua|Ketiga|Keempat|Kelima|Keenam|Ketujuh|Kelapan|Kesembilan|Kesepuluh|Kesebelas|Keduabelas)$"
)

LABEL_PATTERN = re.compile(
    r'(<div class="paper-label small">)([^<]*)(</div>)',
    re.MULTILINE,
)

FOKUS_ARTICLE = re.compile(
    r'<article class="paper-board cv-unit"[^>]*data-cv-title="Fokus [^"]+"[^>]*data-cv-type="board"',
)


def strip_h2_to_title(inner_html: str) -> str:
    s = re.sub(r"<[^>]+>", "", inner_html)
    s = s.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").strip()
    # Remove leading keycap digit + space (1️⃣ etc.)
    s = re.sub(r"^[0-9]\uFE0F?\u20E3\s+", "", s)
    # Remove one leading pictograph if present
    s = re.sub(
        r"^[\U0001F300-\U0001FAFF\u2600-\u27BF](?:\uFE0F)?\s*",
        "",
        s,
        count=1,
    )
    return s.strip()


def h2_titles_after(html: str, start_pos: int) -> list[str]:
    tail = html[start_pos:]
    titles: list[str] = []
    for m in re.finditer(
        r'<div class="section-heading"[^>]*>.*?<h2[^>]*>(.*?)</h2>',
        tail,
        flags=re.DOTALL,
    ):
        t = strip_h2_to_title(m.group(1))
        if t:
            titles.append(t)
    return titles


def normalize_labels(html: str, skip: bool) -> str:
    if skip:
        return html
    idx = 0

    def repl(m: re.Match[str]) -> str:
        nonlocal idx
        inner = m.group(2).strip()
        if BAHAGIAN_RE.match(inner):
            return m.group(0)
        if idx >= len(ORDINALS):
            return m.group(0)
        label = f"Bahagian {ORDINALS[idx]}"
        idx += 1
        return m.group(1) + label + m.group(3)

    return LABEL_PATTERN.sub(repl, html)


def patch_fokus_grids(html: str) -> str:
    out: list[str] = []
    pos = 0
    for m in FOKUS_ARTICLE.finditer(html):
        art_start = m.start()
        window = html[art_start : art_start + 8000]
        gm = re.search(
            r'(<div class="paper-grid compact-kingdom-grid">)([\s\S]*?)(</div>)',
            window,
        )
        if not gm:
            continue
        grid_abs_start = art_start + gm.start(2)
        grid_abs_end = art_start + gm.end(2)
        grid_inner = gm.group(2)
        kingdoms = list(
            re.finditer(
                r'(<article class="paper-kingdom"[^>]*>)([\s\S]*?)(</article>)',
                grid_inner,
            )
        )
        if not kingdoms:
            continue
        titles = h2_titles_after(html, grid_abs_end)
        if not titles:
            continue
        n = min(len(kingdoms), len(titles))
        new_inner_parts: list[str] = []
        last = 0
        for i in range(n):
            km = kingdoms[i]
            new_inner_parts.append(grid_inner[last : km.start()])
            prefix = f"{i+1}\uFE0F\u20E3 "
            new_inner_parts.append(km.group(1) + prefix + titles[i] + km.group(3))
            last = km.end()
        new_inner_parts.append(grid_inner[last:])
        new_grid_inner = "".join(new_inner_parts)

        out.append(html[pos:grid_abs_start])
        out.append(new_grid_inner)
        pos = grid_abs_end
    out.append(html[pos:])
    return "".join(out) if out else html


def process_file(path: Path) -> bool:
    orig = path.read_text(encoding="utf-8")
    skip_labels = path.name == "bab-7-1.html"
    text = normalize_labels(orig, skip_labels)
    text = patch_fokus_grids(text)
    if text != orig:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def main() -> None:
    n = 0
    for path in sorted(NOTES.glob("bab-*.html")):
        if process_file(path):
            print("updated", path.relative_to(ROOT))
            n += 1
    print("done,", n, "files changed")


if __name__ == "__main__":
    main()
