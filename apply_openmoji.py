#!/usr/bin/env python3
"""Replace Unicode emoji with OpenMoji <img> tags across all subtopic and quiz pages."""

import re, glob, sys

CDN = 'https://cdn.jsdelivr.net/npm/openmoji@15.0.0/color/svg'

# Full emoji → OpenMoji hex filename mapping
# Sorted by key length (longest first) for correct regex matching
EMOJI_MAP = {
    # Keycap sequences (digit + FE0F + 20E3)
    '1️⃣': '0031-FE0F-20E3',
    '2️⃣': '0032-FE0F-20E3',
    '3️⃣': '0033-FE0F-20E3',
    '4️⃣': '0034-FE0F-20E3',
    '5️⃣': '0035-FE0F-20E3',
    '6️⃣': '0036-FE0F-20E3',
    '7️⃣': '0037-FE0F-20E3',
    '8️⃣': '0038-FE0F-20E3',
    '9️⃣': '0039-FE0F-20E3',

    # ZWJ sequences
    '👨‍💼': '1F468-200D-1F4BC',

    # Flag pairs (regional indicator pairs)
    '🇦🇹': '1F1E6-1F1F9',
    '🇦🇺': '1F1E6-1F1FA',
    '🇧🇪': '1F1E7-1F1EA',
    '🇧🇬': '1F1E7-1F1EC',
    '🇨🇦': '1F1E8-1F1E6',
    '🇨🇳': '1F1E8-1F1F3',
    '🇨🇿': '1F1E8-1F1FF',
    '🇩🇪': '1F1E9-1F1EA',
    '🇩🇰': '1F1E9-1F1F0',
    '🇪🇪': '1F1EA-1F1EA',
    '🇪🇹': '1F1EA-1F1F9',
    '🇫🇮': '1F1EB-1F1EE',
    '🇫🇯': '1F1EB-1F1EF',
    '🇫🇷': '1F1EB-1F1F7',
    '🇬🇧': '1F1EC-1F1E7',
    '🇬🇷': '1F1EC-1F1F7',
    '🇬🇺': '1F1EC-1F1FA',
    '🇭🇰': '1F1ED-1F1F0',
    '🇭🇷': '1F1ED-1F1F7',
    '🇭🇺': '1F1ED-1F1FA',
    '🇮🇩': '1F1EE-1F1E9',
    '🇮🇳': '1F1EE-1F1F3',
    '🇮🇶': '1F1EE-1F1F6',
    '🇮🇹': '1F1EE-1F1F9',
    '🇯🇵': '1F1EF-1F1F5',
    '🇰🇪': '1F1F0-1F1EA',
    '🇰🇷': '1F1F0-1F1F7',
    '🇱🇧': '1F1F1-1F1E7',
    '🇱🇰': '1F1F1-1F1F0',
    '🇱🇹': '1F1F1-1F1F9',
    '🇱🇺': '1F1F1-1F1FA',
    '🇱🇻': '1F1F1-1F1FB',
    '🇲🇲': '1F1F2-1F1F2',
    '🇲🇾': '1F1F2-1F1FE',
    '🇳🇱': '1F1F3-1F1F1',
    '🇳🇴': '1F1F3-1F1F4',
    '🇳🇿': '1F1F3-1F1FF',
    '🇵🇭': '1F1F5-1F1ED',
    '🇵🇰': '1F1F5-1F1F0',
    '🇵🇱': '1F1F5-1F1F1',
    '🇵🇹': '1F1F5-1F1F9',
    '🇷🇴': '1F1F7-1F1F4',
    '🇷🇸': '1F1F7-1F1F8',
    '🇷🇺': '1F1F7-1F1FA',
    '🇸🇮': '1F1F8-1F1EE',
    '🇸🇰': '1F1F8-1F1F0',
    '🇸🇾': '1F1F8-1F1FE',
    '🇹🇭': '1F1F9-1F1ED',
    '🇹🇷': '1F1F9-1F1F7',
    '🇺🇬': '1F1FA-1F1EC',
    '🇺🇸': '1F1FA-1F1F8',
    '🇻🇳': '1F1FB-1F1F3',

    # Emoji with variation selector (FE0F) — with and without variants
    '⚔️': '2694',   '⚔': '2694',
    '⚖️': '2696',   '⚖': '2696',
    '⚙️': '2699',   '⚙': '2699',
    '⚠️': '26A0',   '⚠': '26A0',
    '⛓️': '26D3',   '⛓': '26D3',
    '⛏️': '26CF',   '⛏': '26CF',
    '✈️': '2708',   '✈': '2708',
    '✍️': '270D',   '✍': '270D',
    '✉️': '2709',   '✉': '2709',
    '❄️': '2744',   '❄': '2744',
    '❤️': '2764',   '❤': '2764',
    '➡️': '27A1',   '➡': '27A1',
    '🌪️': '1F32A',  '🌪': '1F32A',
    '🎖️': '1F396',  '🎖': '1F396',
    '🏗️': '1F3D7',  '🏗': '1F3D7',
    '🏘️': '1F3D8',  '🏘': '1F3D8',
    '🏙️': '1F3D9',  '🏙': '1F3D9',
    '🏚️': '1F3DA',  '🏚': '1F3DA',
    '🏛️': '1F3DB',  '🏛': '1F3DB',
    '🏝️': '1F3DD',  '🏝': '1F3DD',
    '🕊️': '1F54A',  '🕊': '1F54A',
    '🕰️': '1F570',  '🕰': '1F570',
    '🖋️': '1F58B',  '🖋': '1F58B',
    '🗞️': '1F5DE',  '🗞': '1F5DE',
    '🗳️': '1F5F3',  '🗳': '1F5F3',
    '🗺️': '1F5FA',  '🗺': '1F5FA',
    '🛡️': '1F6E1',  '🛡': '1F6E1',
    '🛢️': '1F6E2',  '🛢': '1F6E2',

    # Plain emoji (no variation selector)
    '⏰': '23F0',
    '⏱': '23F1',
    '⏳': '23F3',
    '☭': '1F6A9',   # No OpenMoji for ☭; substitute red flag 🚩
    '⚓': '2693',
    '⚡': '26A1',
    '⚫': '26AB',
    '⛵': '26F5',
    '✅': '2705',
    '✊': '270A',
    '✨': '2728',
    '❓': '2753',
    '⭐': '2B50',
    '🌊': '1F30A',
    '🌍': '1F30D',
    '🌏': '1F30F',
    '🌐': '1F310',
    '🌟': '1F31F',
    '🌳': '1F333',
    '🌿': '1F33F',
    '🍚': '1F35A',
    '🎌': '1F38C',
    '🎓': '1F393',
    '🎤': '1F3A4',
    '🎨': '1F3A8',
    '🎯': '1F3AF',
    '🏁': '1F3C1',
    '🏅': '1F3C5',
    '🏠': '1F3E0',
    '🏢': '1F3E2',
    '🏫': '1F3EB',
    '🏭': '1F3ED',
    '🐜': '1F41C',
    '👑': '1F451',
    '👤': '1F464',
    '👥': '1F465',
    '👨': '1F468',
    '👩': '1F469',
    '👮': '1F46E',
    '👶': '1F476',
    '💀': '1F480',
    '💍': '1F48D',
    '💡': '1F4A1',
    '💣': '1F4A3',
    '💥': '1F4A5',
    '💰': '1F4B0',
    '💴': '1F4B4',
    '💸': '1F4B8',
    '💼': '1F4BC',
    '📄': '1F4C4',
    '📅': '1F4C5',
    '📈': '1F4C8',
    '📉': '1F4C9',
    '📊': '1F4CA',
    '📌': '1F4CC',
    '📍': '1F4CD',
    '📖': '1F4D6',
    '📘': '1F4D8',
    '📚': '1F4DA',
    '📜': '1F4DC',
    '📢': '1F4E2',
    '📣': '1F4E3',
    '📰': '1F4F0',
    '🔁': '1F501',
    '🔄': '1F504',
    '🔍': '1F50D',
    '🔥': '1F525',
    '🕌': '1F54C',
    '🚨': '1F6A8',
    '🚩': '1F6A9',
    '🚫': '1F6AB',
    '🤝': '1F91D',
    '🧑': '1F9D1',
    '🧠': '1F9E0',
    '🧩': '1F9E9',
    '🧭': '1F9ED',
    '🪖': '1FA96',
    '🪪': '1FAAA',
}

