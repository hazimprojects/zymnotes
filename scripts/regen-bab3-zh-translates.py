#!/usr/bin/env python3
"""Backward-compatible wrapper: regenerate Bab 3 zh-units (ms→zh-CN).

Delegates to: python3 scripts/regen-zh-bab-translates.py --bab 3
"""

from __future__ import annotations

import runpy
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.argv = [str(ROOT / "scripts" / "regen-zh-bab-translates.py"), "--bab", "3"]
runpy.run_path(str(ROOT / "scripts" / "regen-zh-bab-translates.py"), run_name="__main__")
