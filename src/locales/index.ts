import type { ResourceLanguage } from 'i18next';

function buildLocaleMap(modules: Record<string, unknown>, lang: string): ResourceLanguage {
  const result: ResourceLanguage = {};

  for (const [filePath, mod] of Object.entries(modules)) {
    // filePath looks like "./en/common.json" or "./ar/nav.json"
    const match = filePath.match(new RegExp(`^\\./(?:${lang})/(.+)\\.json$`));
    if (!match) continue;

    const namespace = match[1];
    const value = mod as { default?: ResourceLanguage } | ResourceLanguage;
    result[namespace] = ('default' in value ? value.default : value) as ResourceLanguage;
  }

  return result;
}

// The `docs` namespace belongs to the docs site (development and the docs build), so app builds leave it out. A
// block's copy (block-*.json) loads with the block itself (useBlockTranslation), never with every page.
const allModules =
  import.meta.env.DEV || import.meta.env.MODE === 'docs'
    ? import.meta.glob(['./{en,ar}/*.json', '!./{en,ar}/block-*.json'], { eager: true })
    : import.meta.glob(['./{en,ar}/*.json', '!./{en,ar}/docs.json', '!./{en,ar}/block-*.json'], { eager: true });

const EN = buildLocaleMap(allModules, 'en');
const AR = buildLocaleMap(allModules, 'ar');

export const LOCALES = { EN, AR } as const;
