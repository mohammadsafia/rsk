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

const allModules = import.meta.glob('./{en,ar}/*.json', { eager: true });

const EN = buildLocaleMap(allModules, 'en');
const AR = buildLocaleMap(allModules, 'ar');

export const LOCALES = { EN, AR } as const;
