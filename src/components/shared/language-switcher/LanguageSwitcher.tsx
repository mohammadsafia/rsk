import { Button, IconButton } from '@components/ui';

import { LANGUAGE_OPTIONS, type LANGUAGES } from '@constants';
import { useAppTranslation } from '@hooks/shared';

function LanguageSwitcher() {
  const { t, currentLanguage, changeLanguage } = useAppTranslation('header');

  const nextLanguage = LANGUAGE_OPTIONS.find((lang) => lang.code !== currentLanguage) ?? LANGUAGE_OPTIONS[0];

  const handleToggle = () => changeLanguage(nextLanguage.code as LANGUAGES);

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
