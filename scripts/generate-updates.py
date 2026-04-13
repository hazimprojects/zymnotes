#!/usr/bin/env python3
"""
Generate data/updates.json from recent git commits.
Run from the repo root. Invoked by GitHub Actions on every push to main.
"""

import subprocess, json, re, os, glob
from collections import OrderedDict
from datetime import datetime, timezone


def git(*args):
    r = subprocess.run(['git'] + list(args), capture_output=True, text=True)
    return r.stdout.strip()


def recent_commits(n=80):
    """Return list of (sha, date YYYY-MM-DD, subject) for recent non-merge commits."""
    raw = git('log', '--pretty=format:%H|%as|%s', '--no-merges', f'-{n}')
    out = []
    for line in raw.splitlines():
        if not line:
            continue
        sha, date, subject = line.split('|', 2)
        out.append((sha, date, subject))
    return out


def files_in(sha):
    out = git('diff-tree', '--no-commit-id', '-r', '--name-only', sha)
    return [f for f in out.splitlines() if f]


def infer_action(subject):
    s = subject.lower()
    if re.search(r'\b(fix|betul|error|bug|salah|correct|repair|resolved?)\b', s):
        return 'diperbetulkan'
    if re.search(r'\b(redesign|reka semula|revamp|overhaul)\b', s):
        return 'direka semula'
    if re.search(r'\b(add|new|tambah|baru|create)\b', s):
        return 'ditambah'
    return 'dikemas kini'


def parse_file(f):
    """Return (entity_key, friendly_label) or (None, None) to skip."""
    m = re.match(r'(?:notes/bab-(\d+)-(\d+)-lab|lab/bab-(\d+)-(\d+))\.html$', f)
    if m:
        bab, sub = m.group(1) or m.group(3), m.group(2) or m.group(4)
        key = f"lab_{bab}.{sub}"
        label = f"Sejarah T4 — Makmal Latihan {bab}.{sub}"
        return key, label

    m = re.match(r'notes/bab-(\d+)-(\d+)\.html$', f)
    if m:
        key = f"nota_{m.group(1)}.{m.group(2)}"
        label = f"Sejarah T4 — Nota Bab {m.group(1)}.{m.group(2)}"
        return key, label

    m = re.match(r'assets/audio/bab-([\d\-]+)\.(mp3|ogg|m4a)$', f)
    if m:
        bab = m.group(1).replace('-', '.')
        return f"audio_{bab}", f"Sejarah T4 — Audio Bab {bab}"

    if f == 'notes/index.html':
        return 'notes_index', 'Senarai nota'

    return None, None


def is_notable_feature(subject, files):
    s = subject.lower()
    if re.search(r'\b(bump|version|chore|v\d+)\b', s):
        return False
    has_js_css = any('assets/js' in f or 'assets/css' in f for f in files)
    is_feature = bool(re.search(r'\b(add|new|feature|tambah|apply|implement)\b', s))
    return has_js_css and is_feature


# ── Main ────────────────────────────────────────────

commits = recent_commits(80)

# Track (date, entity_key) to deduplicate — keep only the most recent action per entity per day
seen = set()       # (date, entity_key)
by_date = OrderedDict()

for sha, date, subject in commits:
    files = files_in(sha)
    action = infer_action(subject)
    items = []

    for f in files:
        entity_key, label = parse_file(f)
        if not entity_key:
            continue
        slot = (date, entity_key)
        if slot in seen:
            continue
        seen.add(slot)
        items.append(f"{label} {action}")

    # Notable feature/UX commit with no note-file changes
    if not items and is_notable_feature(subject, files):
        slot = (date, 'ux_feature')
        if slot not in seen:
            seen.add(slot)
            items.append('Pengalaman pengguna dipertingkat')

    if items:
        if date not in by_date:
            by_date[date] = []
        by_date[date].extend(items)

# Cap: 3 date buckets, 6 items each
entries = []
for date, items in list(by_date.items())[:3]:
    entries.append({'date': date, 'items': items[:6]})

if not entries:
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    entries = [{'date': today, 'items': ['Laman web dikemas kini']}]

os.makedirs('data', exist_ok=True)
with open('data/updates.json', 'w', encoding='utf-8') as f:
    json.dump({'entries': entries}, f, ensure_ascii=False, indent=2)

print('Generated data/updates.json:')
print(json.dumps({'entries': entries}, ensure_ascii=False, indent=2))


# ── Sitemap ──────────────────────────────────────────

def write_sitemap():
    BASE = 'https://hazimedu.com'
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')

    # Core pages
    pages = [
        (f'{BASE}/', '1.0', 'weekly'),
        (f'{BASE}/about.html', '0.5', 'monthly'),
        (f'{BASE}/feedback.html', '0.4', 'monthly'),
        (f'{BASE}/notes/', '0.9', 'weekly'),
    ]

    note_pages = sorted(glob.glob('notes/bab-*.html'))
    for path in note_pages:
        m = re.match(r'^notes/bab-(\d+)(?:-(\d+))?\.html$', path)
        if not m:
            continue
        is_subtopic = bool(m.group(2))
        priority = '0.7' if is_subtopic else '0.8'
        changefreq = 'weekly' if is_subtopic else 'monthly'
        pages.append((f'{BASE}/{path}', priority, changefreq))

    url_entries = '\n'.join(
        f'  <url>\n    <loc>{loc}</loc>\n    <lastmod>{today}</lastmod>'
        f'\n    <changefreq>{freq}</changefreq>\n    <priority>{pri}</priority>\n  </url>'
        for loc, pri, freq in pages
    )

    sitemap = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f'{url_entries}\n'
        '</urlset>\n'
    )

    with open('sitemap.xml', 'w', encoding='utf-8') as f:
        f.write(sitemap)

    print(f'Generated sitemap.xml with {len(pages)} URLs (lastmod: {today})')


write_sitemap()
