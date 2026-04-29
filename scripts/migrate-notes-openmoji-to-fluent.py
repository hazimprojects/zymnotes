#!/usr/bin/env python3
"""
Replace OpenMoji CDN <img> tags in notes subtopic pages with Microsoft Fluent UI Emoji 3D PNGs.

Uses fluentui-emoji Git tree: many people/body emojis ship only under
assets/<Name>/Default/3D/<slug>_3d_default.png (skin-tone variants), while simpler
emoji use assets/<Name>/3D/<slug>_3d.png. Unicode → asset mapping comes from each
folder's metadata.json. Regional-indicator flags are overridden (no per-country 3D).
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from urllib.parse import quote
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
NOTES_DIR = ROOT / "notes"
TEMPLATES_DIR = ROOT / "_templates"
FLUENT_REF = "62ecdc0d7ca5"
FLUENT_BASE = f"https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@{FLUENT_REF}/assets"

TREE_URL = (
    "https://api.github.com/repos/microsoft/fluentui-emoji/git/trees/"
    f"{FLUENT_REF}?recursive=1"
)

# OpenMoji filename (last segment) → Fluent (folder, file) — overrides / fallbacks
OPENMOJI_FILE_OVERRIDES: dict[str, tuple[str, str]] = {
    # Regional indicator pairs (Fluent has no per-country 3D flags in this repo)
    "1F1E6-1F1F9.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1E6-1F1FA.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1E7-1F1EA.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1E7-1F1EC.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1E8-1F1E6.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1E8-1F1F3.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1E8-1F1FF.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1E9-1F1EA.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1E9-1F1F0.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1EA-1F1EA.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1EA-1F1F9.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1EB-1F1EE.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1EB-1F1EF.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1EB-1F1F7.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1EC-1F1E7.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1EC-1F1F7.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1EC-1F1FA.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1ED-1F1F0.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1ED-1F1F7.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1ED-1F1FA.svg": ("Hibiscus", "hibiscus_3d.png"),
    "1F1EE-1F1E9.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1EE-1F1F3.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1EE-1F1F6.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1EE-1F1F9.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1EF-1F1F5.svg": ("Sushi", "sushi_3d.png"),
    "1F1F0-1F1EA.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1F0-1F1F7.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1F1-1F1E7.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1F1-1F1F0.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1F1-1F1F9.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1F1-1F1FA.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1F1-1F1FB.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1F2-1F1F2.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1F2-1F1FE.svg": ("Hibiscus", "hibiscus_3d.png"),
    "1F1F3-1F1F1.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1F3-1F1F4.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1F3-1F1FF.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1F5-1F1ED.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1F5-1F1F0.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1F5-1F1F1.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1F5-1F1F9.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1F7-1F1F4.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1F7-1F1F8.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1F7-1F1FA.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1F8-1F1EE.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1F8-1F1F0.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1F8-1F1FE.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1F9-1F1ED.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1F9-1F1F7.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1FA-1F1EC.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1FA-1F1F8.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "1F1FB-1F1F3.svg": ("Globe with meridians", "globe_with_meridians_3d.png"),
    "0031-FE0F-20E3.svg": ("Keycap 1", "keycap_1_3d.png"),
    "0032-FE0F-20E3.svg": ("Keycap 2", "keycap_2_3d.png"),
    "0033-FE0F-20E3.svg": ("Keycap 3", "keycap_3_3d.png"),
    "0034-FE0F-20E3.svg": ("Keycap 4", "keycap_4_3d.png"),
    "0035-FE0F-20E3.svg": ("Keycap 5", "keycap_5_3d.png"),
    "0036-FE0F-20E3.svg": ("Keycap 6", "keycap_6_3d.png"),
    "0037-FE0F-20E3.svg": ("Keycap 7", "keycap_7_3d.png"),
    "0038-FE0F-20E3.svg": ("Keycap 8", "keycap_8_3d.png"),
    "0039-FE0F-20E3.svg": ("Keycap 9", "keycap_9_3d.png"),
    "1F9D1-200D-1F91D-200D-1F9D1.svg": ("People hugging", "people_hugging_3d.png"),
    "1F468-200D-1F469-200D-1F467.svg": ("Busts in silhouette", "busts_in_silhouette_3d.png"),
    # OpenMoji uses U+1F9D8 for "superhero" slot in older content; Fluent man fairy is U+1F9DA ZWJ 2642
    "1F9D8-200D-2642.svg": ("Man fairy", "man_fairy_3d_default.png"),
}

OPENMOJI_SRC_RE = re.compile(
    r"https://cdn\.jsdelivr\.net/npm/openmoji@15\.0\.0/color/svg/([^\"'\s>]+)"
)


def fluent_asset_url(folder: str, filename: str) -> str:
    """jsDelivr URL for a 3D asset (flat or Default skin-tone)."""
    if filename.endswith("_default.png"):
        return (
            f"{FLUENT_BASE}/{quote(folder)}/Default/3D/{quote(filename, safe='')}"
        )
    return f"{FLUENT_BASE}/{quote(folder)}/3D/{quote(filename, safe='')}"


def load_folder_to_pair() -> dict[str, tuple[str, str]]:
    """folder display name -> (folder, png_filename) preferring Default/3D when present."""
    with urlopen(TREE_URL) as resp:
        data = json.load(resp)
    pat_default = re.compile(r"^assets/([^/]+)/Default/3D/([^/]+\.png)$")
    pat_simple = re.compile(r"^assets/([^/]+)/3D/([^/]+\.png)$")
    default_map: dict[str, tuple[str, str]] = {}
    simple_map: dict[str, tuple[str, str]] = {}
    for ent in data.get("tree", []):
        if ent.get("type") != "blob":
            continue
        path = ent.get("path", "")
        m = pat_default.match(path)
        if m:
            folder, fn = m.groups()
            default_map[folder] = (folder, fn)
            continue
        m = pat_simple.match(path)
        if m:
            folder, fn = m.groups()
            simple_map[folder] = (folder, fn)
    out: dict[str, tuple[str, str]] = {}
    for folder in sorted(set(default_map) | set(simple_map)):
        if folder in default_map:
            out[folder] = default_map[folder]
        else:
            out[folder] = simple_map[folder]
    return out


def load_unicode_to_asset(folder_to_pair: dict[str, tuple[str, str]]) -> dict[str, tuple[str, str]]:
    """Map normalized unicode string (no spaces, lower) -> (folder, png)."""
    with urlopen(TREE_URL) as resp:
        data = json.load(resp)
    meta_paths = [
        e["path"]
        for e in data.get("tree", [])
        if e.get("type") == "blob" and e["path"].endswith("/metadata.json")
    ]
    umap: dict[str, tuple[str, str]] = {}
    for mp in meta_paths:
        parts = mp.split("/")
        if len(parts) < 3 or parts[0] != "assets":
            continue
        folder = parts[1]
        pair = folder_to_pair.get(folder)
        if not pair:
            continue
        raw_url = (
            "https://raw.githubusercontent.com/microsoft/fluentui-emoji/"
            + f"{FLUENT_REF}/"
            + quote(mp, safe="/")
        )
        try:
            with urlopen(raw_url) as r:
                meta = json.load(r)
        except OSError:
            continue
        uni = meta.get("unicode")
        if not uni or not isinstance(uni, str):
            continue
        key = re.sub(r"\s+", "", uni).lower()
        umap[key] = pair
        for st in meta.get("unicodeSkintones") or []:
            if isinstance(st, str):
                k2 = re.sub(r"\s+", "", st).lower()
                umap.setdefault(k2, pair)
    return umap


def openmoji_filename_to_unicode_keys(filename: str) -> list[str]:
    base = filename.removesuffix(".svg")
    segs = base.split("-")
    cps: list[int] = []
    for s in segs:
        if not s:
            continue
        cps.append(int(s, 16))
    hex_spaced = " ".join(f"{cp:x}" for cp in cps)
    keys = [re.sub(r"\s+", "", hex_spaced).lower()]
    if len(cps) == 1 and 0xFE0F not in cps:
        keys.append(f"{cps[0]:x}fe0f")
    if len(cps) >= 2 and 0xFE0F not in cps:
        alt: list[int] = []
        for i, cp in enumerate(cps):
            alt.append(cp)
            if i < len(cps) - 1 and cp not in (0x200D, 0xFE0F, 0x20E3):
                alt.append(0xFE0F)
        keys.append("".join(f"{cp:x}" for cp in alt))
    if len(cps) == 3 and cps[2] == 0x20E3 and cps[1] == 0xFE0F:
        keys.append(f"{cps[0]:x}{cps[1]:x}{cps[2]:x}")
    if cps and cps[-1] in (0x2640, 0x2642) and 0xFE0F not in cps:
        keys.append("".join(f"{cp:x}" for cp in cps) + "fe0f")
    # ZWJ sequences (e.g. judge = 1f9d1 200d 2696 fe0f) — metadata often ends with FE0F
    if cps and 0x200D in cps and 0xFE0F not in cps:
        base_join = "".join(f"{cp:x}" for cp in cps).lower()
        keys.append(base_join + "fe0f")
    return list(dict.fromkeys(keys))


def resolve_pair(hex_file: str, umap: dict[str, tuple[str, str]]) -> tuple[str, str]:
    if hex_file in OPENMOJI_FILE_OVERRIDES:
        return OPENMOJI_FILE_OVERRIDES[hex_file]
    for k in openmoji_filename_to_unicode_keys(hex_file):
        if k in umap:
            return umap[k]
    raise KeyError(hex_file)


def process_file(path: Path, umap: dict[str, tuple[str, str]]) -> bool:
    text = path.read_text(encoding="utf-8")
    if "openmoji@15.0.0" not in text and 'class="openmoji' not in text:
        return False
    updated = text
    updated = re.sub(r'<img class="openmoji ', '<img class="fluent-3d-emoji ', updated)

    def repl_src(m: re.Match[str]) -> str:
        hex_file = m.group(1)
        try:
            folder, fn = resolve_pair(hex_file, umap)
        except KeyError as e:
            raise SystemExit(f"Unhandled OpenMoji in {path}: {e}") from e
        return fluent_asset_url(folder, fn)

    updated = OPENMOJI_SRC_RE.sub(repl_src, updated)
    if updated == text:
        return False
    path.write_text(updated, encoding="utf-8")
    return True


def main() -> None:
    print("Fetching Fluent tree + unicode map…", file=sys.stderr)
    folder_to_pair = load_folder_to_pair()
    umap = load_unicode_to_asset(folder_to_pair)
    print(
        f"Folders with 3D assets: {len(folder_to_pair)}, unicode keys: {len(umap)}",
        file=sys.stderr,
    )

    changed = 0
    paths = sorted(NOTES_DIR.glob("bab-*-*.html"))
    paths += sorted(TEMPLATES_DIR.glob("nota-*.html"))
    for path in paths:
        try:
            if process_file(path, umap):
                changed += 1
                print(path.relative_to(ROOT))
        except SystemExit:
            raise
    print(f"Updated {changed} file(s).", file=sys.stderr)


if __name__ == "__main__":
    main()
