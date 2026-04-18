#!/usr/bin/env python3
"""
regen-zh-units.py
Re-generates zh_explain, key_points_zh, and bm_focus_phrase for every
auto-generated unit (source_id ending in -u\d+) in data/zh-units/bab-*.json,
using the improved templates from gen-zh-units.py.

Manual units (source_id NOT ending in -u\d+) are left untouched.

Run from repo root:  python3 scripts/regen-zh-units.py
"""
import re, json, sys
from pathlib import Path

BASE  = Path(__file__).resolve().parent.parent
UNITS = BASE / 'data/zh-units'

# ── Load glossary (same logic as gen-zh-units.py) ────────────────────────────
raw    = json.loads((BASE / 'data/zh-glossary.json').read_text(encoding='utf-8'))
overly = set(
    item['term'] if isinstance(item, dict) else item
    for item in raw.get('_audit', {}).get('overly_general', [])
)
GL: dict[str, str] = {}
for bm, zh in raw.items():
    if bm.startswith('_'):
        continue
    bm = bm.strip().lower()
    zh = zh.strip() if isinstance(zh, str) else ''
    if bm and zh and bm not in overly and len(bm) > 2:
        GL[bm] = zh

# ── Helpers ───────────────────────────────────────────────────────────────────
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

TMPL_VOCAB = {
    'insight':  '{vocab_intro}——此句是本节关键结论，理解这些词汇有助掌握核心论点。',
    'example':  '{vocab_intro}——此句以历史为证，答题时引用相关例子更具说服力。',
    'keypoint': '{vocab_intro}——此句列出关键条件，答题须完整呈现所有要点。',
    'info':     '{vocab_intro}',
}

TMPL_NOVOCAB = {
    'insight':  '此句是本节重要结论，理解其历史意义后用BM完整表达。',
    'example':  '此句提供具体历史例子，答题时可引用作为证据。',
    'keypoint': '此句列出重要条件或原因，答题时须完整列举。',
    'info':     '理解此句在历史发展中的含义与作用。',
}

def regen_unit(unit: dict) -> dict:
    """Return a copy of unit with regenerated zh fields."""
    text = unit.get('bm_original', '')
    et   = elem_type(text)
    vb   = find_vocab(text)
    if vb:
        vocab_intro = '；'.join(f'{b}（{z}）' for b, z in vb[:2])
        explain = TMPL_VOCAB[et].format(vocab_intro=vocab_intro)
        kp: list[str] = [f'{b} = {z}' for b, z in vb[:4]]
    else:
        explain = TMPL_NOVOCAB[et]
        kp = []
    return {
        **unit,
        'zh_explain':      explain,
        'key_points_zh':   kp,
        'bm_focus_phrase': '',
    }

AUTO_PAT = re.compile(r'-u\d+$')

# ── Process each JSON file ────────────────────────────────────────────────────
json_files = sorted(UNITS.glob('bab-*.json'))
if not json_files:
    print('No bab-*.json files found under data/zh-units/', file=sys.stderr)
    sys.exit(1)

total_regen  = 0
total_skip   = 0
total_vocab  = 0

for jf in json_files:
    data = json.loads(jf.read_text(encoding='utf-8'))
    new_units   = []
    regen_count = 0
    vocab_count = 0

    for u in data['units']:
        if AUTO_PAT.search(u.get('source_id', '')):
            u = regen_unit(u)
            regen_count += 1
            if u['key_points_zh']:
                vocab_count += 1
        new_units.append(u)

    data['units'] = new_units
    jf.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')

    total_regen += regen_count
    total_vocab += vocab_count
    total_skip  += len(new_units) - regen_count

    if regen_count:
        print(f'  {jf.name:20s}  regenerated={regen_count:4d}  with_vocab={vocab_count:4d}')
    else:
        print(f'  {jf.name:20s}  (no auto units)')

print(f'\nDone. Regenerated {total_regen} auto units ({total_vocab} now have vocab terms), '
      f'kept {total_skip} manual units unchanged.')
