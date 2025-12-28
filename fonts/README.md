# Fonts Directory

Place the `ethnocentric.otf` font file in this directory.

This font is used only for the "DLT" logo text.

## Usage

The font is loaded in `css/style.css`:

```css
@font-face {
    font-family: 'Ethnocentric';
    src: url('../fonts/ethnocentric.otf') format('opentype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
}
```

If the font is not available, the logo will fall back to system fonts.
