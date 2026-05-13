"""Generate complete HTML pages for ZymNotes from parsed YAML content."""

from __future__ import annotations
import re
import json
from content_parser import parse_inline, parse_item, is_subtopik, get_fail_ini, get_subjek_label
from emoji_map import get_emoji_img, get_chip_img

# ---------------------------------------------------------------------------
# zh-unit-id counter helpers
# ---------------------------------------------------------------------------

def _next_zh(counter: list[int], subtopik_slug: str) -> str:
    counter[0] += 1
    return f"bab-{subtopik_slug}-u{counter[0]:02d}"


# ---------------------------------------------------------------------------
# Component generators
# ---------------------------------------------------------------------------

def _chip(item_str: str, zh_id: str | None = None, sentence_class: bool = True) -> str:
    emoji, text = parse_item(item_str)
    img = get_chip_img(emoji)
    zh_attrs = (
        f' data-zh-unit-id="{zh_id}" data-zh-mode="explain"' if zh_id else ""
    )
    chip_cls = "paper-chip paper-chip-sentence" if sentence_class else "paper-chip"
    return (
        f'<div class="{chip_cls}" data-cv-collectible="false"{zh_attrs}>'
        f'<span class="chip-icon">{img}</span>{text}</div>'
    )


def _inline_chip(item_str: str, zh_id: str | None = None) -> str:
    """paper-chip without chip-icon wrapper — for inline chip lists inside boards."""
    emoji, text = parse_item(item_str)
    img = get_emoji_img(emoji, size=20)
    zh_attrs = (
        f' data-zh-unit-id="{zh_id}" data-zh-mode="explain"' if zh_id else ""
    )
    return (
        f'<div class="paper-chip" data-cv-collectible="false"{zh_attrs}>'
        f'{img} {text}</div>'
    )


def _point_line(item_str: str, zh_id: str | None = None) -> str:
    emoji, text = parse_item(item_str)
    img = get_emoji_img(emoji)
    zh_attrs = (
        f' data-zh-unit-id="{zh_id}" data-zh-mode="explain"' if zh_id else ""
    )
    return f'<p class="point-line"{zh_attrs}>{img} {text}</p>'


def _kingdom(text: str, keycap_n: int) -> str:
    img = get_emoji_img(f"keycap_{min(keycap_n, 9)}")
    clean = parse_inline(str(text))
    return (
        f'<article class="paper-kingdom" data-cv-collectible="false">'
        f'{img} {clean}</article>'
    )


def gen_ringkasan(data: dict, slug: str, counter: list[int]) -> str:
    subtopik_code = data.get("subtopik", str(data.get("bab", "")))
    cv_title = f"Ringkasan {subtopik_code}"
    items = data.get("ringkasan", [])
    chips_html = ""
    for item in items:
        zh_id = _next_zh(counter, slug)
        chips_html += _chip(item, zh_id=zh_id) + "\n"
    return (
        f'<article class="paper-board master-summary-paper reveal-on-scroll cv-unit" '
        f'data-cv-collectible="true" data-cv-title="{cv_title}" data-cv-type="board" id="mula-nota">\n'
        f'<div class="paper-strip strip-summary">{cv_title}</div>'
        f'<div class="cv-unit-body">\n'
        f'<div class="paper-chip-list">\n{chips_html}</div>\n'
        f'</div></article>\n'
    )


def gen_soalan_utama(data: dict, slug: str, counter: list[int]) -> str:
    sq = data.get("soalan_utama", {})
    soalan = parse_inline(str(sq.get("soalan", "")))
    heading = parse_inline(str(sq.get("heading", "")))
    jawapan_items = sq.get("jawapan", [])
    subtopik_code = data.get("subtopik", str(data.get("bab", "")))

    heading_id = f"bab-{slug}-soalan-heading"
    lines_html = f'<p class="point-heading" data-zh-unit-id="{heading_id}" data-zh-mode="explain">{heading}</p>\n'
    for i, item in enumerate(jawapan_items, 1):
        zh_id = f"bab-{slug}-soalan-line-{i}"
        lines_html += _point_line(item, zh_id=zh_id) + "\n"

    return (
        f'<section class="note-subsection reveal-on-scroll">\n'
        f'<article class="paper-flap-card cv-unit" data-cv-collectible="true" '
        f'data-cv-title="Soalan Utama {subtopik_code}" data-cv-type="flap">\n'
        f'<div class="flap-top">{get_emoji_img("question")} Soalan Utama</div>\n'
        f'<div class="flap-body">\n'
        f'<p class="point-heading" data-zh-unit-id="{heading_id}" data-zh-mode="explain">{soalan}</p>\n'
        f'<div class="cv-unit-body"><div class="answer-paper">\n'
        f'{lines_html}'
        f'</div></div>\n'
        f'</div>\n'
        f'</article>\n'
        f'</section>\n'
    )


