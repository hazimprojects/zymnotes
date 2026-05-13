"""Fluent UI 3D emoji shortcode → CDN URL mapping for ZymNotes build system."""

EMOJI_BASE = "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@62ecdc0d7ca5/assets"

# (path_suffix, fallback_text)
EMOJI_MAP = {
    "pushpin":          ("Pushpin/3D/pushpin_3d.png", "📌"),
    "red_heart":        ("Red heart/3D/red_heart_3d.png", "❤️"),
    "crossed_swords":   ("Crossed swords/3D/crossed_swords_3d.png", "⚔️"),
    "brain":            ("Brain/3D/brain_3d.png", "🧠"),
    "bust":             ("Bust in silhouette/3D/bust_in_silhouette_3d.png", "👤"),
    "light_bulb":       ("Light bulb/3D/light_bulb_3d.png", "💡"),
    "headphone":        ("Headphone/3D/headphone_3d.png", "🎧"),
    "question":         ("Red question mark/3D/red_question_mark_3d.png", "❓"),
    "speech_left":      ("Left speech bubble/3D/left_speech_bubble_3d.png", "🗨️"),
    "speech_balloon":   ("Speech balloon/3D/speech_balloon_3d.png", "💬"),
    "magnify_right":    ("Magnifying glass tilted right/3D/magnifying_glass_tilted_right_3d.png", "🔍"),
    "magnify_left":     ("Magnifying glass tilted left/3D/magnifying_glass_tilted_left_3d.png", "🔎"),
    "shield":           ("Shield/3D/shield_3d.png", "🛡️"),
    "bullseye":         ("Bullseye/3D/bullseye_3d.png", "🎯"),
    "megaphone":        ("Megaphone/3D/megaphone_3d.png", "📣"),
    "raised_fist":      ("Raised fist/Default/3D/raised_fist_3d_default.png", "✊"),
    "classical_building": ("Classical building/3D/classical_building_3d.png", "🏛️"),
    "crown":            ("Crown/3D/crown_3d.png", "👑"),
    "handshake":        ("Handshake/3D/handshake_3d.png", "🤝"),
    "chart":            ("Chart increasing/3D/chart_increasing_3d.png", "📈"),
    "globe":            ("Globe showing asia-australia/3D/globe_showing_asia-australia_3d.png", "🌏"),
    "globe_meridians":  ("Globe with meridians/3D/globe_with_meridians_3d.png", "🌐"),
    "hibiscus":         ("Hibiscus/3D/hibiscus_3d.png", "🌺"),
    "fire":             ("Fire/3D/fire_3d.png", "🔥"),
    "brick":            ("Brick/3D/brick_3d.png", "🧱"),
    "star":             ("Star/3D/star_3d.png", "⭐"),
    "books":            ("Books/3D/books_3d.png", "📚"),
    "open_book":        ("Open book/3D/open_book_3d.png", "📖"),
    "scroll":           ("Scroll/3D/scroll_3d.png", "📜"),
    "dna":              ("Dna/3D/dna_3d.png", "🧬"),
    "mosque":           ("Mosque/3D/mosque_3d.png", "🕌"),
    "speaking_head":    ("Speaking head/3D/speaking_head_3d.png", "🗣️"),
    "japanese_dolls":   ("Japanese dolls/3D/japanese_dolls_3d.png", "🎎"),
    "clock":            ("Mantelpiece clock/3D/mantelpiece_clock_3d.png", "🕰️"),
    "puzzle":           ("Puzzle piece/3D/puzzle_piece_3d.png", "🧩"),
    "flag":             ("Flag in hole/3D/flag_in_hole_3d.png", "⛳"),
    "handshake_light":  ("Handshake/3D/handshake_3d.png", "🤝"),
    "sparkles":         ("Sparkles/3D/sparkles_3d.png", "✨"),
    "warning":          ("Warning/3D/warning_3d.png", "⚠️"),
    "checkmark":        ("Check mark button/3D/check_mark_button_3d.png", "✅"),
    "newspaper":        ("Newspaper/3D/newspaper_3d.png", "📰"),
    "pen":              ("Pen/3D/pen_3d.png", "🖊️"),
    "scales":           ("Balance scale/3D/balance_scale_3d.png", "⚖️"),
    "map":              ("World map/3D/world_map_3d.png", "🗺️"),
    "scroll_old":       ("Scroll/3D/scroll_3d.png", "📜"),
    "rice":             ("Sheaf of rice/3D/sheaf_of_rice_3d.png", "🌾"),
    "factory":          ("Factory/3D/factory_3d.png", "🏭"),
    "person":           ("Bust in silhouette/3D/bust_in_silhouette_3d.png", "👤"),
}

# Keycap 1–9 generated dynamically
for _n in range(1, 10):
    EMOJI_MAP[f"keycap_{_n}"] = (f"Keycap {_n}/3D/keycap_{_n}_3d.png", f"#{_n}")


def get_emoji_url(name: str) -> str:
    """Return full CDN URL for an emoji shortcode. Falls back to pushpin."""
    entry = EMOJI_MAP.get(name, EMOJI_MAP["pushpin"])
    path = entry[0]
    # URL-encode spaces for the CDN path
    encoded = path.replace(" ", "%20")
    return f"{EMOJI_BASE}/{encoded}"


def get_emoji_img(name: str, size: int = 20, extra_class: str = "openmoji--inline") -> str:
    """Return an <img> tag for a Fluent 3D emoji."""
    url = get_emoji_url(name)
    return (
        f'<img class="fluent-3d-emoji {extra_class}" '
        f'src="{url}" width="{size}" height="{size}" alt="" decoding="async" />'
    )


def get_chip_img(name: str) -> str:
    """Return an <img> tag sized for paper-chip icons (20×20)."""
    url = get_emoji_url(name)
    return (
        f'<img class="fluent-3d-emoji openmoji--chip" '
        f'src="{url}" width="20" height="20" alt="" decoding="async" />'
    )
