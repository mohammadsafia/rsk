'use client';

import { useTranslation } from 'react-i18next';

import { type BlockNamespace, useAppTranslation } from './useAppTranslation';

/** The bundles already added to i18next. */
const registered = new WeakSet<BlockResources>();

/** A block's copy, by language: its src/locales/{en,ar}/block-<id>.json. */
export type BlockResources = { en: Record<string, unknown>; ar: Record<string, unknown> };

/**
 * useAppTranslation for a block. The block imports its own locale files and passes them here, so its copy loads with
 * the block (a lazy route, or the page that uses it) instead of with every page's first load. The bundles are merged into
 * i18next on first use.
 */
export const useBlockTranslation = (namespace: BlockNamespace, resources: BlockResources) => {
  const { i18n } = useTranslation();

  // Once per bundle (a new one after an edit in development), merged in: the block index may have added the
  // namespace's menu labels already.
  if (!registered.has(resources)) {
    for (const [language, bundle] of Object.entries(resources)) i18n.addResourceBundle(language, namespace, bundle, true, true);
    registered.add(resources);
  }

  return useAppTranslation(namespace);
};
