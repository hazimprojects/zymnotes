#!/usr/bin/env python3
"""
One-time migration: convert existing notes/bab-*.html → content/bab-*.yaml.

Usage:
  python scripts/migrate_html_to_yaml.py              # migrate all
  python scripts/migrate_html_to_yaml.py notes/bab-2-1.html  # single file

Output written to content/ directory. Manual review recommended after running.

Requires: pip install beautifulsoup4
"""

from __future__ import annotations
import json
import re
import sys
from pathlib import Path

try:
    from bs4 import BeautifulSoup, Tag
except ImportError:
    print("beautifulsoup4 required: pip install beautifulsoup4")
    sys.exit(1)

import yaml

ROOT = Path(__file__).parent.parent
NOTES_DIR = ROOT / "notes"
CONTENT_DIR = ROOT / "content"

# Fluent emoji CDN base (for reverse lookup)
_EMOJI_BASE = "cdn.jsdelivr.net/gh/microsoft/fluentui-emoji"

# Reverse map: partial path → shortcode
_EMOJI_REVERSE: dict[str, str] = {}


def _build_reverse_map():
    sys.path.insert(0, str(Path(__file__).parent))
    from emoji_map import EMOJI_MAP
    for shortcode, (path, _) in EMOJI_MAP.items():
        key = path.replace(" ", "%20").lower()
        _build_reverse_map._raw[path.lower()] = shortcode
        _build_reverse_map._raw[key] = shortcode


_build_reverse_map._raw = {}
_build_reverse_map()
_EMOJI_REVERSE = _build_reverse_map._raw


def _img_to_shortcode(img_tag) -> str:
    """Extract emoji shortcode from a Fluent <img> tag."""
    if not img_tag:
        return "pushpin"
    src = img_tag.get("src", "")
    # Extract path portion after /assets/
    m = re.search(r'/assets/(.+)$', src)
    if not m:
        return "pushpin"
    path = m.group(1)
    # Try URL-decoded version
    decoded = path.replace("%20", " ")
    code = _EMOJI_REVERSE.get(decoded.lower()) or _EMOJI_REVERSE.get(path.lower())
    if code:
        return code
    # Fallback: guess from filename
    fn = path.split("/")[-1].replace("_3d.png", "").replace("_3d_default.png", "")
    return fn.replace("_", "-")


def _kw_spans_to_syntax(element) -> str:
    """Convert an HTML element's content to YAML keyword syntax."""
    from bs4 import NavigableString
    parts = []
    for child in element.children:
        if isinstance(child, NavigableString):
            parts.append(str(child))
        elif child.name == 'span':
            cls = child.get("class", [])
            kw_cls = [c for c in cls if c.startswith("kw-") and c != "kw"]
            if kw_cls:
                kw_type = kw_cls[0].replace("kw-", "")
                parts.append(f"[{child.get_text()}]{{{kw_type}}}")
            else:
                parts.append(_kw_spans_to_syntax(child))
        elif child.name == 'img':
            pass  # skip inline emoji images
        elif child.name is not None:
            parts.append(_kw_spans_to_syntax(child))
    return "".join(parts).strip()


def _element_to_item(el, prefix_emoji: str | None = None) -> str:
    """Convert a DOM element to a '[emoji] text [keyword]{type}' item string."""
    # Find leading emoji img
    first_img = el.find("img", class_="fluent-3d-emoji")
    emoji = _img_to_shortcode(first_img) if first_img else (prefix_emoji or "pushpin")

    # Remove emoji img before extracting text
    if first_img:
        first_img.decompose()

    text = _kw_spans_to_syntax(el)
    text = re.sub(r'\s+', ' ', text).strip()
    return f"[{emoji}] {text}"


def _extract_chip_list(chip_list_el) -> list[str]:
    items = []
    for chip in chip_list_el.find_all("div", class_="paper-chip", recursive=False):
        items.append(_element_to_item(chip))
    return items


def _extract_emoji_list(ul_el) -> list[str]:
    items = []
    for li in ul_el.find_all("li", recursive=False):
        span = li.find("span", attrs={"data-zh-mode": True}) or li
        items.append(_element_to_item(span))
    return items


