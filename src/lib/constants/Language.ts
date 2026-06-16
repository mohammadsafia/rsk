export enum LANGUAGES {
  EN = 'en',
  AR = 'ar',
}

export type LanguageDirection = 'ltr' | 'rtl';

export type LanguageOption = {
  code: LANGUAGES;
  name: string;
  dir: LanguageDirection;
  flag: string;
};

export const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  { code: LANGUAGES.EN, name: 'English', dir: 'ltr', flag: '🇬🇧' },
  { code: LANGUAGES.AR, name: 'العربية', dir: 'rtl', flag: '🇯🇴' },
] as const;

export const DEFAULT_LANGUAGE = LANGUAGES.EN;
