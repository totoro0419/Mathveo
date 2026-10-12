#!/usr/bin/env python3
"""Rebuild Mathveo icons from the approved F image, not a vector approximation."""
from pathlib import Path
from io import BytesIO
from base64 import b64decode
from re import search
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
source = (ROOT / "public/icon.svg").read_text(encoding="utf-8")
match = search(r'href="data:image/webp;base64,([A-Za-z0-9+/=]+)"', source)
if not match:
    raise RuntimeError("Approved F artwork missing from public/icon.svg")
with Image.open(BytesIO(b64decode(match.group(1), validate=True))) as img:
    original = img.convert("RGB")
    if original.width != original.height:
        raise RuntimeError("Expected square F artwork")
    for size in (192, 512):
        path = ROOT / "public" / f"icon-{size}.png"
        original.resize((size, size), Image.Resampling.LANCZOS).save(path, optimize=True)
        print(f"Regenerated {path.name}: {size}x{size}")