def _extract_point_lines(container) -> list[str]:
    items = []
    for el in container.find_all("p", class_="point-line", recursive=False):
        items.append(_element_to_item(el))
    return items


def _extract_meta(soup, fail_ini: str) -> dict:
    meta = {}
    title_tag = soup.find("title")
    if title_tag:
        t = title_tag.get_text()
        # Remove " | ZymNotes" suffix
        t = re.sub(r'\s*\|\s*ZymNotes\s*$', '', t)
        meta["_title_raw"] = t

    desc = soup.find("meta", attrs={"name": "description"})
    if desc:
        meta["description"] = desc.get("content", "")

    # Body class
    body = soup.find("body")
    if body:
        classes = body.get("class", [])
        tema = next((c for c in classes if c.startswith("bab-theme-")), "")
        meta["tema"] = tema
        meta["_is_hub"] = "bab-hub-page" in classes
        meta["_has_quiz"] = bool(body.get("data-lab-href"))

    return meta


def migrate_subtopik(soup, fail_ini: str) -> dict:
    """Extract YAML data from a subtopik HTML page."""
    meta = _extract_meta(soup, fail_ini)

    # Derive subtopik code from filename
    m = re.match(r'bab-(\d+)-(\d+)\.html', fail_ini)
    bab_num = int(m.group(1)) if m else 0
    sub_num = int(m.group(2)) if m else 0
    subtopik_code = f"{bab_num}.{sub_num}"

    # Breadcrumb JSON-LD for metadata
    jsonld_scripts = soup.find_all("script", type="application/ld+json")
    bab_label = f"Bab {bab_num}"
    tajuk_bab = ""
    tajuk = ""
    for script in jsonld_scripts:
        try:
            jd = json.loads(script.string)
            if jd.get("@type") == "BreadcrumbList":
                items = jd.get("itemListElement", [])
                for item in items:
                    if item.get("position") == 3:
                        parts = item.get("name", "").split(" · ", 1)
                        if len(parts) == 2:
                            bab_label, tajuk_bab = parts[0].strip(), parts[1].strip()
                    if item.get("position") == 4:
                        name = item.get("name", "")
                        name = re.sub(r'^\d+\.\d+\s+', '', name)
                        name = re.sub(r'\s*·\s*ZymNotes\s*$', '', name)
                        tajuk = name.strip()
        except Exception:
            pass

    # Lead paragraph
    lead_el = soup.find("p", class_="lead")
    lead = _kw_spans_to_syntax(lead_el) if lead_el else ""
    lead = re.sub(r'\s+', ' ', lead).strip()

    # Navigation
    nav_links = soup.find_all("a", class_="btn")
    fail_sebelum = f"bab-{bab_num}.html"
    fail_seterusnya = ""
    kod_seterusnya = ""
    for a in nav_links:
        href = a.get("href", "")
        text = a.get_text().strip()
        if "Seterusnya" in text and href:
            fail_seterusnya = href
            m2 = re.search(r'bab-(\d+)-(\d+)\.html', href)
            if m2:
                kod_seterusnya = f"{m2.group(1)}.{m2.group(2)}"
        elif "Kembali" in text and href and "bab-" in href:
            fail_sebelum = href

    # OG image version
    og_img = soup.find("meta", property="og:image")
    og_image_v = "20260420"
    if og_img:
        m3 = re.search(r'\?v=(\d+)', og_img.get("content", ""))
        if m3:
            og_image_v = m3.group(1)

    # Audio
    has_audio = bool(soup.find("div", class_="note-audio-player"))

    # Ringkasan (#mula-nota)
    ringkasan_el = soup.find(id="mula-nota")
    ringkasan = []
    if ringkasan_el:
        chip_list = ringkasan_el.find("div", class_="paper-chip-list")
        if chip_list:
            ringkasan = _extract_chip_list(chip_list)

    # Soalan Utama
    flap = soup.find("article", class_="paper-flap-card")
    soalan_utama = {}
    if flap:
        heading_el = flap.find("p", class_="point-heading")
        soalan_text = _kw_spans_to_syntax(heading_el) if heading_el else ""
        soalan_text = re.sub(r'\s+', ' ', soalan_text).strip()

        jawapan = []
        answer_paper = flap.find("div", class_="answer-paper")
        if answer_paper:
            for el in answer_paper.children:
                if not hasattr(el, 'name') or el.name is None:
                    continue
                if "point-line" in (el.get("class") or []):
                    jawapan.append(_element_to_item(el))
                elif el.name == "div" and "paper-chip-list" in (el.get("class") or []):
                    jawapan.extend(_extract_chip_list(el))

        # Use second heading if exists (the question is separate from the answer heading)
        headings = flap.find_all("p", class_="point-heading")
        soalan_q = soalan_text
        heading_ans = ""
        if len(headings) >= 2:
            soalan_q = re.sub(r'\s+', ' ', _kw_spans_to_syntax(headings[0])).strip()
            heading_ans = re.sub(r'\s+', ' ', _kw_spans_to_syntax(headings[1])).strip()
        elif headings:
            soalan_q = re.sub(r'\s+', ' ', _kw_spans_to_syntax(headings[0])).strip()

        soalan_utama = {
            "soalan": soalan_q,
            "heading": heading_ans or soalan_q,
            "jawapan": jawapan,
        }

    # Fokus
    fokus_text = ""
    fokus_board = None
    all_boards = soup.find_all("article", class_="paper-board")
    for board in all_boards:
        strip = board.find("div", class_="paper-strip")
        if strip and "Fokus" in strip.get_text():
            fokus_board = board
            break

    if fokus_board:
        fokus_line = fokus_board.find("p", class_="point-line")
        if fokus_line:
            fokus_text = re.sub(r'\s+', ' ', _kw_spans_to_syntax(fokus_line)).strip()

    # Bahagian (note-subsection after fokus)
    bahagian = []
    subsections = soup.find_all("section", class_="note-subsection")
    section_ordinals = ["Pertama", "Kedua", "Ketiga", "Keempat", "Kelima",
                        "Keenam", "Ketujuh", "Kelapan", "Kesembilan", "Kesepuluh"]
    section_counter = 0

    for sub in subsections:
        # Skip fokus, soalan utama, kesimpulan, nav sections
        if sub.find("article", class_="paper-flap-card"):
            continue
        if sub.find(id="mula-nota"):
            continue
        strip_els = sub.find_all("div", class_="paper-strip")
        is_fokus = any("Fokus" in s.get_text() for s in strip_els)
        if is_fokus:
            continue
        strip_els2 = sub.find_all("div", class_="paper-strip")
        is_kesimpulan = any("Kesimpulan" in s.get_text() for s in strip_els2)
        if is_kesimpulan:
            continue

        heading_div = sub.find("div", class_="section-heading")
        if not heading_div:
            continue  # nav section or similar

        # Extract section label and title
        label_el = heading_div.find("div", class_="paper-label")
        label = label_el.get_text().strip() if label_el else ""
        h2 = heading_div.find("h2")
        section_title = ""
        if h2:
            img = h2.find("img")
            if img:
                img.decompose()
            section_title = re.sub(r'\s+', ' ', h2.get_text()).strip()

        desc_el = heading_div.find("p")
        desc = desc_el.get_text().strip() if desc_el else ""

        # Extract kandungan blocks
        kandungan = []
        # Boards in this subsection
        for board in sub.find_all("article", class_="paper-board", recursive=True):
            strip = board.find("div", class_="paper-strip")
            strip_text = strip.get_text().strip() if strip else ""
            board_tajuk = strip_text if strip_text else ""
            # Remove emoji from strip text
            board_tajuk = re.sub(r'[^\w\s\-–—:.,\'\"()\[\]{}]', '', board_tajuk).strip()

            senarai = []
            chip_list = board.find("div", class_="paper-chip-list")
            if chip_list:
                senarai = _extract_chip_list(chip_list)
            emoji_ul = board.find("ul", class_="emoji-point-list")
            if emoji_ul:
                senarai = _extract_emoji_list(emoji_ul)
            for pl in board.find_all("p", class_="point-line", recursive=False):
                senarai.append(_element_to_item(pl))

            strip_cls = ""
            if strip:
                strip_classes = strip.get("class", [])
                strip_cls = next((c for c in strip_classes if c.startswith("strip-")), "")

            kandungan.append({
                "jenis": "board",
                "tajuk": board_tajuk,
                "strip": bool(strip),
                "senarai": senarai,
            })

        # Accordions
        accordion_el = sub.find("div", class_="paper-accordion")
        if accordion_el:
            items = []
            for acc_item in accordion_el.find_all("article", class_="paper-accordion-item"):
                title_el = acc_item.find("span", class_="paper-accordion-title")
                item_title = title_el.get_text().strip() if title_el else ""
                panel = acc_item.find("div", class_="paper-accordion-panel")
                item_senarai = []
                if panel:
                    for pl in panel.find_all("p", class_="point-line"):
                        item_senarai.append(_element_to_item(pl))
                    cl = panel.find("div", class_="paper-chip-list")
                    if cl:
                        item_senarai.extend(_extract_chip_list(cl))
                items.append({"tajuk": item_title, "senarai": item_senarai})

            kandungan.append({"jenis": "accordion", "items": items})

        if kandungan:
            section_counter += 1
            bahagian.append({
                "tajuk": section_title,
                "label": label,
                "desc": desc,
                "kandungan": kandungan,
            })

    # Kesimpulan
    kesimpulan = []
    conclusion = soup.find("article", class_="conclusion-paper")
    if conclusion:
        for el in conclusion.find_all(["div", "p"], recursive=False):
            cls = el.get("class") or []
            if "paper-strip" in cls or "cv-unit-body" not in cls:
                pass
        body_div = conclusion.find("div", class_="cv-unit-body")
        if body_div:
            # h2 inside conclusion
            h2 = body_div.find("h2")
            if h2:
                img = h2.find("img")
                if img:
                    img.decompose()
                kesimpulan.append(f"[light_bulb] {h2.get_text().strip()}")
            for pl in body_div.find_all("p", class_="point-line"):
                kesimpulan.append(_element_to_item(pl))
            cl = body_div.find("div", class_="paper-chip-list")
            if cl:
                kesimpulan.extend(_extract_chip_list(cl))

    result = {
        "subtopik": subtopik_code,
        "tajuk": tajuk,
        "bab": bab_num,
        "tajuk_bab": tajuk_bab,
        "bab_label": bab_label,
        "subjek": "Sejarah",
        "tingkatan": 4,
        "tema": meta.get("tema", f"bab-theme-{bab_num}"),
        "audio": has_audio,
        "has_quiz": meta.get("_has_quiz", False),
        "fail_sebelum": fail_sebelum,
        "fail_seterusnya": fail_seterusnya,
        "kod_seterusnya": kod_seterusnya,
        "og_image_v": og_image_v,
        "description": meta.get("description", ""),
        "lead": lead,
        "ringkasan": ringkasan,
        "soalan_utama": soalan_utama,
        "fokus": fokus_text,
        "bahagian": bahagian,
        "kesimpulan": kesimpulan,
    }
    # Clean up empty keys
    return {k: v for k, v in result.items() if v or v == 0 or k in ("has_quiz", "audio")}


