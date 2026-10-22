'use client';

import {
  add,
  type Day,
  differenceInDays,
  differenceInHours,
  differenceInMilliseconds,
  differenceInMinutes,
  differenceInMonths,
  differenceInSeconds,
  differenceInYears,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format as dateFnsFormat,
  formatDistanceToNow as dateFnsFormatDistanceToNow,
  getDay,
  getHours,
  getMilliseconds,
  getMinutes,
  getMonth,
  getSeconds,
  getWeek,
  getYear,
  isAfter,
  isBefore,
  isValid,
  isWithinInterval,
  parse,
  startOfMonth,
  startOfWeek,
  startOfYear,
  sub,
} from 'date-fns';
import { ar, enUS, type Locale } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

import { LANGUAGES } from '@constants';
import { toLatinDigits } from '@utils';

import { DATE_FORMATS, type DateFormat, DateFormats, TIME_FORMATS, type TimeFormat, TimeFormats, UnitOfTime } from './dateFormats';

export type DateInput = string | number | Date | undefined;
type DurationUnits = {
  years: number;
  months: number;
  weeks: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
};

const toNativeDate = (input: DateInput): Date => {
  if (input instanceof Date) return input;

  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [year, month, day] = input.split('-').map(Number);

    return new Date(year, month - 1, day);
  }

  return new Date(input || new Date());
};

export const toLocalDate = (value: string): Date => toNativeDate(value);

export const formatDateValue = (input: DateInput | null, pattern: DateFormat | TimeFormat, fallback = ''): string => {
  if (!input) return fallback;

  const date = toNativeDate(input);

  return isValid(date) ? dateFnsFormat(date, pattern) : fallback;
};

export const iterateDateRange = (start: DateInput, end: DateInput, callback: (date: Date, weekday: number) => void): void => {
  const startDate = toNativeDate(start);
  const endDate = toNativeDate(end);

  if (!isValid(startDate) || !isValid(endDate)) return;

  const current = new Date(startDate);

  while (current <= endDate) {
    callback(new Date(current), current.getDay());
    current.setDate(current.getDate() + 1);
  }
};