def gen_fokus(data: dict, slug: str, counter: list[int]) -> str:
    """Generate the Fokus block. Uses kingdom grid if bahagian titles available."""
    subtopik_code = data.get("subtopik", str(data.get("bab", "")))
    fokus_items = data.get("fokus", [])
    bahagian = data.get("bahagian", [])

    # Build intro text (first fokus item that is a string, not a list)
    if fokus_items and isinstance(fokus_items, str):
        intro_text = parse_inline(fokus_items)
        kingdom_titles = [b.get("tajuk", "") for b in bahagian if b.get("tajuk")]
    elif fokus_items and isinstance(fokus_items, list):
        # First item is intro, rest are kingdom items (or auto from bahagian)
        first = fokus_items[0]
        if isinstance(first, str):
            _, intro_text = parse_item(first)
        else:
            intro_text = ""
        kingdom_titles = [b.get("tajuk", "") for b in bahagian if b.get("tajuk")]
    else:
        intro_text = ""
        kingdom_titles = [b.get("tajuk", "") for b in bahagian if b.get("tajuk")]

    # If no bahagian, fall back to remaining fokus items as kingdom titles
    if not kingdom_titles and isinstance(fokus_items, list) and len(fokus_items) > 1:
        for item in fokus_items[1:]:
            _, text = parse_item(str(item))
            kingdom_titles.append(text)

    fokus_line_id = f"bab-{slug}-fokus-line"

    kingdoms_html = ""
    for i, title in enumerate(kingdom_titles, 1):
        kingdoms_html += _kingdom(title, i) + "\n"

    grid_html = ""
    if kingdoms_html:
        grid_html = (
            f'<div class="paper-grid compact-kingdom-grid">\n{kingdoms_html}</div>\n'
        )

    intro_html = ""
    if intro_text:
        intro_html = (
            f'<p class="point-line" data-zh-unit-id="{fokus_line_id}" '
            f'data-zh-mode="explain">{intro_text}</p>\n'
        )

    return (
        f'<section class="note-subsection reveal-on-scroll">\n'
        f'<article class="paper-board cv-unit" data-cv-collectible="true" '
        f'data-cv-title="Fokus {subtopik_code}" data-cv-type="board">\n'
        f'<div class="paper-strip strip-sub">'
        f'{get_emoji_img("pushpin")} Fokus {subtopik_code}</div>'
        f'<div class="cv-unit-body">\n'
        f'{intro_html}'
        f'{grid_html}'
        f'</div></article>\n'
        f'</section>\n'
    )


def gen_board_block(block: dict, slug: str, counter: list[int]) -> str:
    tajuk = block.get("tajuk", "")
    strip = block.get("strip", False)
    strip_cls = block.get("strip_cls", "strip-sub")
    senarai = block.get("senarai", [])
    cv_title = parse_inline(tajuk) if tajuk else "Maklumat"

    header_html = ""
    if tajuk and strip:
        emoji_name = block.get("emoji", "pushpin")
        header_html = (
            f'<div class="paper-strip {strip_cls}">'
            f'{get_emoji_img(emoji_name)} {parse_inline(tajuk)}</div>'
        )
    elif tajuk and not strip:
        emoji_name = block.get("emoji", "magnify_left")
        header_html = (
            f'<div class="paper-strip strip-info">'
            f'{get_emoji_img(emoji_name)} {parse_inline(tajuk)}</div>'
        )

    two_col_cls = " two-col-chips" if block.get("two_col") else ""
    chips_html = ""
    for item in senarai:
        zh_id = _next_zh(counter, slug)
        chips_html += _inline_chip(str(item), zh_id=zh_id) + "\n"

    return (
        f'<article class="paper-board cv-unit" data-cv-collectible="true" '
        f'data-cv-title="{cv_title}" data-cv-type="board">'
        f'<div class="cv-unit-body">\n'
        f'{header_html}'
        f'<div class="paper-chip-list{two_col_cls}">\n{chips_html}</div>\n'
        f'</div></article>\n'
    )


