#!/usr/bin/env python3
"""Unify footers: © 2026 ZymNotes · Semua hak cipta terpelihara · Kredit → /kredit.html"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

FOOTER_BOTTOM_RE = re.compile(
    r'<div class="footer-bottom">\s*<p>.*?</p>\s*</div>',
    re.DOTALL,
)
FOOTER_BOTTOM_NEW = (
    '<div class="footer-bottom">\n'
    '      <p>© 2026 ZymNotes · Semua hak cipta terpelihara · '
    '<a href="/kredit.html" class="page-footer-link">Kredit</a></p>\n'
    "    </div>"
)

PAGE_FOOTER_NEW = (
    '<footer class="page-footer">\n'
    "    <div class=\"page-footer-inner\">\n"
    "      <span>© 2026 ZymNotes · Semua hak cipta terpelihara</span>\n"
    '      <span class="page-footer-sep">·</span>\n'
    '      <a href="/kredit.html" class="page-footer-link">Kredit</a>\n'
    "    </div>\n"
    "  </footer>"
)

# One-line page-footer (shell pages)
PAGE_FOOTER_COMPACT_RE = re.compile(
    r'<footer class="page-footer">\s*<div class="page-footer-inner">.*?</div>\s*</footer>',
    re.DOTALL,
)

HOME_FOOTER_COPY_RE = re.compile(
    r'\s*<p class="home-footer-copy">[^<]*</p>\s*\n?',
    re.MULTILINE,
)

FOOTER_LINKS_KREDIT_RE = re.compile(
    r'\s*<a href="/kredit\.html">Kredit</a>\s*\n?',
    re.MULTILINE,
)


def process_html(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    orig = text

    text = HOME_FOOTER_COPY_RE.sub("\n", text)
    text = FOOTER_LINKS_KREDIT_RE.sub("", text)

    if '<div class="footer-bottom">' in text:
        text, _ = FOOTER_BOTTOM_RE.subn(FOOTER_BOTTOM_NEW, text, count=1)

    if '<footer class="page-footer">' in text:
        text = PAGE_FOOTER_COMPACT_RE.sub(PAGE_FOOTER_NEW, text)

    if text != orig:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def patch_kredit_html(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    old = """    <footer class="page-footer">
      <div class="page-footer-inner">
        <span class="page-footer-brand">ZymNotes</span>
        <span class="page-footer-sep">·</span>
        <span>© 2026</span>
      </div>
    </footer>"""
    new = """    <footer class="page-footer">
      <div class="page-footer-inner">
        <span>© 2026 ZymNotes · Semua hak cipta terpelihara</span>
        <span class="page-footer-sep">·</span>
        <a href="kredit.html#top" class="page-footer-link" aria-current="page">Kredit</a>
      </div>
    </footer>"""
    if old not in text:
        return False
    path.write_text(text.replace(old, new, 1), encoding="utf-8")
    return True


def main() -> None:
    n = 0
    for p in sorted(ROOT.glob("*.html")):
        if process_html(p):
            n += 1
    for sub in ("notes", "quiz"):
        for p in sorted((ROOT / sub).glob("*.html")):
            if process_html(p):
                n += 1
    for p in sorted((ROOT / "_templates").glob("*.html")):
        if process_html(p):
            n += 1
    if patch_kredit_html(ROOT / "kredit.html"):
        n += 1
    print(f"Updated {n} file(s).")


if __name__ == "__main__":
    main()
