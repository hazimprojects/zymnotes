"""
add-og-tags.py
Adds Open Graph + Twitter Card meta tags to all ZymNotes HTML files.
Run from the /home/user/zymnotes directory.
"""
import os, re, glob

OG_IMAGE = "https://zymnotes.com/assets/og-image.png?v=20260414"
SITE_NAME = "ZymNotes"
DEFAULT_DESC = "Platform pendidikan digital yang membina nota visual, kemas dan mesra telefon untuk membantu pelajar belajar dengan lebih jelas dan berkesan."

# Gather all HTML files (exclude scripts/)
HTML_FILES = sorted(
    glob.glob("**/*.html", recursive=True)
)
HTML_FILES = [f for f in HTML_FILES if not f.startswith("scripts/")]

def extract(pattern, html, flags=0):
    m = re.search(pattern, html, flags | re.DOTALL)
    return m.group(1).strip() if m else None

def make_og_block(title, desc, url):
    return (
        f'  <!-- Open Graph -->\n'
        f'  <meta property="og:title" content="{title}" />\n'
        f'  <meta property="og:description" content="{desc}" />\n'
        f'  <meta property="og:url" content="{url}" />\n'
        f'  <meta property="og:image" content="{OG_IMAGE}" />\n'
        f'  <meta property="og:image:url" content="{OG_IMAGE}" />\n'
        f'  <meta property="og:image:secure_url" content="{OG_IMAGE}" />\n'
        f'  <meta property="og:image:type" content="image/png" />\n'
        f'  <meta property="og:image:width" content="1424" />\n'
        f'  <meta property="og:image:height" content="748" />\n'
        f'  <meta property="og:image:alt" content="ZymNotes — Platform Pendidikan Digital" />\n'
        f'  <meta property="og:type" content="website" />\n'
        f'  <meta property="og:site_name" content="{SITE_NAME}" />\n'
        f'  <meta property="og:locale" content="ms_MY" />\n'
        f'  <!-- Twitter Card -->\n'
        f'  <meta name="twitter:card" content="summary_large_image" />\n'
        f'  <meta name="twitter:title" content="{title}" />\n'
        f'  <meta name="twitter:description" content="{desc}" />\n'
        f'  <meta name="twitter:image" content="{OG_IMAGE}" />\n'
        f'  <meta name="twitter:image:src" content="{OG_IMAGE}" />\n'
    )

def escape_attr(s):
    return s.replace('&', '&amp;').replace('"', '&quot;')

skipped, updated = 0, 0

for filepath in HTML_FILES:
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    # Skip if already has OG tags
    if 'property="og:title"' in html:
        skipped += 1
        continue

    # Extract title
    title_raw = extract(r'<title>(.*?)</title>', html)
    title = escape_attr(title_raw) if title_raw else SITE_NAME

    # Extract description
    desc_raw = (
        extract(r'<meta\s+name="description"\s+content="(.*?)"', html) or
        extract(r'<meta\s+name="description"\s*\n\s*content="(.*?)"', html)
    )
    desc = escape_attr(desc_raw) if desc_raw else DEFAULT_DESC

    # Extract canonical URL
    canonical = extract(r'<link\s+rel="canonical"\s+href="(.*?)"', html)

    # Special case: 404.html
    if canonical is None:
        if '404' in filepath:
            canonical = 'https://zymnotes.com/404.html'
            if not desc_raw:
                desc = "Halaman tidak dijumpai — kembali ke ZymNotes untuk meneruskan pembelajaran."
        else:
            # Derive from path
            clean = filepath.replace('\\', '/')
            canonical = f'https://zymnotes.com/{clean}'

    og_block = make_og_block(title, desc, canonical)

    # Insert after <link rel="canonical"> if present, else after <meta name="description">
    canonical_pattern = r'(<link\s+rel="canonical"[^>]*/?>)'
    m = re.search(canonical_pattern, html)
    if m:
        insert_pos = m.end()
        html = html[:insert_pos] + '\n' + og_block + html[insert_pos:]
    else:
        # Insert after </title> as last resort
        m2 = re.search(r'(</title>)', html)
        if m2:
            insert_pos = m2.end()
            html = html[:insert_pos] + '\n' + og_block + html[insert_pos:]

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html)
    updated += 1
    print(f"  ✓  {filepath}")

print(f"\nDone — {updated} files updated, {skipped} already had OG tags.")