def gen_accordion_block(block: dict, slug: str, counter: list[int]) -> str:
    items = block.get("items", [])
    items_html = ""
    for i, item in enumerate(items, 1):
        itajuk = parse_inline(str(item.get("tajuk", f"Item {i}")))
        senarai = item.get("senarai", [])
        # Generate a safe accordion ID from title
        acc_id = re.sub(r'[^a-z0-9]+', '-', itajuk.lower()).strip('-')
        acc_id = f"acc-{acc_id[:40]}"

        lines_html = ""
        for line in senarai:
            zh_id = _next_zh(counter, slug)
            lines_html += _point_line(str(line), zh_id=zh_id) + "\n"

        keycap = get_emoji_img(f"keycap_{min(i, 9)}")
        items_html += (
            f'<article class="paper-accordion-item cv-unit" data-cv-collectible="true" '
            f'data-cv-title="{itajuk}" data-cv-type="accordion">\n'
            f'<button class="paper-accordion-trigger" data-accordion="{acc_id}">\n'
            f'<span class="paper-accordion-no">{keycap}</span>\n'
            f'<span class="paper-accordion-title">{itajuk}</span>\n'
            f'</button>\n'
            f'<div class="paper-accordion-panel" id="{acc_id}"><div class="cv-unit-body">\n'
            f'{lines_html}'
            f'</div></div>\n'
            f'</article>\n'
        )

    return f'<div class="paper-accordion">\n{items_html}</div>\n'


def gen_steps_block(block: dict) -> str:
    """Generate paper-steps (horizontal process flow) from block dict.

    YAML schema::
        jenis: steps
        compact: true        # adds compact-steps class
        items:
          - emoji: droplet
            text: "Step text here"
    """
    compact_cls = " compact-steps" if block.get("compact") else ""
    items_html = ""
    for i, item in enumerate(block.get("items", [])):
        emoji = item.get("emoji", "pushpin")
        text = parse_inline(str(item.get("text", "")))
        items_html += (
            f'<div class="paper-step">\n'
            f'<div class="paper-step-icon">{get_emoji_img(emoji)}</div>\n'
            f'<p>{text}</p>\n'
            f'</div>\n'
        )
        # Add arrow between steps (not after the last one)
        if i < len(block.get("items", [])) - 1:
            items_html += (
                f'<div class="paper-step-arrow">'
                f'{get_emoji_img("right_arrow")}</div>\n'
            )
    return f'<div class="paper-steps{compact_cls}">\n{items_html}</div>\n'


def gen_timeline_block(block: dict, slug: str, counter: list[int]) -> str:
    """Generate paper-timeline (vertical timeline) from block dict.

    YAML schema::
        jenis: timeline
        items:
          - tarikh: "Februari 1943"
            kandungan:
              - "[entity]{type} did something at [Place]{tempat}."
    """
    items = block.get("items", [])
    parts = ""
    for i, item in enumerate(items, 1):
        tarikh = parse_inline(str(item.get("tarikh", "")))
        node_id = f"{slug}-time-{i}"
        content_lines = item.get("kandungan", [])
        panel_html = ""
        for line in content_lines:
            panel_html += f'<p>{parse_inline(str(line))}</p>\n'
        parts += (
            f'<div class="paper-timeline-node">'
            f'{get_emoji_img("calendar")} {tarikh}</div>\n'
            f'<div class="paper-timeline-panel" id="{node_id}">\n'
            f'{panel_html}'
            f'</div>\n'
        )
    return f'<div class="paper-timeline">\n{parts}</div>\n'


def gen_org_block(block: dict) -> str:
    """Generate org-chart (hierarchical structure) from block dict.

    YAML schema::
        jenis: org
        levels:
          - ["[crown] Sultan"]                         # level-1 nodes
          - ["[handshake] Bendahara"]                  # level-2 nodes
          - ["[money_bag] Bendahari", "[shield] Temenggung"]  # level-3 nodes
    """
    levels = block.get("levels", [])
    parts = ""
    for i, level_nodes in enumerate(levels, 1):
        nodes_html = ""
        for node_str in level_nodes:
            emoji, text = parse_item(str(node_str))
            nodes_html += (
                f'<div class="org-node">{get_emoji_img(emoji)} {text}</div>\n'
            )
        parts += f'<div class="org-level org-level-{i}">\n{nodes_html}</div>\n'
        # Add vertical arrow between levels (not after last)
        if i < len(levels):
            parts += (
                f'<div class="org-arrow">{get_emoji_img("down_arrow")}</div>\n'
            )
    return f'<div class="org-chart">\n{parts}</div>\n'


