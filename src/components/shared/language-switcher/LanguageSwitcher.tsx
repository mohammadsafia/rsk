import { Button } from '@components/ui';

import { LANGUAGE_OPTIONS, type LANGUAGES } from '@constants';
import { useAppTranslation } from '@hooks/shared';

function LanguageSwitcher() {
  const { t, currentLanguage, changeLanguage } = useAppTranslation('header');

  const nextLanguage = LANGUAGE_OPTIONS.find((lang) => lang.code !== currentLanguage) ?? LANGUAGE_OPTIONS[0];

  const handleToggle = () => changeLanguage(nextLanguage.code as LANGUAGES);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      aria-label={t('switchLanguage')}
      title={t('switchLanguage')}
      className="text-muted-foreground hover:text-foreground h-9 w-9 text-xs font-semibold tracking-wider uppercase"
    >
      {nextLanguage.code.toUpperCase()}
    </Button>
  );
}

export default LanguageSwitcher;
