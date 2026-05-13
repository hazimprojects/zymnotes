"""Parse ZymNotes YAML content files into structured Python dicts."""

from __future__ import annotations
import re
import yaml
from pathlib import Path

_KW_TYPES = {
    # Standard 8 types
    "tokoh", "tahun", "tempat", "peristiwa",
    "gerakan", "pertubuhan", "karya", "istilah",
    # Extended types used in Bab 1 and others
    "kerajaan", "konsep", "masa", "pentadbiran", "perjanjian",
}

# Matches [text]{type} keyword syntax
_KW_RE = re.compile(
    r'\[([^\]]+)\]\{(' + '|'.join(_KW_TYPES) + r')\}'
)

# Matches [emoji_name] at the start of an item string (with optional trailing space)
_EMOJI_PREFIX_RE = re.compile(r'^\[([a-z0-9_]+)\]\s*')


def parse_inline(text: str) -> str:
    """Convert [text]{type} keyword syntax to HTML span tags."""
    return _KW_RE.sub(
        lambda m: f'<span class="kw kw-{m.group(2)}">{m.group(1)}</span>',
        text
    )


def parse_item(item_str: str) -> tuple[str, str]:
    """
    Parse a list item like "[pushpin] text with [keyword]{type}".
    Returns (emoji_name, html_text).
    Default emoji is 'pushpin' when no prefix found.
    """
    item_str = str(item_str).strip()
    m = _EMOJI_PREFIX_RE.match(item_str)
    if m:
        emoji_name = m.group(1)
        rest = item_str[m.end():]
    else:
        emoji_name = "pushpin"
        rest = item_str
    return emoji_name, parse_inline(rest)


def load_content_file(path: Path) -> dict:
    """Load and validate a YAML content file."""
    with open(path, encoding="utf-8") as f:
        data = yaml.safe_load(f)
    if not isinstance(data, dict):
        raise ValueError(f"Expected dict at top level in {path}")
    return data


def is_subtopik(data: dict) -> bool:
    """True if subtopik is a string code like '2.1' (vs a list in hub files)."""
    return isinstance(data.get("subtopik"), str)


def get_fail_ini(data: dict) -> str:
    """Derive the output HTML filename from metadata."""
    if is_subtopik(data):
        code = str(data["subtopik"]).replace(".", "-")
        return f"bab-{code}.html"
    return f"bab-{data['bab']}.html"


def get_subjek_label(data: dict) -> str:
    """Return 'Nota Sejarah' or similar for header subtitle."""
    return f"Nota {data.get('subjek', 'Sejarah')}"
