#!/usr/bin/env python3
"""Generate OG images matching the DLT WEB site design (green on black, Space Mono aesthetic)."""

import cairosvg
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Main OG Image — PAU branding with WWW logo
OG_MAIN = """<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 630'>
  <defs>
    <linearGradient id='gridFade' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#00ff00' stop-opacity='0.03'/>
      <stop offset='1' stop-color='#00ff00' stop-opacity='0.01'/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect fill='#000' width='1200' height='630'/>

  <!-- Subtle grid -->
  <g opacity='0.15'>
    <line x1='0' y1='0' x2='0' y2='630' stroke='#00ff00' stroke-width='0.5'/>
    <line x1='80' y1='0' x2='80' y2='630' stroke='#00ff00' stroke-width='0.3'/>
    <line x1='160' y1='0' x2='160' y2='630' stroke='#00ff00' stroke-width='0.3'/>
    <line x1='240' y1='0' x2='240' y2='630' stroke='#00ff00' stroke-width='0.3'/>
    <line x1='0' y1='80' x2='1200' y2='80' stroke='#00ff00' stroke-width='0.3'/>
    <line x1='0' y1='160' x2='1200' y2='160' stroke='#00ff00' stroke-width='0.3'/>
    <line x1='0' y1='240' x2='1200' y2='240' stroke='#00ff00' stroke-width='0.3'/>
    <line x1='0' y1='320' x2='1200' y2='320' stroke='#00ff00' stroke-width='0.3'/>
    <line x1='0' y1='400' x2='1200' y2='400' stroke='#00ff00' stroke-width='0.3'/>
    <line x1='0' y1='480' x2='1200' y2='480' stroke='#00ff00' stroke-width='0.3'/>
    <line x1='0' y1='560' x2='1200' y2='560' stroke='#00ff00' stroke-width='0.3'/>
  </g>

  <!-- Corner decorations -->
  <path d='M32,32 L32,72 M32,32 L72,32' stroke='#00ff00' stroke-width='1' fill='none' opacity='0.4'/>
  <path d='M1168,32 L1168,72 M1168,32 L1128,32' stroke='#00ff00' stroke-width='1' fill='none' opacity='0.4'/>
  <path d='M32,598 L32,558 M32,598 L72,598' stroke='#00ff00' stroke-width='1' fill='none' opacity='0.4'/>
  <path d='M1168,598 L1168,558 M1168,598 L1128,598' stroke='#00ff00' stroke-width='1' fill='none' opacity='0.4'/>

  <!-- WWW Logo box -->
  <rect x='80' y='140' width='80' height='80' fill='#000' stroke='#00ff00' stroke-width='2'/>
  <text x='120' y='185' font-size='18' text-anchor='middle' dominant-baseline='central'
    fill='#00ff00' font-family='Arial,sans-serif' font-weight='bold' letter-spacing='2'>WWW</text>

  <!-- PAU text -->
  <text x='180' y='165' font-size='20' fill='#00ff00' font-family='Arial,sans-serif'
    font-weight='bold' letter-spacing='8'>PAU</text>
  <text x='180' y='200' font-size='10' fill='#ffffff' font-family='monospace'
    letter-spacing='4' opacity='0.7'>GOVERNANCE PROTOCOL</text>

  <!-- Hero title -->
  <text x='80' y='320' font-size='96' fill='#00ff00' font-family='Arial,Helvetica,sans-serif'
    font-weight='bold'>Pan</text>
  <text x='80' y='420' font-size='96' fill='#ffffff' font-family='Arial,Helvetica,sans-serif'
    font-weight='bold'>American</text>
  <text x='80' y='510' font-size='96' fill='none' stroke='#00ff00' stroke-width='1.5'
    font-family='Arial,Helvetica,sans-serif' font-weight='bold'>Union</text>

  <!-- Right side stats -->
  <text x='1100' y='310' font-size='48' text-anchor='end' fill='#ffffff'
    font-family='monospace' font-weight='bold'>7</text>
  <text x='1100' y='335' font-size='10' text-anchor='end' fill='#ffffff'
    font-family='monospace' letter-spacing='4' opacity='0.6'>DAPPS</text>

  <text x='1100' y='410' font-size='48' text-anchor='end' fill='#ffffff'
    font-family='monospace' font-weight='bold'>32</text>
  <text x='1100' y='435' font-size='10' text-anchor='end' fill='#ffffff'
    font-family='monospace' letter-spacing='4' opacity='0.6'>CORES</text>

  <text x='1100' y='510' font-size='48' text-anchor='end' fill='#ffffff'
    font-family='monospace' font-weight='bold'>700k</text>
  <text x='1100' y='535' font-size='10' text-anchor='end' fill='#ffffff'
    font-family='monospace' letter-spacing='4' opacity='0.6'>TPS</text>

  <!-- Bottom tagline -->
  <text x='80' y='590' font-size='11' fill='#ffffff' font-family='monospace'
    letter-spacing='3' opacity='0.4'>INSTITUTIONAL-GRADE BLOCKCHAIN INFRASTRUCTURE</text>

  <!-- Horizon line -->
  <line x1='0' y1='560' x2='1200' y2='560' stroke='#00ff00' stroke-width='0.5' opacity='0.3'/>
</svg>"""

# Twitter card (same as OG)
TWITTER_CARD = OG_MAIN

def save_png(svg_string, width, height, filename):
    path = os.path.join(BASE_DIR, filename)
    png_bytes = cairosvg.svg2png(
        bytestring=svg_string.encode('utf-8'),
        output_width=width,
        output_height=height,
    )
    with open(path, 'wb') as f:
        f.write(png_bytes)
    size_kb = os.path.getsize(path) / 1024
    print(f"  ✓ {filename} ({width}x{height}) — {size_kb:.1f} KB")

print("═══ Generating PAU OG Images ═══\n")

save_png(OG_MAIN, 1200, 630, 'og-image.png')
save_png(TWITTER_CARD, 1200, 630, 'twitter-card.png')

# Also copy to root for the site
import shutil
shutil.copy2(os.path.join(BASE_DIR, 'og-image.png'), os.path.join(BASE_DIR, '..', 'og-image.png'))
shutil.copy2(os.path.join(BASE_DIR, 'twitter-card.png'), os.path.join(BASE_DIR, '..', 'twitter-image.png'))
print("\n  ✓ Copied to site root (og-image.png, twitter-image.png)")

print("\n═══ Done! ═══")