def migrate_bab(soup, fail_ini: str) -> dict:
    """Extract YAML data from a chapter hub HTML page."""
    meta = _extract_meta(soup, fail_ini)
    m = re.match(r'bab-(\d+)\.html', fail_ini)
    bab_num = int(m.group(1)) if m else 0

    # JSON-LD
    jsonld_scripts = soup.find_all("script", type="application/ld+json")
    tajuk = ""
    bab_label = f"Bab {bab_num}"
    for script in jsonld_scripts:
        try:
            jd = json.loads(script.string)
            if jd.get("@type") == "BreadcrumbList":
                for item in jd.get("itemListElement", []):
                    if item.get("position") == 3:
                        parts = item.get("name", "").split(" · ", 1)
                        if len(parts) == 2:
                            bab_label, tajuk = parts[0].strip(), parts[1].strip()
        except Exception:
            pass

    # Lead
    lead_el = soup.find("p", class_="lead")
    lead = _kw_spans_to_syntax(lead_el).strip() if lead_el else ""
    lead = re.sub(r'\s+', ' ', lead).strip()

    # OG image version
    og_img = soup.find("meta", property="og:image")
    og_image_v = "20260420"
    if og_img:
        m2 = re.search(r'\?v=(\d+)', og_img.get("content", ""))
        if m2:
            og_image_v = m2.group(1)

    # Navigation
    nav_links = soup.find_all("a", class_="btn")
    fail_sebelum = ""
    fail_seterusnya = ""
    for a in nav_links:
        text = a.get_text().strip()
        href = a.get("href", "")
        if "sebelum" in text.lower() and href:
            fail_sebelum = href
        elif "seterusnya" in text.lower() and href:
            fail_seterusnya = href

    # Sinopsis
    sinopsis = []
    master = soup.find("article", class_="master-summary-paper")
    if master:
        chip_list = master.find("div", class_="paper-chip-list")
        if chip_list:
            sinopsis = _extract_chip_list(chip_list)

    # Subtopik cards
    subtopik_list = []
    bab_grid = soup.find("div", class_="bab-grid")
    if bab_grid:
        for card in bab_grid.find_all("a", class_="bab-card"):
            top = card.find("div", class_="bab-card-top")
            kod = top.get_text().strip() if top else ""
            h3 = card.find("h3")
            card_tajuk = h3.get_text().strip() if h3 else ""
            p = card.find("p")
            penerangan = p.get_text().strip() if p else ""
            subtopik_list.append({
                "kod": kod,
                "tajuk": card_tajuk,
                "penerangan": penerangan,
            })

    result = {
        "bab": bab_num,
        "tajuk": tajuk,
        "bab_label": bab_label,
        "subjek": "Sejarah",
        "tingkatan": 4,
        "tema": meta.get("tema", f"bab-theme-{bab_num}"),
        "og_image_v": og_image_v,
        "description": meta.get("description", ""),
        "lead": lead,
        "sinopsis": sinopsis,
        "subtopik": subtopik_list,
    }
    if fail_sebelum:
        result["fail_sebelum"] = fail_sebelum
    if fail_seterusnya:
        result["fail_seterusnya"] = fail_seterusnya
    return result


