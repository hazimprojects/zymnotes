#!/usr/bin/env python3
"""Replace Unicode emoji with OpenMoji <img> tags — comprehensive pass.

Processes ALL HTML text nodes (skipping <script>, <style>, comments)
across all subtopic (notes/bab-*-*.html) and quiz (quiz/bab-*.html) pages.
Already-converted <img class="openmoji ..."> tags are left untouched.
"""
import re, glob

CDN = 'https://cdn.jsdelivr.net/npm/openmoji@15.0.0/color/svg'

# Manual overrides for emoji not in OpenMoji or with non-standard filenames
OVERRIDES = {
    '☭': '1F6A9',                      # ☭ hammer-sickle → 🚩 red flag
    '\U0001F9D1‍\U0001F91D': '1F91D',  # 🧑‍🤝 truncated ZWJ → 🤝
    '\U0001F468‍\U0001F469': '1F46A',  # 👨‍👩 partial family ZWJ → 👪
}


def auto_hex(s):
    """Return OpenMoji SVG filename hex for an emoji string."""
    if s in OVERRIDES:
        return OVERRIDES[s]
    cps = [ord(c) for c in s]
    # Keycap sequence (ends with U+20E3 combining enclosing keycap)
    if cps and cps[-1] == 0x20E3:
        return '-'.join(f'{c:04X}' for c in cps)
    # ZWJ sequence
    if 0x200D in cps:
        while cps and cps[-1] in (0xFE0F, 0xFE0E):
            cps.pop()
        return '-'.join(f'{c:04X}' for c in cps)
    # Flag pair (two regional indicator symbols)
    if len(cps) >= 2 and all(0x1F1E6 <= c <= 0x1F1FF for c in cps[:2]):
        return '-'.join(f'{c:04X}' for c in cps[:2])
    # Single emoji: strip variation selectors
    cps = [c for c in cps if c not in (0xFE0F, 0xFE0E)]
    return '-'.join(f'{c:04X}' for c in cps)


# Emoji detection regex — order matters (longest match first)
EMOJI_RE = re.compile(
    # 1. Flag pairs: two regional indicator symbols
    r'[\U0001F1E6-\U0001F1FF]{2}'
    # 2. Keycap sequences: digit/*/# + optional FE0F + 20E3
    r'|[\d\*\#]️?⃣'
    # 3. ZWJ sequences: one or more (emoji + ZWJ) followed by final emoji
    r'|(?:[\U0001F000-\U0001FFFF☀-➿️]+‍)+'
     r'[\U0001F000-\U0001FFFF☀-➿]️?'
    # 4. Single emoji (BMP symbols + supplementary) with optional variation selector
    r'|[⌀-⏿☀-➿⬀-⯿\U0001F000-\U0001FFFF]️?'
)

# Blocks to skip entirely (script, style, HTML comments)
PROTECTED_RE = re.compile(
    r'<script[^>]*>.*?</script>'
    r'|<style[^>]*>.*?</style>'
    r'|<!--.*?-->',
    re.DOTALL | re.IGNORECASE
)

# Text nodes: content between > and < that hasn't been already converted
TEXT_NODE_RE = re.compile(r'>([^<]+)<')

# Sentinel to skip already-converted img tags
ALREADY_CONVERTED_RE = re.compile(
    r'<img\s[^>]*class="openmoji[^"]*"[^>]*/>'
)


def make_img(emoji):
    hex_id = auto_hex(emoji)
    return (f'<img class="openmoji openmoji--inline" '
            f'src="{CDN}/{hex_id}.svg" '
            f'width="20" height="20" alt="" decoding="async" />')


def replace_in_text_node(text):
    """Replace emoji in a plain text string, skip already-converted content."""
    return EMOJI_RE.sub(lambda m: make_img(m.group()), text)


def process_file(content):
    """
    Replace all emoji in HTML text nodes, skipping:
    - <script> blocks
    - <style> blocks
    - HTML comments
    - Already-converted <img class="openmoji..."> tags
    """
    result = []
    pos = 0

    for pm in PROTECTED_RE.finditer(content):
        # Process the unprotected chunk before this block
        chunk = content[pos:pm.start()]
        chunk = _process_chunk(chunk)
        result.append(chunk)
        # Keep protected block unchanged
        result.append(pm.group())
        pos = pm.end()

    # Process remaining unprotected chunk
    result.append(_process_chunk(content[pos:]))
    return ''.join(result)


def _process_chunk(chunk):
    """Replace emoji in all text nodes within a chunk of HTML."""
    return TEXT_NODE_RE.sub(
        lambda m: '>' + replace_in_text_node(m.group(1)) + '<',
        chunk
    )


def main():
    notes_files = sorted(glob.glob('notes/bab-*-*.html'))
    quiz_files = sorted(glob.glob('quiz/bab-*.html'))
    all_files = notes_files + quiz_files

    changed = 0
    for path in all_files:
        with open(path, encoding='utf-8') as f:
            original = f.read()
        updated = process_file(original)
        if updated != original:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(updated)
            changed += 1
            print(f'  updated  {path}')
        else:
            print(f'  no change {path}')

    print(f'\nDone. {changed}/{len(all_files)} files updated.')


if __name__ == '__main__':
    main()
