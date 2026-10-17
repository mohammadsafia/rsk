import { Button, IconButton } from '@components/ui';

import { LANGUAGE_OPTIONS, type LANGUAGES } from '@constants';
import { useAppTranslation } from '@hooks/shared';

function LanguageSwitcher() {
  const { t, currentLanguage, changeLanguage } = useAppTranslation('header');

  const nextLanguage = LANGUAGE_OPTIONS.find((lang) => lang.code !== currentLanguage) ?? LANGUAGE_OPTIONS[0];

  const handleToggle = () => changeLanguage(nextLanguage.code as LANGUAGES);

  return (
    <IconButton onClick={handleToggle} aria-label={t('switchLanguage')} className="text-xs font-semibold tracking-wider uppercase">
      {nextLanguage.code.toUpperCase()}
    </IconButton>
  );
}

export default LanguageSwitcher;