# Build sorted pattern (longest keys first to avoid partial matches)
_sorted_keys = sorted(EMOJI_MAP, key=len, reverse=True)
EMOJI_PAT = re.compile('(' + '|'.join(re.escape(k) for k in _sorted_keys) + ')')


def img_tag(emoji, css_class, w, h):
    hex_id = EMOJI_MAP.get(emoji)
    if not hex_id:
        return emoji
    return (f'<img class="openmoji {css_class}" '
            f'src="{CDN}/{hex_id}.svg" '
            f'width="{w}" height="{h}" alt="" decoding="async" />')


def replace_text(text, css_class, w, h):
    """Replace all known emoji in a plain text string with OpenMoji img tags."""
    return EMOJI_PAT.sub(lambda m: img_tag(m.group(1), css_class, w, h), text)


def replace_span_content(content, span_class, css_class, w, h):
    """Replace emoji inside <span class="SPAN_CLASS">...</span>."""
    pat = re.compile(
        r'(<span class="' + re.escape(span_class) + r'">)(.*?)(</span>)',
        re.DOTALL
    )
    def repl(m):
        new_inner = replace_text(m.group(2), css_class, w, h)
        return m.group(1) + new_inner + m.group(3)
    return pat.sub(repl, content)


def replace_tag_first_text(content, open_pat, css_class, w, h):
    """
    For tags matching OPEN_PAT (e.g. r'<h2[^>]*>'), replace emoji in the
    immediate text node (the text before the first child tag or end tag).
    """
    combined = re.compile(r'(' + open_pat + r')([^<\n]+)')
    def repl(m):
        return m.group(1) + replace_text(m.group(2), css_class, w, h)
    return combined.sub(repl, content)


