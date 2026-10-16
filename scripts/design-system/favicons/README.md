# Favicons

Regenerate the PNG and ICO files in `public/` after changing the mark (keep the geometry in sync with `src/components/shared/logo/Logo.tsx`):

```bash
playwright-cli open about:blank && playwright-cli run-code --filename=scripts/design-system/favicons/render.playwright.txt
python3 -I scripts/design-system/favicons/pack-ico.py public
```

`public/favicon.svg` and `public/site.webmanifest` are hand-authored; their colours are the `--fg`, `--canvas` and `--accent` token values.
