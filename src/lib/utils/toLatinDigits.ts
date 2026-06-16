// Normalizes Arabic-Indic (٠-٩) and extended/Persian (۰-۹) digits to Latin (0-9).
// Idempotent for Latin input. Used to keep Western digits even under Arabic locale formatting.
const ARABIC_INDIC_OFFSET = 0x0660; // ٠
const EXTENDED_ARABIC_INDIC_OFFSET = 0x06f0; // ۰

export const toLatinDigits = (value: string): string => {
  if (!value) return value;

  return value.replace(/[٠-٩۰-۹]/g, (digit) => {
    const code = digit.charCodeAt(0);
    const base = code >= EXTENDED_ARABIC_INDIC_OFFSET ? EXTENDED_ARABIC_INDIC_OFFSET : ARABIC_INDIC_OFFSET;

    return String(code - base);
  });
};
