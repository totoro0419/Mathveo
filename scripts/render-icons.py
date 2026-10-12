#!/usr/bin/env python3
"""Render Mathveo's approved SVG emblem to PWA PNG sizes.

Run: python scripts/render-icons.py
Requires: CairoSVG 2.7.1
"""
from pathlib import Path
import cairosvg

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / "public" / "icon.svg"
for size in (192, 512):
    dest = ROOT / "public" / f"icon-{size}.png"
    cairosvg.svg2png(url=str(source), write_to=str(dest), output_width=size, output_height=size)
    print(f"Wrote {dest.relative_to(ROOT)} ({size}x{size})")
