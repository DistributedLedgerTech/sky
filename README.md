# DLT - Distributed Ledger Technologies Website

Production-ready website for distributedledgertechnologies.com

## Quick Deploy to GitHub Pages

1. Create new repo: `github.com/DistributedLedgerTech/dlt-website`
2. Upload all files from this zip
3. Add `ethnocentric.otf` font to `/fonts/` folder
4. Go to Settings → Pages → Deploy from branch → `main` → `/ (root)`
5. Wait for deployment
6. Set custom domain: `www.distributedledgertechnologies.com`

## DNS Configuration

Add these records to your domain registrar:

```
A     @     185.199.108.153
A     @     185.199.109.153
A     @     185.199.110.153
A     @     185.199.111.153
CNAME www   distributedledgertech.github.io
```

## Google Analytics Setup

1. Create GA4 property at analytics.google.com
2. Get your Measurement ID (G-XXXXXXXXXX)
3. Replace `GA_MEASUREMENT_ID` in index.html with your ID

## Files Included

```
├── index.html              # Main page
├── 404.html                # Coming soon page
├── privacy.html            # Privacy policy
├── terms.html              # Terms of service
├── CNAME                   # Custom domain
├── favicon.ico             # Legacy favicon
├── robots.txt              # SEO
├── sitemap.xml             # SEO
├── manifest.json           # PWA support
├── browserconfig.xml       # Windows tiles
├── css/
│   └── style.css           # All styles
├── js/
│   └── main.js             # Navigation, animations
├── fonts/
│   └── README.md           # Add ethnocentric.otf here
└── images/
    ├── logo.svg            # DLT logo
    ├── favicon.svg         # SVG favicon
    ├── apple-touch-icon.png
    ├── og-image.png        # 1200x630 social share
    ├── twitter-card.png    # 1200x600 Twitter
    └── icons/
        ├── android-chrome-512x512.png
        ├── android-chrome-192x192.png
        ├── apple-touch-icon-180x180.png
        ├── apple-touch-icon-152x152.png
        ├── apple-touch-icon-120x120.png
        ├── apple-touch-icon-76x76.png
        ├── apple-touch-icon.png
        ├── favicon-32x32.png
        ├── favicon-16x16.png
        └── mstile-150x150.png
```

## SEO Checklist

- [x] Meta descriptions
- [x] Open Graph tags
- [x] Twitter Card tags
- [x] Canonical URLs
- [x] Structured Data (JSON-LD)
- [x] Sitemap.xml
- [x] Robots.txt
- [x] Mobile responsive
- [x] Fast loading (minimal JS)

## Products Listed

| Product | Website | GitHub | Status |
|---------|---------|--------|--------|
| MacMetal Miner | macmetalminer.com | github.com/MacMetalMiner | Live |
| Cora Wallet | corawallet.com | github.com/CoraWallet | Coming 2026 |
| Ayedex | ayedex.com | github.com/Ayedex-Pool | Coming Soon |
| HydroDollar | hydrodollar.com | github.com/TheHydroDollar | Coming Soon |

## Support

Email: david@knexmail.com

---

© 2025 Distributed Ledger Technologies
