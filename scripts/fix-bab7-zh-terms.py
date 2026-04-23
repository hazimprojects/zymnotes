#!/usr/bin/env python3
"""Post-edit Bab 7 zh-units: fix MT mistranslations for key terms (CLC, Sistem Ahli, Melayu Raya)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ZH_DIR = ROOT / "data" / "zh-units"

# (old, new) — order matters; longer / more specific first.
REPLACEMENTS: list[tuple[str, str]] = [
    (
        "为此，种族关系委员会（CLC）的成立、议员制度和国民教育制度的形成以及政党的合作都是为了争取独立而进行的。",
        "为此，成立族群联络委员会（Jawatankuasa Hubungan Antara Kaum，CLC）、推行成员制（Sistem Ahli）与国民教育体系，并加强政党合作，都是迈向独立的重要步骤。",
    ),
    ("争取独立的努力是为了响应英国的号召，", "争取独立的努力是为了满足英国的要求，"),
    ("正在争取的理念包括马来亚开斋节、民主", "正在争取的理念包括大马来由（Melayu Raya）、民主"),
    ("争取独立并为马来亚拉雅而战", "争取独立并倡导大马来由（Melayu Raya）"),
    ("种族间关系委员会", "族群联络委员会"),
    ("1️⃣成立种族关系委员会", "1️⃣成立族群联络委员会"),
    ("2️⃣ 种族关系委员会的作用", "2️⃣ 族群联络委员会的作用"),
    ("3️⃣ 议员负责提出与其部门相关的法律", "3️⃣ 成员负责提出与其部门相关的法律"),
    ("因此，议员制度成为", "因此，成员制成为"),
    ("这一提议导致了议员制度的形成，这是一个初步的培训制度", "这一提议促成了成员制（Sistem Ahli）的设立，这是一个初步培训制度"),
    (
        "议员制度是在英国给予独立之前培训当地人领导马来亚联邦行政的制度。",
        "成员制是在英国授予独立之前，让当地人学习领导马来亚联合邦（Persekutuan Tanah Melayu）行政的制度。",
    ),
    ("会员制度对于独立非常重要，因为：", "成员制对于迈向独立非常重要，因为："),
    ("会员制度为当地居民提供了良好的接触机会：", "成员制为当地居民提供了良好的接触机会："),
    ("会员系统还为当地居民提供以下相关培训：", "成员制还为当地居民提供以下相关培训："),
    ("会员系统是一个系统：", "成员制（Sistem Ahli）是一个制度："),
    ("2️⃣会员系统的特点", "2️⃣成员制的特点"),
    ("3️⃣会员制度对于独立的重要性", "3️⃣成员制对于独立的重要性"),
    ("会员系统的主要特点是：", "成员制的主要特点是："),
    ("种族关系委员会", "族群联络委员会"),
    ("会员系统", "成员制"),
    ("会员制度", "成员制"),
    ("议员制度", "成员制"),
]


def patch_text(s: str) -> tuple[str, bool]:
    out = s
    changed = False
    for old, new in REPLACEMENTS:
        if old in out:
            out = out.replace(old, new)
            changed = True
    return out, changed


def main() -> None:
    paths = sorted(ZH_DIR.glob("bab-7*.json"))
    if not paths:
        print("No bab-7*.json", file=sys.stderr)
        sys.exit(1)
    total = 0
    for path in paths:
        data = json.loads(path.read_text(encoding="utf-8"))
        units = data.get("units")
        if not isinstance(units, list):
            continue
        for u in units:
            if not isinstance(u, dict):
                continue
            tr = u.get("translate")
            if isinstance(tr, str):
                new_tr, ch = patch_text(tr)
                if ch:
                    u["translate"] = new_tr
                    total += 1
            kp = u.get("key_points_zh")
            if isinstance(kp, list):
                new_kp = []
                for item in kp:
                    if isinstance(item, str):
                        ni, ch = patch_text(item)
                        new_kp.append(ni)
                        if ch:
                            total += 1
                    else:
                        new_kp.append(item)
                u["key_points_zh"] = new_kp
        meta = data.get("meta")
        if isinstance(meta, dict):
            meta["rollout"] = "gelombang-1-ms-zh-regenerated"
            meta["notes"] = (
                "Bab 7: translate regenerated from bm_original (ms→zh-CN), "
                "then manual term fixes (CLC→族群联络委员会, Sistem Ahli→成员制, Melayu Raya)."
            )
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(path.name)
    print(f"Patched string fields in units ({total} field updates).")


if __name__ == "__main__":
    main()
