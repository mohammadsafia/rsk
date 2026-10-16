import { normalizeCategoryKey } from '@component-docs/registry';

export type LandingCounts = { ui: number; forms: number; shared: number; total: number };

export const countDocs = (entries: ReadonlyArray<{ category: string }>): LandingCounts => {
  const counts: LandingCounts = { ui: 0, forms: 0, shared: 0, total: entries.length };

  for (const { category } of entries) {
    const key = normalizeCategoryKey(category);
    if (key === 'UI') counts.ui += 1;
    else if (key === 'FORMS') counts.forms += 1;
    else if (key === 'SHARED') counts.shared += 1;
  }

  return counts;
};