/** The date toolkit for one locale: plain functions, built once per locale (see useDate). */
const createDateUtils = (locale: Locale) => {
  // Locale-aware display formatting; toLatinDigits keeps Western (0-9) digits under Arabic.
  const format = (date: Date | number, pattern: string): string => toLatinDigits(dateFnsFormat(date, pattern, { locale }));

  const formatDistanceToNow = (date: Date | number, options?: { addSuffix?: boolean }): string =>
    toLatinDigits(dateFnsFormatDistanceToNow(date, { ...options, locale }));

  const toDate = (input: DateInput = new Date(), inputFormat?: DateFormat | TimeFormat): string => {
    const date = toNativeDate(input);

    return format(date, inputFormat || DATE_FORMATS.ISO_DATE);
  };

  /**
   * Boundary escape hatch — returns a native `Date` for crossing into third-party widget contracts.
   *
   * STRICT USAGE: ONLY for bridging consumer ISO APIs to ui/ widget Date contracts (typically inside
   * shared/ DS-wrapper components like a `<DateField>` that wraps `react-day-picker` or similar).
   *
   * NEVER for: internal date arithmetic, comparisons, formatting, state storage, or general-purpose
   * "I need a Date now" — those go through the regular hook methods (`addDuration`, `isBefore`,
   * `formatDate`, `toDate`, etc.).
   *
   * Reviewers flag every call site as: "is this a third-party widget boundary?" If not, it's misuse.
   */
  const toBoundaryDate = (input: DateInput = new Date()): Date => toNativeDate(input);

  const toDateFromParts = (year: number, month: number, day: number): string => {
    const date = new Date(year, month, day);

    if (!isValid(date)) throw new Error('useDate: Invalid date parts provided');

    return toDate(date);
  };

  const formatDate = (input: DateInput, dateFormat: DateFormat): string => {
    const date = toNativeDate(input);

    if (!isValid(date)) throw new Error('useDate: Invalid date input');

    return format(date, dateFormat);
  };

  const formatHour = (hour: number, formatPattern: TimeFormat): string => {
    const date = new Date(2000, 0, 1, hour, 0);

    return format(date, formatPattern);
  };

  const formatNullableDate = (input: DateInput | null, dateFormat: DateFormat, fallback = '-'): string => {
    if (!input) return fallback;
    const date = toNativeDate(input);
    if (!isValid(date)) return fallback;
    return format(date, dateFormat);
  };

  const toFormat = (value: string, fromPattern: DateFormat | TimeFormat, toPattern: DateFormat | TimeFormat, fallback = '-'): string => {
    if (!value) return fallback;

    const parsed = parse(value, fromPattern, new Date());

    return isValid(parsed) ? format(parsed, toPattern) : fallback;
  };

  const formatNullableTime = (input: string | null | undefined, timeFormat: TimeFormat, fallback = '-'): string => {
    if (!input) return fallback;

    const parsed = parse(input, TIME_FORMATS.HOUR_MINUTES_SECONDS_24, new Date());

    return isValid(parsed) ? format(parsed, timeFormat) : fallback;
  };

  const addDuration = (input: DateInput, amount: number, unit: UnitOfTime): string => {
    const date = toNativeDate(input);
    if (!isValid(date)) throw new Error('useDate: Invalid date input');

    const unitToKey: Record<string, string> = {
      year: 'years',
      month: 'months',
      week: 'weeks',
      day: 'days',
      hours: 'hours',
      minutes: 'minutes',
      seconds: 'seconds',
      milliseconds: 'milliseconds',
    };

    const duration: Record<string, number> = {};
    duration[unitToKey[unit] || unit] = amount;

    return add(date, duration).toISOString();
  };

  const subtractDuration = (input: DateInput, amount: number, unit: UnitOfTime): string => {
    const date = toNativeDate(input);
    if (!isValid(date)) throw new Error('useDate: Invalid date input');

    const unitToKey: Record<string, string> = {
      year: 'years',
      month: 'months',
      week: 'weeks',
      day: 'days',
      hours: 'hours',
      minutes: 'minutes',
      seconds: 'seconds',
      milliseconds: 'milliseconds',
    };

    const duration: Record<string, number> = {};
    duration[unitToKey[unit] || unit] = amount;

    return sub(date, duration).toISOString();
  };

  const getDifference = (start: DateInput, end: DateInput, unit: UnitOfTime = UnitOfTime.DAY): number => {
    const startDate = toNativeDate(start);
    const endDate = toNativeDate(end);

    switch (unit) {
      case 'year':
        return differenceInYears(endDate, startDate);
      case 'month':
        return differenceInMonths(endDate, startDate);
      case 'day':
        return differenceInDays(endDate, startDate);
      case 'hours':
        return differenceInHours(endDate, startDate);
      case 'minutes':
        return differenceInMinutes(endDate, startDate);
      case 'seconds':
        return differenceInSeconds(endDate, startDate);
      case 'milliseconds':
        return differenceInMilliseconds(endDate, startDate);
      default:
        return differenceInDays(endDate, startDate);
    }
  };

  const getUTC = (date: DateInput): string => {
    const d = toNativeDate(date);
    return d.toISOString();
  };

  const getTimeAgo = (date: DateInput): string => {
    const d = toNativeDate(date);
    return formatDistanceToNow(d, { addSuffix: true });
  };

  const toDurationUnits = (value: number, unit: UnitOfTime = UnitOfTime.SECONDS): DurationUnits => {
    // Simple conversion to milliseconds first
    let totalMs = value;
    switch (unit) {
      case 'seconds':
        totalMs = value * 1000;
        break;
      case 'minutes':
        totalMs = value * 60 * 1000;
        break;
      case 'hours':
        totalMs = value * 60 * 60 * 1000;
        break;
      case 'day':
        totalMs = value * 24 * 60 * 60 * 1000;
        break;
      case 'week':
        totalMs = value * 7 * 24 * 60 * 60 * 1000;
        break;
      case 'month':
        totalMs = value * 30 * 24 * 60 * 60 * 1000; // approximate
        break;
      case 'year':
        totalMs = value * 365 * 24 * 60 * 60 * 1000; // approximate
        break;
    }

    const years = Math.floor(totalMs / (365 * 24 * 60 * 60 * 1000));
    const months = Math.floor((totalMs % (365 * 24 * 60 * 60 * 1000)) / (30 * 24 * 60 * 60 * 1000));
    const days = Math.floor((totalMs % (30 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000));
    const weeks = Math.floor(days / 7);
    const hours = Math.floor((totalMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((totalMs % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((totalMs % (60 * 1000)) / 1000);
    const milliseconds = Math.floor(totalMs % 1000);

    return {
      years,
      months,
      weeks,
      days: days % 7,
      hours,
      minutes,
      seconds,
      milliseconds,
    };
  };

  const toDuration = (value: number, unit: UnitOfTime = UnitOfTime.SECONDS): number => {
    const multipliers = {
      [UnitOfTime.MILLISECONDS]: 1,
      [UnitOfTime.SECONDS]: 1000,
      [UnitOfTime.MINUTES]: 60000,
      [UnitOfTime.HOURS]: 3600000,
      [UnitOfTime.DAY]: 86400000,
      [UnitOfTime.WEEK]: 604800000,
      [UnitOfTime.MONTH]: 2629746000,
      [UnitOfTime.YEAR]: 31556952000,
    };

    return value * (multipliers[unit] || 1000);
  };

  const toFormattedDuration = (value: number, timeFormat: TimeFormat, unit: UnitOfTime = UnitOfTime.SECONDS): string => {
    const totalMs = toDuration(value, unit);
    const date = new Date(totalMs);
    return format(date, timeFormat);
  };

  const toDateUnits = (date: DateInput = new Date()): DurationUnits => {
    const d = toNativeDate(date);
    return {
      years: getYear(d),
      months: getMonth(d), // 0-based in date-fns
      weeks: getWeek(d),
      days: getDay(d), // Day of week (0-6)
      hours: getHours(d),
      minutes: getMinutes(d),
      seconds: getSeconds(d),
      milliseconds: getMilliseconds(d),
    };
  };

  const toStartAndEndOf = (date?: DateInput, unitOfTime: UnitOfTime = UnitOfTime.MONTH) => {
    const inputDate = toNativeDate(date);
    let startOf: Date;
    let endOf: Date;

    switch (unitOfTime) {
      case 'week':
        startOf = startOfWeek(inputDate);
        endOf = endOfWeek(inputDate);
        break;
      case 'month':
        startOf = startOfMonth(inputDate);
        endOf = endOfMonth(inputDate);
        break;
      case 'year':
        startOf = startOfYear(inputDate);
        endOf = endOfYear(inputDate);
        break;
      default:
        startOf = startOfMonth(inputDate);
        endOf = endOfMonth(inputDate);
    }

    return {
      startOf: format(startOf, DATE_FORMATS.ISO_DATE),
      endOf: format(endOf, DATE_FORMATS.ISO_DATE),
    } as const;
  };

  const getMonthGrid = (year: number, month: number, weekStartsOn: Day = 0): string[] => {
    const firstOfMonth = new Date(year, month, 1);
    if (!isValid(firstOfMonth)) throw new Error('useDate: Invalid year/month for getMonthGrid');
    const start = startOfWeek(startOfMonth(firstOfMonth), { weekStartsOn });
    const end = endOfWeek(endOfMonth(firstOfMonth), { weekStartsOn });
    return eachDayOfInterval({ start, end }).map((d) => format(d, DATE_FORMATS.ISO_DATE));
  };

  const isBeforeDate = (date: DateInput, comparison: DateInput): boolean => {
    const d1 = toNativeDate(date);
    const d2 = toNativeDate(comparison);
    return isBefore(d1, d2);
  };

  const isAfterDate = (date: DateInput, comparison: DateInput): boolean => {
    const d1 = toNativeDate(date);
    const d2 = toNativeDate(comparison);
    return isAfter(d1, d2);
  };

  const isBetween = (input: DateInput, start: DateInput, end: DateInput): boolean => {
    const inputDate = toNativeDate(input);
    const startDate = toNativeDate(start);
    const endDate = toNativeDate(end);
    return isWithinInterval(inputDate, { start: startDate, end: endDate });
  };

  const isValidDate = (input: DateInput | null): boolean => {
    if (!input) return false;
    const date = toNativeDate(input);
    return isValid(date);
  };

  const parseDate = (dateString: string, dateFormat: DateFormat): Date | undefined => {
    if (!dateString) return undefined;

    const normalizedString = dateString.replace(/[-/]/g, '/');
    const normalizedFormat = dateFormat.replace(/[-/]/g, '/');

    const parsed = parse(normalizedString, normalizedFormat, new Date());

    if (isValid(parsed)) {
      const year = parsed.getFullYear();
      if (year >= 1900 && year <= 2100) {
        return parsed;
      }
    }

    return undefined;
  };

  const getDateRangeArray = (start: DateInput, end: DateInput, dateFormat: DateFormat = DATE_FORMATS.ISO_DATE): string[] => {
    const startDate = toNativeDate(start);
    const endDate = toNativeDate(end);

    if (!isValid(startDate)) throw new Error('Invalid start date');
    if (!isValid(endDate)) throw new Error('Invalid end date');
    if (isAfter(startDate, endDate)) throw new Error('Start date must be before or equal to end date');

    const dateArray = eachDayOfInterval({ start: startDate, end: endDate });
    return dateArray.map((date) => format(date, dateFormat));
  };

  const yearRanges = (currentYear: number, range = 10): number[] => {
    const years: number[] = [];
    for (let y = currentYear - range; y <= currentYear + range; y++) years.push(y);
    return years;
  };

  return {
    toDate,
    toBoundaryDate,
    toDateFromParts,
    formatDate,
    formatHour,
    formatNullableDate,
    formatNullableTime,
    toFormat,
    parseDate,
    addDuration,
    subtractDuration,
    getDifference,
    getUTC,
    toDurationUnits,
    toDuration,
    toFormattedDuration,
    toDateUnits,
    toStartAndEndOf,
    getMonthGrid,
    isBefore: isBeforeDate,
    isAfter: isAfterDate,
    isBetween,
    getTimeAgo,
    isValid: isValidDate,
    getDateRangeArray,
    yearRanges,
    constants: {
      DateFormats,
      TimeFormats,
      UnitOfTime,
    },
  };
};

export type DateUtils = ReturnType<typeof createDateUtils>;

const toolkits = new Map<Locale, DateUtils>();

/**
 * Locale-aware date helpers. The same object for every render in a language (built once per locale), so components
 * and hooks can depend on it without re-running memos and effects; a new one when the language changes.
 */
export const useDate = (): DateUtils => {
  const { i18n } = useTranslation();
  const locale = i18n.language === LANGUAGES.AR ? ar : enUS;
  let toolkit = toolkits.get(locale);
  if (!toolkit) {
    toolkit = createDateUtils(locale);
    toolkits.set(locale, toolkit);
  }
  return toolkit;
};
