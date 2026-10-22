'use client';

import { Button, IconButton } from '@components/ui';

import { type KitLanguage, useSetLanguage } from '@contexts';
import { useAppTranslation } from '@hooks/shared';

import { LANGUAGE_OPTIONS } from '@constants';

function LanguageSwitcher() {
  const setLanguage = useSetLanguage();
  const { t, currentLanguage } = useAppTranslation('header');

  const nextLanguage = LANGUAGE_OPTIONS.find((lang) => lang.code !== currentLanguage) ?? LANGUAGE_OPTIONS[0];

  const handleToggle = () => setLanguage(nextLanguage.code as KitLanguage);

  return (
    // The name starts with the visible code, so voice control users can say what they see (WCAG 2.5.3).
    <IconButton
      onClick={handleToggle}
      aria-label={`${nextLanguage.code.toUpperCase()}, ${t('switchLanguage')}`}
      className="text-xs font-semibold tracking-wider uppercase"
    >
      {nextLanguage.code.toUpperCase()}
    </IconButton>
  );
}

export default LanguageSwitcher;
