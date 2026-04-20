#!/usr/bin/env python3
"""Simple SEO QA checks for ZymNotes static pages."""

from __future__ import annotations

from pathlib import Path
import glob
import re
import sys
import xml.etree.ElementTree as ET

BASE = 'https://zymnotes.com/'


def read(path: str) -> str:
    return Path(path).read_text(encoding='utf-8')


def check_html(path: str) -> list[str]:
    html = read(path)
    issues: list[str] = []

    if '<title>' not in html:
        issues.append('missing <title>')
    if not re.search(r'<meta\b(?=[^>]*\bname="description")(?=[^>]*\bcontent="[^"]+")[^>]*>', html, re.DOTALL):
        issues.append('missing meta description')
    if 'rel="canonical"' not in html and path != '404.html':
        issues.append('missing canonical')
    if 'property="og:url"' not in html:
        issues.append('missing og:url')

    if re.match(r'^notes/bab-\d+-\d+\.html$', path) and 'application/ld+json' not in html:
        issues.append('missing json-ld breadcrumb')

    return issues


def sitemap_paths() -> set[str]:
    ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
    root = ET.parse('sitemap.xml').getroot()
    paths: set[str] = set()
    for node in root.findall('s:url', ns):
        loc = (node.find('s:loc', ns).text or '').strip()
        if not loc.startswith(BASE):
            continue
        rel = loc[len(BASE):]
        if rel == '':
            paths.add('index.html')
        elif rel == 'notes/':
            paths.add('notes/index.html')
        else:
            paths.add(rel)
    return paths


def expected_indexable_pages() -> set[str]:
    pages = {'index.html', 'about.html', 'feedback.html', 'notes/index.html'}
    pages.update(glob.glob('notes/bab-*.html'))
    return pages


def main() -> int:
    failures: list[str] = []

    pages = sorted(expected_indexable_pages())
    for page in pages:
        issues = check_html(page)
        for issue in issues:
            failures.append(f'{page}: {issue}')

    in_sitemap = sitemap_paths()
    missing = sorted(expected_indexable_pages() - in_sitemap)
    for page in missing:
        failures.append(f'{page}: missing from sitemap.xml')

    if failures:
        print('SEO audit failed:')
        for line in failures:
            print(f' - {line}')
        return 1

    print(f'SEO audit passed for {len(pages)} pages.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