def gen_glossary_block(block: dict, slug: str, counter: list[int]) -> str:
    """Generate glossary-paper (styled text block) from block dict.

    YAML schema::
        jenis: glossary
        tajuk: "Petikan Surat Sultan Perak"
        emoji: scroll
        items:
          - "[light_bulb] Text here..."
          - "Plain text paragraph..."
    """
    tajuk = block.get("tajuk", "")
    emoji_name = block.get("emoji", "books")
    senarai = block.get("items", block.get("senarai", []))
    cv_title = parse_inline(tajuk) if tajuk else "Maklumat"

    strip_html = ""
    if tajuk:
        strip_html = (
            f'<div class="paper-strip strip-glossary">'
            f'{get_emoji_img(emoji_name)} {cv_title}</div>'
        )

    lines_html = ""
    for item in senarai:
        zh_id = _next_zh(counter, slug)
        lines_html += _point_line(str(item), zh_id=zh_id) + "\n"

    return (
        f'<article class="paper-board glossary-paper cv-unit" '
        f'data-cv-collectible="true" data-cv-title="{cv_title}" data-cv-type="board">\n'
        f'{strip_html}<div class="cv-unit-body">\n'
        f'{lines_html}'
        f'</div></article>\n'
    )


def gen_section(section: dict, slug: str, counter: list[int], section_num: int) -> str:
    tajuk = parse_inline(str(section.get("tajuk", "")))
    label = section.get("label", "")
    kandungan = section.get("kandungan", [])
    desc = section.get("desc", "")

    ordinals = ["Pertama", "Kedua", "Ketiga", "Keempat", "Kelima",
                "Keenam", "Ketujuh", "Kelapan", "Kesembilan", "Kesepuluh"]
    label_text = label if label else f"Bahagian {ordinals[min(section_num-1, len(ordinals)-1)]}"

    desc_html = f"<p>{parse_inline(desc)}</p>\n" if desc else ""

    heading_html = (
        f'<div class="section-heading">\n'
        f'<div class="paper-label small">{label_text}</div>\n'
        f'<h2>{get_emoji_img("pushpin", size=22)} {tajuk}</h2>\n'
        f'{desc_html}'
        f'</div>\n'
    )

    blocks_html = ""
    for block in kandungan:
        jenis = block.get("jenis", "board")
        if jenis == "board":
            blocks_html += gen_board_block(block, slug, counter)
        elif jenis == "accordion":
            blocks_html += gen_accordion_block(block, slug, counter)
        elif jenis == "steps":
            blocks_html += gen_steps_block(block)
        elif jenis == "timeline":
            blocks_html += gen_timeline_block(block, slug, counter)
        elif jenis == "org":
            blocks_html += gen_org_block(block)
        elif jenis == "glossary":
            blocks_html += gen_glossary_block(block, slug, counter)

    return (
        f'<section class="note-subsection reveal-on-scroll">\n'
        f'{heading_html}'
        f'{blocks_html}'
        f'</section>\n'
    )


def gen_kesimpulan(data: dict, slug: str, counter: list[int]) -> str:
    subtopik_code = data.get("subtopik", str(data.get("bab", "")))
    items = data.get("kesimpulan", [])

    chips_html = ""
    for item in items:
        zh_id = _next_zh(counter, slug)
        chips_html += _inline_chip(str(item), zh_id=zh_id) + "\n"

    return (
        f'<section class="note-subsection reveal-on-scroll">\n'
        f'<article class="paper-board summary-paper conclusion-paper cv-unit" '
        f'data-cv-collectible="true" data-cv-title="Kesimpulan {subtopik_code}" '
        f'data-cv-type="board">\n'
        f'<div class="paper-strip strip-summary">'
        f'{get_emoji_img("bullseye")} Kesimpulan</div>'
        f'<div class="cv-unit-body">\n'
        f'<div class="paper-chip-list">\n{chips_html}</div>\n'
        f'</div></article>\n'
        f'</section>\n'
    )


# ---------------------------------------------------------------------------
# Head & structural helpers
# ---------------------------------------------------------------------------

