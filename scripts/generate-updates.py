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


def files_with_status(sha):
    out = git('diff-tree', '--no-commit-id', '-r', '--name-status', sha)
    rows = []
    for line in out.splitlines():
        if not line:
            continue
        parts = line.split('\t', 1)
        if len(parts) != 2:
            continue
        status, path = parts
        rows.append((status, path))
    return rows


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
    """Return metadata for known content files, or None to skip."""
    m = re.match(r'(?:notes/bab-(\d+)-(\d+)-lab|lab/bab-(\d+)-(\d+))\.html$', f)
    if m:
        bab, sub = m.group(1) or m.group(3), m.group(2) or m.group(4)
        ref = f"{bab}.{sub}"
        return {
            'key': f"lab_{ref}",
            'label': f"Sejarah T4 — Arkib Latihan {ref}",
            'category': 'lab'
        }

    m = re.match(r'notes/bab-(\d+)-(\d+)\.html$', f)
    if m:
        ref = f"{m.group(1)}.{m.group(2)}"
        return {
            'key': f"nota_{ref}",
            'label': f"Sejarah T4 — Nota Bab {ref}",
            'category': 'note'
        }

    m = re.match(r'assets/audio/bab-([\d\-]+)\.(mp3|ogg|m4a)$', f)
    if m:
        bab = m.group(1).replace('-', '.')
        return {
            'key': f"audio_{bab}",
            'label': f"Sejarah T4 — Audio Bab {bab}",
            'category': 'audio'
        }

    m = re.match(r'assets/js/zh-mode\.js$', f)
    if m:
        return {
            'key': 'zh_mode',
            'label': 'Mod Bahasa Cina',
            'category': 'zh'
        }

    m = re.match(r'assets/js/.*\.js$', f)
    if m:
        return {
            'key': f"sys_js_{os.path.basename(f)}",
            'label': 'Sistem laman (JavaScript)',
            'category': 'system_js'
        }

    m = re.match(r'assets/css/.*\.css$', f)
    if m:
        return {
            'key': f"sys_css_{os.path.basename(f)}",
            'label': 'Sistem laman (CSS)',
            'category': 'system_css'
        }

    if f == 'notes/index.html':
        return {
            'key': 'notes_index',
            'label': 'Senarai nota',
            'category': 'other'
        }

    return None


def is_notable_feature(subject, files):
    s = subject.lower()
    if re.search(r'\b(bump|version|chore|v\d+)\b', s):
        return False
    has_js_css = any('assets/js' in f or 'assets/css' in f for f in files)
    is_feature = bool(re.search(r'\b(add|new|feature|tambah|apply|implement)\b', s))
    return has_js_css and is_feature


def init_day_bucket():
    return {
        'note': [],
        'audio': [],
        'zh': [],
        'lab': [],
        'system_js': [],
        'system_css': [],
        'feature': [],
        'other': []
    }


def compose_day_items(bucket):
    items = []

    note_count = len(bucket['note'])
    if note_count == 1:
        items.append("Sejarah T4 — Kemas kini nota subtopik (1 halaman)")
    elif note_count >= 4:
        items.append(f"Sejarah T4 — Nota di pelbagai subtopik telah dikemas kini ({note_count} subtopik)")
    elif note_count >= 2:
        items.append(f"Sejarah T4 — Kemas kini nota subtopik ({note_count} halaman)")
    else:
        items.extend(entry['text'] for entry in bucket['note'])

    audio_count = len(bucket['audio'])
    if audio_count == 1:
        items.append("Sejarah T4 — Kemas kini audio subtopik (1 fail)")
    elif audio_count >= 3:
        items.append(f"Sejarah T4 — Audio di pelbagai subtopik telah dikemas kini ({audio_count} fail)")
    elif audio_count >= 2:
        items.append(f"Sejarah T4 — Kemas kini audio subtopik ({audio_count} fail)")
    else:
        items.extend(entry['text'] for entry in bucket['audio'])

    zh_count = len(bucket['zh'])
    if zh_count >= 2:
        items.append(f"Sejarah T4 — Mod Bahasa Cina telah dikemas kini merentas beberapa subtopik ({zh_count} kemas kini)")
    else:
        items.extend(entry['text'] for entry in bucket['zh'])

    lab_count = len(bucket['lab'])
    if lab_count == 1:
        items.append("Sejarah T4 — Kemas kini arkib latihan (1 halaman)")
    elif lab_count >= 3:
        items.append(f"Sejarah T4 — Arkib latihan bagi beberapa subtopik telah dikemas kini ({lab_count} halaman)")
    elif lab_count >= 2:
        items.append(f"Sejarah T4 — Kemas kini arkib latihan ({lab_count} halaman)")
    else:
        items.extend(entry['text'] for entry in bucket['lab'])

    system_count = len(bucket['system_js']) + len(bucket['system_css']) + len(bucket['feature'])
    if system_count:
        items.append("Sistem laman dipertingkat")

    items.extend(entry['text'] for entry in bucket['other'][:4])
    return items[:8]


# ── Main ────────────────────────────────────────────

commits = recent_commits(80)

# Track (date, entity_key) to deduplicate — keep only the most recent action per entity per day
seen = set()       # (date, entity_key)
by_date = OrderedDict()

for sha, date, subject in commits:
    files = files_in(sha)
    changed = files_with_status(sha)
    action = infer_action(subject)
    entries = []

    for status, f in changed:
        parsed = parse_file(f)
        if not parsed:
            continue
        slot = (date, parsed['key'])
        if slot in seen:
            continue
        seen.add(slot)
        item_action = 'ditambah' if status.startswith('A') else action
        entries.append({
            'category': parsed['category'],
            'action': item_action,
            'text': f"{parsed['label']} {item_action}"
        })

    # Notable feature/UX commit with no note-file changes
    if not entries and is_notable_feature(subject, files):
        slot = (date, 'ux_feature')
        if slot not in seen:
            seen.add(slot)
            entries.append({
                'category': 'feature',
                'action': 'dikemas kini',
                'text': 'Pengalaman pengguna dipertingkat'
            })

    if entries:
        if date not in by_date:
            by_date[date] = init_day_bucket()
        for entry in entries:
            by_date[date][entry['category']].append(entry)

# Cap: 3 date buckets, 8 items each
entries = []
for date, bucket in list(by_date.items())[:3]:
    entries.append({'date': date, 'items': compose_day_items(bucket)})

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
    BASE = 'https://zymnotes.com'
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
