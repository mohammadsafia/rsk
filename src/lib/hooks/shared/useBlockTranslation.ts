import { useTranslation } from 'react-i18next';

import { type BlockNamespace, useAppTranslation } from './useAppTranslation';

/** A block's copy, by language: its src/locales/{en,ar}/block-<id>.json. */
export type BlockResources = { en: Record<string, unknown>; ar: Record<string, unknown> };

/**
 * useAppTranslation for a block. The block imports its own locale files and passes them here, so its copy loads with
 * the block (a lazy route, or the page that uses it) instead of with every page's first load. The bundles are added to
 * i18next the first time, and only if missing.
 */
export const useBlockTranslation = (namespace: BlockNamespace, resources: BlockResources) => {
  const { i18n } = useTranslation();

  for (const [language, bundle] of Object.entries(resources))
    if (!i18n.hasResourceBundle(language, namespace)) i18n.addResourceBundle(language, namespace, bundle);

  return useAppTranslation(namespace);
};