def _head(data: dict, av: dict, fail_ini: str, title: str, description: str) -> str:
    css = av.get("css", {})
    og_image_v = data.get("og_image_v", "20260420")
    og_img = f"https://zymnotes.com/assets/og-image.png?v={og_image_v}"

    return f"""<!DOCTYPE html>

<html lang="ms">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0, viewport-fit=cover" name="viewport"/>
<title>{title}</title>
<meta content="{description}" name="description"/>
<link href="https://zymnotes.com/notes/{fail_ini}" rel="canonical"/>
<!-- Open Graph -->
<meta content="{title}" property="og:title"/>
<meta content="{description}" property="og:description"/>
<meta content="https://zymnotes.com/notes/{fail_ini}" property="og:url"/>
<meta content="{og_img}" property="og:image"/>
<meta content="{og_img}" property="og:image:url"/>
<meta content="image/png" property="og:image:type"/>
<meta content="{og_img}" property="og:image:secure_url"/>
<meta content="1200" property="og:image:width"/>
<meta content="630" property="og:image:height"/>
<meta content="ZymNotes — Nota Ulang Kaji Generasi Baharu" property="og:image:alt"/>
<meta content="website" property="og:type"/>
<meta content="ZymNotes" property="og:site_name"/>
<meta content="ms_MY" property="og:locale"/>
<!-- Twitter Card -->
<meta content="summary_large_image" name="twitter:card"/>
<meta content="{title}" name="twitter:title"/>
<meta content="{description}" name="twitter:description"/>
<meta content="{og_img}" name="twitter:image"/>
<meta content="{og_img}" name="twitter:image:src"/>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link as="style" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300;400;500;600&amp;family=Nunito:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&amp;family=Lexend:wght@400;500;600;700;800&amp;display=swap" onload="this.onload=null;this.rel='stylesheet'" rel="preload"/><noscript><link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300;400;500;600&amp;family=Nunito:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&amp;family=Lexend:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet"/></noscript>
<link as="style" href="../assets/css/base.css?v={css.get('base','1')}" rel="preload"/>
<link as="style" href="../assets/css/layout.css?v={css.get('layout','1')}" rel="preload"/>
<link as="style" href="../assets/css/ui.css?v={css.get('ui','1')}" rel="preload"/>
<link as="style" href="../assets/css/paper.css?v={css.get('paper','1')}" rel="preload"/>
<link as="style" href="../assets/css/keywords.css?v={css.get('keywords','1')}" rel="preload"/>
<link as="style" href="../assets/css/responsive.css?v={css.get('responsive','1')}" rel="preload"/>
<link as="style" href="../assets/css/themes.css?v={css.get('themes','1')}" rel="preload"/>
<link as="style" href="../assets/css/lab.css?v={css.get('lab','1')}" rel="preload"/>
<link href="../assets/css/style.css?v={av.get('style_css','1')}" rel="stylesheet"/>
<!-- Google tag (gtag.js) — deferred for performance -->
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());
  gtag('config', 'G-S26E62S18R');
  (function(){{
    function loadGA(){{
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=G-S26E62S18R';
      document.head.appendChild(s);
    }}
    if (document.readyState === 'complete') {{
      'requestIdleCallback' in window ? requestIdleCallback(loadGA) : setTimeout(loadGA, 0);
    }} else {{
      window.addEventListener('load', function(){{
        'requestIdleCallback' in window ? requestIdleCallback(loadGA) : setTimeout(loadGA, 0);
      }});
    }}
  }})();
</script>
<link href="/manifest.json?v={av.get('manifest','1')}" rel="manifest"/>
<link rel="icon" type="image/svg+xml" href="/icons/icon.svg?v={av.get('icon','1')}" />
<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png?v={av.get('favicon_32','1')}" />
<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png?v={av.get('apple_touch_icon','1')}" />
<meta content="#0D0F1A" name="theme-color"/>
<meta content="yes" name="mobile-web-app-capable"/>
<meta content="yes" name="apple-mobile-web-app-capable"/>
<meta content="default" name="apple-mobile-web-app-status-bar-style"/>
<meta content="ZymNotes" name="apple-mobile-web-app-title"/>
<meta name="msapplication-TileColor" content="#9B77FF" />
</head>
"""


def _header(data: dict) -> str:
    subjek_label = get_subjek_label(data)
    return f"""<header class="site-header">
    <div class="nav-wrap">
      <a class="app-logo-link" href="../index.html" aria-label="ZymNotes — Utama">
        <img src="/icons/icon.svg?v=5" class="app-logo-icon" alt="" aria-hidden="true" />
        <div>
          <div class="app-logo-name">ZymNotes</div>
          <div class="app-logo-sub">{subjek_label}</div>
        </div>
      </a>
    </div>
  </header>
"""


def _keyword_legend() -> str:
    kws = ["tokoh", "tahun", "tempat", "peristiwa", "gerakan", "pertubuhan", "karya", "istilah"]
    labels = ["Tokoh", "Tahun", "Tempat", "Peristiwa", "Gerakan", "Pertubuhan", "Karya", "Istilah"]
    items = "".join(
        f'<span class="keyword-legend-item"><span class="kw kw-{k}">{l}</span></span>'
        for k, l in zip(kws, labels)
    )
    return (
        f'<div class="keyword-legend-wrap">\n'
        f'<p class="keyword-legend-title">Warna kata kunci</p>\n'
        f'<div class="keyword-legend-grid">\n{items}\n</div>\n'
        f'</div>\n'
    )


