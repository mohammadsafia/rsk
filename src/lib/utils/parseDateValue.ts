const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * A form's date value (a Date, or a string) as a Date, or undefined when it is empty or not a real date. A date-only
 * string ("2026-10-18") is that calendar day at local midnight: `new Date()` would read it as UTC midnight, which west
 * of UTC is the evening before.
 */
export function parseDateValue(value: unknown): Date | undefined {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value;
  if (typeof value !== 'string' || !value) return undefined;
  const dateOnly = value.match(DATE_ONLY);
  if (dateOnly) {
    const [year, month, day] = dateOnly.slice(1).map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : undefined;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}
