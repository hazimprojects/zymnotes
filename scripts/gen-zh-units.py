#!/usr/bin/env python3
"""
gen-zh-units.py
For every notes/bab-*-*.html:
  - Find point-line, point-heading, paper-chip-sentence elements without data-zh-unit-id
  - Look up vocabulary in zh-glossary.json
  - Generate zh-unit JSON entries and wire data-zh-unit-id into the HTML

Run from repo root:  python3 scripts/gen-zh-units.py
"""
import re, json, sys
from pathlib import Path

BASE  = Path(__file__).resolve().parent.parent
NOTES = BASE / 'notes'
UNITS = BASE / 'data/zh-units'

# ── Load glossary ─────────────────────────────────────────────────────────────
raw    = json.loads((BASE / 'data/zh-glossary.json').read_text(encoding='utf-8'))
overly = set(
    item['term'] if isinstance(item, dict) else item
    for item in raw.get('_audit', {}).get('overly_general', [])
)
GL: dict[str, str] = {}
for e in raw.get('terms', []):
    bm = e.get('bm', '').strip().lower()
    zh = e.get('zh', '').strip()
    if bm and zh and bm not in overly and len(bm) > 2:
        GL[bm] = zh

# ── Helpers ───────────────────────────────────────────────────────────────────
def strip_tags(s: str) -> str:
    s = re.sub(r'<[^>]+>', ' ', s)
    return re.sub(r'\s+', ' ',
        s.replace('&amp;', '&').replace('&lt;', '<')
         .replace('&gt;', '>').replace('&nbsp;', ' ')
    ).strip()

def find_vocab(text: str, n: int = 4) -> list[tuple[str, str]]:
    tl, seen, out = text.lower(), set(), []
    for bm in sorted(GL, key=len, reverse=True):
        if bm in tl and GL[bm] not in seen:
            out.append((bm, GL[bm]))
            seen.add(GL[bm])
            if len(out) >= n:
                break
    return out

def elem_type(text: str) -> str:
    prefix = text[:6] if text else ''
    if '💡' in prefix: return 'insight'
    if '📖' in prefix: return 'example'
    if '📌' in prefix: return 'keypoint'
    return 'info'

TMPL = {
    'insight':  '重要结论：{v}考试必背此句，背熟BM原句后用BM完整作答。',
    'example':  '历史例证：{v}此例可用作答题证据，记住王国名称与关键细节。',
    'keypoint': '考试要点：{v}掌握此点，答题时引用关键词汇。',
    'info':     '内容解析：{v}理解此句含义，记住主要词汇。',
}

def build_unit(stem: str, idx: int, text: str, vb: list) -> dict:
    sid  = f'{stem}-u{idx:02d}'
    et   = elem_type(text)
    vstr = '、'.join(f'{b}（{z}）' for b, z in vb[:2])
    explain = TMPL[et].format(v=vstr + '——' if vstr else '')
    kp: list[str] = []
    if vb:
        kp.append('词汇：' + '；'.join(f'{b} = {z}' for b, z in vb[:3]) + '。')
    kp.append('考试须用BM作答，掌握本句的关键词与内容。')
    return {
        'source_id':     sid,
        'bm_original':   text[:300],
        'zh_explain':    explain,
        'key_points_zh': kp,
        'bm_focus_phrase': text[:140],
    }

# ── Patterns ──────────────────────────────────────────────────────────────────
PAT_P = re.compile(
    r'(<p\b[^>]*\bclass="[^"]*\b(?:point-line|point-heading)\b[^"]*"[^>]*>)'
    r'(.*?)'
    r'(</p>)',
    re.DOTALL,
)
PAT_CHIP = re.compile(
    r'(<div\b[^>]*\bclass="[^"]*\bpaper-chip-sentence\b[^"]*"[^>]*>)'
    r'(.*?)'
    r'(</div>)',
    re.DOTALL,
)

# ── Per-file processor ────────────────────────────────────────────────────────
def process(html_path: Path) -> int:
    stem      = html_path.stem
    json_path = UNITS / f'{stem}.json'

    html = html_path.read_text(encoding='utf-8')

    if json_path.exists():
        data = json.loads(json_path.read_text(encoding='utf-8'))
    else:
        data = {
            'meta':  {'source_file': f'notes/{stem}.html', 'rollout': 'gelombang-2'},
            'units': [],
        }

    # Compute next sequential index (only for auto-generated -uNN ids)
    nums = [
        int(m.group(1))
        for u in data['units']
        for m in [re.search(r'-u(\d+)$', u['source_id'])]
        if m
    ]
    idx       = max(nums, default=0) + 1
    new_units = list(data['units'])
    subs: list[tuple[int, int, str]] = []

    for pat in (PAT_P, PAT_CHIP):
        for m in pat.finditer(html):
            open_tag, inner, close = m.group(1), m.group(2), m.group(3)

            # Already annotated → skip
            if 'data-zh-unit-id' in open_tag:
                continue

            text = strip_tags(inner)
            if not text or len(text) < 12:
                continue

            # Require at least 2 Latin-alphabet words (filters bare emoji labels)
            if len([w for w in text.split() if re.match(r'[A-Za-z]', w)]) < 2:
                continue

            vb = find_vocab(text)
            et = elem_type(text)

            # For generic 'info' point-lines: only annotate if vocab found
            is_chip = 'paper-chip-sentence' in open_tag
            if not vb and et == 'info' and not is_chip:
                continue

            unit = build_unit(stem, idx, text, vb)
            new_units.append(unit)

            # Inject attributes into opening tag (before final >)
            new_open = re.sub(
                r'>$',
                f' data-zh-unit-id="{unit["source_id"]}" data-zh-mode="explain">',
                open_tag,
            )
            subs.append((m.start(), m.end(), new_open + inner + close))
            idx += 1

    # Apply substitutions in reverse order to preserve character offsets
    for start, end, repl in sorted(subs, key=lambda x: x[0], reverse=True):
        html = html[:start] + repl + html[end:]

    data['units'] = new_units
    json_path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8'
    )
    html_path.write_text(html, encoding='utf-8')
    return len(subs)


# ── Main ──────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    UNITS.mkdir(parents=True, exist_ok=True)
    total = 0
    files = sorted(NOTES.glob('bab-[1-7]-[1-9]*.html'))
    if not files:
        print('No files found. Check path.', file=sys.stderr)
        sys.exit(1)

    for hp in files:
        n = process(hp)
        total += n
        status = f'+{n}' if n else '(skip)'
        print(f'  {hp.stem:20s} {status}')

    print(f'\nDone. Total new annotations: {total}')