def _footer() -> str:
    return """<footer class="page-footer">
<div class="page-footer-inner">
<span>© 2026 ZymNotes · Semua hak cipta terpelihara</span>
<span class="page-footer-sep">·</span>
<a href="/kredit.html" class="page-footer-link">Kredit</a>
</div>
</footer>
"""


def _scripts(av: dict) -> str:
    return (
        f'<script src="../assets/js/zh-mode.js?v={av.get("zh_mode_js","1")}"></script>'
        f'<script src="../assets/js/main.js?v={av.get("main_js","1")}"></script>'
        f'<script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.3/Sortable.min.js"></script>'
        f'<script src="../assets/js/canvas.js?v=1"></script>\n'
    )


def _jsonld_subtopik(data: dict, fail_ini: str) -> str:
    subtopik = data.get("subtopik", "")
    tajuk = data.get("tajuk", "")
    tajuk_bab = data.get("tajuk_bab", "")
    bab_label = data.get("bab_label", f"Bab {data.get('bab','')}")
    bab_url = f"bab-{data.get('bab','')}.html"
    subjek = data.get("subjek", "Sejarah")
    tingkatan = data.get("tingkatan", 4)
    description = data.get("description", "")

    breadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "ZymNotes", "item": "https://zymnotes.com/"},
            {"@type": "ListItem", "position": 2, "name": "Nota", "item": "https://zymnotes.com/notes/"},
            {"@type": "ListItem", "position": 3, "name": f"{bab_label} · {tajuk_bab}", "item": f"https://zymnotes.com/notes/{bab_url}"},
            {"@type": "ListItem", "position": 4, "name": f"{subtopik} {tajuk} · ZymNotes", "item": f"https://zymnotes.com/notes/{fail_ini}"},
        ]
    }
    article = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": f"Nota {subjek} Tingkatan {tingkatan} Bab {subtopik}: {tajuk}",
        "description": description,
        "inLanguage": "ms-MY",
        "educationalLevel": "SPM",
        "publisher": {"@type": "EducationalOrganization", "name": "ZymNotes", "url": "https://zymnotes.com"},
        "url": f"https://zymnotes.com/notes/{fail_ini}",
    }
    return (
        f'<script type="application/ld+json">\n'
        f'  {json.dumps(breadcrumb, ensure_ascii=False, indent=2)}\n'
        f'  </script>\n'
        f'  <script type="application/ld+json">\n'
        f'  {json.dumps(article, ensure_ascii=False, indent=2)}\n'
        f'  </script>\n'
    )


def _jsonld_bab(data: dict, fail_ini: str) -> str:
    bab_label = data.get("bab_label", f"Bab {data.get('bab','')}")
    tajuk = data.get("tajuk", "")
    subjek = data.get("subjek", "Sejarah")
    tingkatan = data.get("tingkatan", 4)
    description = data.get("description", "")

    breadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "ZymNotes", "item": "https://zymnotes.com/"},
            {"@type": "ListItem", "position": 2, "name": "Nota", "item": "https://zymnotes.com/notes/"},
            {"@type": "ListItem", "position": 3, "name": f"{bab_label} · {tajuk}", "item": f"https://zymnotes.com/notes/{fail_ini}"},
        ]
    }
    course = {
        "@context": "https://schema.org",
        "@type": "Course",
        "name": f"Nota {subjek} Tingkatan {tingkatan} {bab_label}: {tajuk}",
        "description": description,
        "provider": {"@type": "EducationalOrganization", "name": "ZymNotes", "url": "https://zymnotes.com"},
        "inLanguage": "ms-MY",
        "educationalLevel": "SPM",
        "url": f"https://zymnotes.com/notes/{fail_ini}",
    }
    return (
        f'<script type="application/ld+json">\n'
        f'  {json.dumps(breadcrumb, ensure_ascii=False, indent=2)}\n'
        f'  </script>\n'
        f'  <script type="application/ld+json">\n'
        f'  {json.dumps(course, ensure_ascii=False, indent=2)}\n'
        f'  </script>\n'
    )


# ---------------------------------------------------------------------------
# Full page generators
# ---------------------------------------------------------------------------

