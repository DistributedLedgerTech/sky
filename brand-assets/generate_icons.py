#!/usr/bin/env python3
"""Generate all favicon, app icon, and OG image sizes from the green WWW logo SVG."""

import cairosvg
from PIL import Image
import io
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Green logo SVG source
LOGO_SVG = """<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
<rect fill='#000' width='100' height='100'/>
<rect x='4' y='4' width='92' height='92' fill='none' stroke='#00ff00' stroke-width='3'/>
<text x='50' y='50' font-size='22' text-anchor='middle' dominant-baseline='central'
  fill='#00ff00' font-family='Oxygen,Arial,sans-serif' font-weight='bold'
  letter-spacing='2'>WWW</text>
</svg>"""

# OG Image SVG (1200x630 with centered logo)
OG_SVG = """<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 630'>
<rect fill='#000' width='1200' height='630'/>
<rect x='440' y='115' width='320' height='320' rx='16' fill='#000' stroke='#00ff00' stroke-width='4'/>
<rect x='452' y='127' width='296' height='296' fill='none' stroke='#00ff00' stroke-width='3'/>
<text x='600' y='280' font-size='72' text-anchor='middle' dominant-baseline='central'
  fill='#00ff00' font-family='Oxygen,Arial,sans-serif' font-weight='bold'
  letter-spacing='6'>WWW</text>
<text x='600' y='510' font-size='28' text-anchor='middle' dominant-baseline='central'
  fill='#00ff00' font-family='Oxygen,Arial,sans-serif' font-weight='bold'
  letter-spacing='8' opacity='0.7'>NAU</text>
<text x='600' y='555' font-size='14' text-anchor='middle' dominant-baseline='central'
  fill='#00ff00' font-family='Oxygen,Arial,sans-serif'
  letter-spacing='4' opacity='0.4'>GOVERNANCE PROTOCOL</text>
</svg>"""

def svg_to_png(svg_string, width, height):
    """Convert SVG string to PNG bytes at given dimensions."""
    png_bytes = cairosvg.svg2png(
        bytestring=svg_string.encode('utf-8'),
        output_width=width,
        output_height=height,
    )
    return png_bytes

def save_png(svg_string, width, height, filename):
    """Save SVG as PNG at given dimensions."""
    path = os.path.join(BASE_DIR, filename)
    png_bytes = svg_to_png(svg_string, width, height)
    with open(path, 'wb') as f:
        f.write(png_bytes)
    size_kb = os.path.getsize(path) / 1024
    print(f"  ✓ {filename} ({width}x{height}) — {size_kb:.1f} KB")
    return png_bytes

# ─── Square icon sizes (favicons + app icons) ─────────────────
SQUARE_SIZES = {
    # Favicons
    'favicon-16x16.png': 16,
    'favicon-32x32.png': 32,
    'favicon-48x48.png': 48,
    'favicon-96x96.png': 96,

    # Apple Touch Icons
    'apple-touch-icon.png': 180,
    'apple-touch-icon-57x57.png': 57,
    'apple-touch-icon-60x60.png': 60,
    'apple-touch-icon-72x72.png': 72,
    'apple-touch-icon-76x76.png': 76,
    'apple-touch-icon-114x114.png': 114,
    'apple-touch-icon-120x120.png': 120,
    'apple-touch-icon-144x144.png': 144,
    'apple-touch-icon-152x152.png': 152,
    'apple-touch-icon-167x167.png': 167,
    'apple-touch-icon-180x180.png': 180,

    # Android / Chrome
    'android-chrome-36x36.png': 36,
    'android-chrome-48x48.png': 48,
    'android-chrome-72x72.png': 72,
    'android-chrome-96x96.png': 96,
    'android-chrome-144x144.png': 144,
    'android-chrome-192x192.png': 192,
    'android-chrome-256x256.png': 256,
    'android-chrome-384x384.png': 384,
    'android-chrome-512x512.png': 512,

    # Microsoft Tiles
    'mstile-70x70.png': 70,
    'mstile-144x144.png': 144,
    'mstile-150x150.png': 150,
    'mstile-310x310.png': 310,
}

print("═══ Generating Green WWW Logo Assets ═══\n")

# ─── Square PNGs ──────────────────────────────────────────────
print("▸ Square icons (favicons / app icons / tiles):")
icon_pngs = {}
for filename, size in sorted(SQUARE_SIZES.items(), key=lambda x: x[1]):
    png_data = save_png(LOGO_SVG, size, size, filename)
    icon_pngs[filename] = png_data

# ─── favicon.ico (multi-resolution) ──────────────────────────
print("\n▸ Multi-resolution favicon.ico:")
ico_sizes = [16, 32, 48]
ico_images = []
for s in ico_sizes:
    png_data = svg_to_png(LOGO_SVG, s, s)
    img = Image.open(io.BytesIO(png_data))
    ico_images.append(img)

ico_path = os.path.join(BASE_DIR, 'favicon.ico')
ico_images[0].save(
    ico_path,
    format='ICO',
    sizes=[(s, s) for s in ico_sizes],
    append_images=ico_images[1:]
)
ico_kb = os.path.getsize(ico_path) / 1024
print(f"  ✓ favicon.ico (16+32+48) — {ico_kb:.1f} KB")

# ─── OG Image (1200x630) ─────────────────────────────────────
print("\n▸ Open Graph / Social Media:")
save_png(OG_SVG, 1200, 630, 'og-image.png')
save_png(OG_SVG, 1200, 630, 'twitter-card.png')

# ─── Summary ─────────────────────────────────────────────────
print(f"\n═══ Done! {len(SQUARE_SIZES) + 3} files generated in {BASE_DIR}/ ═══")