def process_notes_file(content):
    """Apply all OpenMoji replacements for a notes/bab-*-*.html file."""

    # 1. chip-icon spans
    content = replace_span_content(content, 'chip-icon', 'openmoji--chip', 20, 20)

    # 2. emoji-bullet spans
    content = replace_span_content(content, 'emoji-bullet', 'openmoji--emoji-bullet', 20, 20)

    # 3. process-icon spans
    content = replace_span_content(content, 'process-icon', 'openmoji--process-icon', 22, 22)

    # 4. h2/h3 headings — first text node
    content = replace_tag_first_text(content, r'<h[23][^>]*>', 'openmoji--inline', 22, 22)

    # 5. p.point-heading — first text node
    content = replace_tag_first_text(content, r'<p class="point-heading[^"]*"[^>]*>', 'openmoji--inline', 20, 20)

    # 6. div.paper-strip — first text node
    content = replace_tag_first_text(content, r'<div class="paper-strip[^"]*"[^>]*>', 'openmoji--inline', 20, 20)

    # 7. div.flap-top — first text node
    content = replace_tag_first_text(content, r'<div class="flap-top[^"]*"[^>]*>', 'openmoji--inline', 20, 20)

    return content


def process_quiz_file(content):
    """Apply all OpenMoji replacements for a quiz/bab-*.html file."""

    # 1. lab-notice-icon spans (large standalone icon)
    content = replace_span_content(content, 'lab-notice-icon', 'openmoji--lab-notice-icon', 32, 32)

    # 2. lab-notice-rule-icon spans (small inline rule icon)
    content = replace_span_content(content, 'lab-notice-rule-icon', 'openmoji--lab-rule-icon', 16, 16)

    # 3. lab-notice-badge spans (emoji + text)
    content = replace_span_content(content, 'lab-notice-badge', 'openmoji--lab-compact', 16, 16)

    # 4. lab-confirm-icon spans
    content = replace_span_content(content, 'lab-confirm-icon', 'openmoji--lab-compact', 20, 20)

    # 5. lab-compact-point divs — first text node
    content = replace_tag_first_text(content, r'<div class="lab-compact-point">', 'openmoji--lab-compact', 18, 18)

    # 6. lab-compact-link anchors — first text node
    content = replace_tag_first_text(content, r'<a class="lab-compact-link[^"]*"[^>]*>', 'openmoji--lab-compact', 18, 18)

    # 7. h1 headings — first text node
    content = replace_tag_first_text(content, r'<h1[^>]*>', 'openmoji--inline', 24, 24)

    # 8. p.learning-lab-tip-label — first text node
    content = replace_tag_first_text(content, r'<p class="learning-lab-tip-label[^"]*"[^>]*>', 'openmoji--lab-compact', 18, 18)

    # 9. buttons with trailing emoji — text nodes
    content = replace_tag_first_text(content, r'<button[^>]*>', 'openmoji--lab-compact', 18, 18)

    return content


def main():
    notes_files = sorted(glob.glob('notes/bab-*-*.html'))
    quiz_files = sorted(glob.glob('quiz/bab-*.html'))

    changed = 0
    for path in notes_files:
        with open(path, encoding='utf-8') as f:
            original = f.read()
        updated = process_notes_file(original)
        if updated != original:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(updated)
            changed += 1
            print(f'  updated  {path}')
        else:
            print(f'  no change {path}')

    for path in quiz_files:
        with open(path, encoding='utf-8') as f:
            original = f.read()
        updated = process_quiz_file(original)
        if updated != original:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(updated)
            changed += 1
            print(f'  updated  {path}')
        else:
            print(f'  no change {path}')

    print(f'\nDone. {changed}/{len(notes_files) + len(quiz_files)} files updated.')


if __name__ == '__main__':
    main()
