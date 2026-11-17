// scripts/design-system/theme-accent-file.test.ts — where theme:accent writes. Beside the script, not in the kit's
// tests/design-system/: the script is the app's own (scripts/design-system/), so an app that updates the kit keeps the
// script it has, and a kit test of the new script's exports would not compile there.
import { describe, expect, it } from 'vite-plus/test';

import { inScope } from '../kit/core';
import { extractBlock, overlayBlock, readProjectFile } from '../../tests/design-system/css-tokens';
import { hexToOklch } from './color';
import { ACCENT_FILE, accentCss, accentTheme, withAccentImport } from './theme-accent';

const tokensCss = readProjectFile('src/styles/tokens.css');
const light = extractBlock(tokensCss, ':root,\n.light');
const dark = extractBlock(tokensCss, '.dark');

describe('where theme:accent writes', () => {
  // It used to rewrite src/styles/tokens.css, a kit file: kit:status then showed the app's brand as an unexplained
  // change, and kit:update could not take the kit's token changes without a merge.
  const theme = accentTheme(hexToOklch('#0f766e'), { light, dark });

  it('writes an app-owned file, never a kit file', () => {
    expect(ACCENT_FILE).toBe('src/app-config/accent.css');
    expect(inScope(ACCENT_FILE)).toBe(false);
  });

  it('writes the four accent tokens per mode, under the selectors tokens.css uses', () => {
    const css = accentCss(theme);
    expect(extractBlock(css, ':root,\n.light')).toEqual({
      accent: theme.light.accent,
      'accent-hover': theme.light.hover,
      'accent-subtle': theme.light.subtle,
      'ring-subtle': theme.light.ringSubtle,
    });
    expect(extractBlock(css, '.dark')['accent-subtle']).toBe(theme.dark.subtle);
  });

  it('imports the accent file right after tokens.css, once', () => {
    const index = "@import 'tailwindcss';\n@import './styles/tokens.css';\n@import './styles/theme.css';\n";
    const once = withAccentImport(index);
    expect(once).toBe(
      "@import 'tailwindcss';\n@import './styles/tokens.css';\n@import './app-config/accent.css';\n@import './styles/theme.css';\n",
    );
    expect(withAccentImport(once)).toBe(once);
    expect(() => withAccentImport("@import 'tailwindcss';\n")).toThrow(/tokens\.css/);
  });

  it('the app’s index.css imports it, so the starter’s accent file takes effect', () => {
    expect(readProjectFile('src/index.css')).toContain("@import './styles/tokens.css';\n@import './app-config/accent.css';");
  });

  it('the contrast test reads the accent the app set over the kit’s tokens', () => {
    const merged = overlayBlock(tokensCss, accentCss(theme), '.dark');
    expect(merged.accent).toBe(theme.dark.accent);
    expect(merged.surface).toBe(dark.surface);
    // An accent file with no block for the mode (the starter's, before theme:accent) changes nothing.
    expect(overlayBlock(tokensCss, '/* empty */\n', '.dark')).toEqual(extractBlock(tokensCss, '.dark'));
  });
});