def gen_page_subtopik(data: dict, av: dict) -> str:
    fail_ini = get_fail_ini(data)
    subtopik = data.get("subtopik", "")
    tajuk = data.get("tajuk", "")
    tajuk_bab = data.get("tajuk_bab", "")
    bab_label = data.get("bab_label", f"Bab {data.get('bab','')}")
    bab = data.get("bab", "")
    tema = data.get("tema", f"bab-theme-{bab}")
    lead = parse_inline(str(data.get("lead", "")))
    description = data.get("description", "")
    subjek = data.get("subjek", "Sejarah")
    tingkatan = data.get("tingkatan", 4)
    has_quiz = data.get("has_quiz", False)
    has_audio = data.get("audio", False)
    fail_sebelum = data.get("fail_sebelum", f"bab-{bab}.html")
    fail_seterusnya = data.get("fail_seterusnya", "")
    kod_seterusnya = data.get("kod_seterusnya", "")

    # Slug for zh-unit-id generation
    slug = str(subtopik).replace(".", "-")
    counter = [0]

    title = f"Nota {subjek} Tingkatan {tingkatan} Bab {subtopik}: {tajuk} | ZymNotes"

    # Body attributes
    body_attrs = f'class="{tema} page-theme-notes note-reading-app"'
    if has_quiz:
        quiz_file = f"bab-{slug}.html"
        body_attrs += (
            f' data-lab-openmoji-hex="1F9E9.svg" data-lab-emoji="🧩"'
            f' data-lab-href="../quiz/{quiz_file}"'
        )

    # Audio
    audio_html = ""
    if has_audio:
        audio_src = f"../assets/audio/bab-{slug}.mp3"
        audio_html = f"""<div class="note-audio-player">
<audio class="audio-src" preload="metadata" src="{audio_src}"></audio>
<p class="audio-label">{get_emoji_img("headphone")} Audio Nota</p>
<p class="audio-desc">Dengar audio ini sambil membaca nota untuk pengulangkajian yang lebih berkesan. <span class="audio-disclaimer">Harap maklum, audio mungkin mengandungi penerangan ringkas — nota adalah rujukan utama.</span></p>
<div class="audio-controls">
<button aria-label="Undur 10 saat" class="audio-skip-btn" data-skip="-10">« 10s</button>
<button aria-label="Main audio" class="audio-play-btn"></button>
<button aria-label="Maju 10 saat" class="audio-skip-btn" data-skip="10">10s »</button>
<div class="audio-track"><div class="audio-track-fill"></div></div>
<span class="audio-time">0:00 / --:--</span>
</div>
</div>
"""

    # Ringkasan
    ringkasan_html = gen_ringkasan(data, slug, counter)

    # Soalan utama
    soalan_html = gen_soalan_utama(data, slug, counter)

    # Fokus
    fokus_html = gen_fokus(data, slug, counter)

    # Bahagian
    bahagian_html = ""
    for i, section in enumerate(data.get("bahagian", []), 1):
        bahagian_html += gen_section(section, slug, counter, i)

    # Kesimpulan
    kesimpulan_html = gen_kesimpulan(data, slug, counter)

    # Navigation
    nav_next = ""
    if fail_seterusnya:
        label_next = f"Seterusnya: {kod_seterusnya}" if kod_seterusnya else "Seterusnya"
        nav_next = f'<a class="btn btn-primary" href="{fail_seterusnya}">{label_next}</a>'
    nav_html = (
        f'<section class="note-subsection">\n'
        f'<div class="hero-actions">\n'
        f'<a class="btn btn-secondary" href="{fail_sebelum}">Kembali ke {bab_label}</a>\n'
        f'{nav_next}\n'
        f'</div>\n'
        f'</section>\n'
    )

    # JSON-LD
    jsonld = _jsonld_subtopik(data, fail_ini)

    return (
        _head(data, av, fail_ini, title, description) +
        f'<body {body_attrs}>\n' +
        _header(data) +
        f'<main class="note-reading-main">\n'
        f'<section class="section page-hero note-hero papercraft-hero">\n'
        f'<div class="container narrow">\n'
        f'<div class="paper-label">{bab_label} · {tajuk_bab}</div>\n'
        f'<p class="eyebrow">Subtopik {subtopik}</p>\n'
        f'<h1>{tajuk}</h1>\n'
        f'<p class="lead">\n{lead}\n</p>\n'
        f'{_keyword_legend()}'
        f'<div class="hero-actions">\n'
        f'<a class="btn btn-secondary" href="bab-{bab}.html">Kembali ke {bab_label}</a>\n'
        f'<a class="btn btn-primary" href="#mula-nota">Mula baca</a>\n'
        f'</div>\n'
        f'</div>\n'
        f'</section>\n'
        f'<section class="section note-section">\n'
        f'<div class="container narrow">\n'
        f'{audio_html}'
        f'{ringkasan_html}'
        f'{soalan_html}'
        f'{fokus_html}'
        f'{bahagian_html}'
        f'{kesimpulan_html}'
        f'{nav_html}'
        f'</div>\n'
        f'</section>\n'
        f'</main>\n' +
        _footer() +
        _scripts(av) +
        jsonld +
        '</body>\n</html>\n'
    )


