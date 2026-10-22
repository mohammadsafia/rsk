export const DATE_INPUT_FORMATS = {
  US_SLASH: 'MM/dd/yyyy',
  US_DASH: 'MM-dd-yyyy',
  EU_SLASH: 'dd/MM/yyyy',
  EU_DASH: 'dd-MM-yyyy',
} as const;

export type DateInputFormat = (typeof DATE_INPUT_FORMATS)[keyof typeof DATE_INPUT_FORMATS];