def migrate_file(html_path: Path, overwrite: bool = False) -> Path | None:
    fail_ini = html_path.name
    m_sub = re.match(r'bab-(\d+)-(\d+)\.html$', fail_ini)
    m_bab = re.match(r'bab-(\d+)\.html$', fail_ini)

    if not m_sub and not m_bab:
        return None  # skip index.html etc.

    out_name = fail_ini.replace(".html", ".yaml")
    out_path = CONTENT_DIR / out_name

    if out_path.exists() and not overwrite:
        print(f"  skip   {out_name} (already exists, use --overwrite to replace)")
        return None

    html_text = html_path.read_text(encoding="utf-8")
    soup = BeautifulSoup(html_text, "html.parser")

    if m_sub:
        data = migrate_subtopik(soup, fail_ini)
    else:
        data = migrate_bab(soup, fail_ini)

    # Write YAML
    yaml_text = yaml.dump(
        data,
        allow_unicode=True,
        default_flow_style=False,
        sort_keys=False,
        width=120,
    )
    out_path.write_text(yaml_text, encoding="utf-8")
    return out_path


def main():
    args = sys.argv[1:]
    overwrite = "--overwrite" in args
    explicit = [Path(a) for a in args if not a.startswith("--")]

    CONTENT_DIR.mkdir(exist_ok=True)

    if explicit:
        html_files = explicit
    else:
        html_files = sorted(NOTES_DIR.glob("bab-*.html"))

    migrated = 0
    skipped = 0
    errors = 0

    for hf in html_files:
        try:
            result = migrate_file(hf, overwrite=overwrite)
            if result:
                print(f"  migrated  {hf.name} → {result.name}")
                migrated += 1
            else:
                skipped += 1
        except Exception as exc:
            print(f"  ERROR  {hf.name}: {exc}")
            import traceback
            traceback.print_exc()
            errors += 1

    print(f"\nDone: {migrated} migrated, {skipped} skipped, {errors} errors.")
    print("Review content/*.yaml files before running build.py")


if __name__ == "__main__":
    main()