def gen_page_bab(data: dict, av: dict) -> str:
    fail_ini = get_fail_ini(data)
    bab = data.get("bab", "")
    tajuk = data.get("tajuk", "")
    bab_label = data.get("bab_label", f"Bab {bab}")
    tema = data.get("tema", f"bab-theme-{bab}")
    description = data.get("description", "")
    subjek = data.get("subjek", "Sejarah")
    tingkatan = data.get("tingkatan", 4)
    lead = parse_inline(str(data.get("lead", "")))
    fail_sebelum = data.get("fail_sebelum", "")
    fail_seterusnya = data.get("fail_seterusnya", "")

    title = f"Nota {subjek} Tingkatan {tingkatan} {bab_label}: {tajuk} | ZymNotes"

    slug = f"bab-{bab}"

    # Sinopsis chips
    sinopsis_items = data.get("sinopsis", [])
    sinopsis_chips = ""
    for i, item in enumerate(sinopsis_items, 1):
        emoji, text = parse_item(str(item))
        img = get_chip_img(emoji)
        zh_attrs = f' data-zh-unit-id="{slug}-synopsis-{i}" data-zh-mode="explain"'
        sinopsis_chips += (
            f'<div class="paper-chip paper-chip-sentence"{zh_attrs}>'
            f'<span class="chip-icon">{img}</span>{text}</div>\n'
        )

    # Subtopik cards
    subtopik_list = data.get("subtopik", [])
    cards_html = ""
    for sub in subtopik_list:
        kod = str(sub.get("kod", ""))
        sub_tajuk = sub.get("tajuk", "")
        sub_penerangan = sub.get("penerangan", "")
        href = f"bab-{kod.replace('.', '-')}.html"
        cards_html += (
            f'<a class="bab-card" href="{href}">\n'
            f'<div class="bab-card-top">{kod}</div>\n'
            f'<h3>{sub_tajuk}</h3>\n'
            f'<p>{sub_penerangan}</p>\n'
            f'</a>\n'
        )

    # Navigation
    nav_html = ""
    nav_items = []
    if fail_sebelum:
        nav_items.append(f'<a class="btn btn-secondary" href="{fail_sebelum}">Bab sebelum</a>')
    if fail_seterusnya:
        nav_items.append(f'<a class="btn btn-primary" href="{fail_seterusnya}">Bab seterusnya</a>')
    if nav_items:
        nav_html = (
            f'<section class="note-subsection">\n'
            f'<div class="hero-actions">\n'
            + "\n".join(nav_items) +
            f'\n</div>\n</section>\n'
        )

    jsonld = _jsonld_bab(data, fail_ini)

    return (
        _head(data, av, fail_ini, title, description) +
        f'<body class="{tema} bab-hub-page">\n' +
        _header(data) +
        f'<main>\n'
        f'<section class="section page-hero papercraft-hero">\n'
        f'<div class="container narrow">\n'
        f'<div class="paper-label paper-label--with-icon">'
        f'{get_emoji_img("books", size=16, extra_class="fluent-3d-emoji--label-icon")}Bab Induk</div>\n'
        f'<h1>{bab_label} · {tajuk}</h1>\n'
        f'<p class="lead">\n{lead}\n</p>\n'
        f'{_keyword_legend()}'
        f'</div>\n'
        f'</section>\n'
        f'<section class="section note-section">\n'
        f'<div class="container narrow">\n'
        f'<article class="paper-board master-summary-paper reveal-on-scroll">\n'
        f'<div class="paper-strip strip-summary">Sinopsis {bab_label}</div>\n'
        f'<div class="paper-chip-list">\n{sinopsis_chips}</div>\n'
        f'</article>\n'
        f'<section class="note-subsection reveal-on-scroll">\n'
        f'<div class="section-heading">\n'
        f'<div class="paper-label small">Subtopik {bab_label}</div>\n'
        f'<h2 class="bab-hub-heading-openmoji">'
        f'{get_emoji_img("books", size=22, extra_class="fluent-3d-emoji--hub-heading")} Pilih subtopik</h2>\n'
        f'</div>\n'
        f'<div class="bab-grid">\n{cards_html}</div>\n'
        f'</section>\n'
        f'{nav_html}'
        f'</div>\n'
        f'</section>\n'
        f'</main>\n' +
        _footer() +
        _scripts(av) +
        jsonld +
        '</body>\n</html>\n'
    )
