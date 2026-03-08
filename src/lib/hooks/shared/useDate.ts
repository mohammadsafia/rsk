import {
  add,
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
  format,
  formatDistanceToNow,
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

export const DATE_FORMATS = {
  // Example: "2024/12/22"
  YEAR_MONTH_DAY: 'yyyy/MM/dd',
  // Example: "Dec 22, 2024"
  SHORT_MONTH_DAY_YEAR: 'MMM dd, yyyy',
  // Example: "December 22, 2024"
  FULL_MONTH_DAY_YEAR: 'MMMM d, yyyy',
  // Example: "2024-12-22" (ISO 8601 date format)
  ISO_DATE: 'yyyy-MM-dd',
  // Example: "2024-12-22T12:00:00.000Z" (ISO 8601 datetime format)
  ISO_DATETIME: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  // Example: "12/22/2024"
  US_DATE: 'MM/dd/yyyy',
  // Example: "22/12/2024"
  EU_DATE: 'dd/MM/yyyy',
  // Example: "December 2024"
  FULL_MONTH_YEAR: 'MMMM yyyy',
  // Example: "Dec 2024"
  SHORT_MONTH_YEAR: 'MMM yyyy',
  // Example: "2024"
  YEAR: 'yyyy',
  // Example: "Dec 22, 2024 12:00 PM"
  SHORT_MONTH_DAY_YEAR_TIME: 'MMM dd, yyyy h:mm a',
  // Example: "Sunday, Dec 22 12:00 PM"
  DAY_MONTH_DATE_TIME: 'EEEE, MMM dd h:mm a',
  // Example: "Sunday, December 22, 2024"
  FULL_WEEKDAY_SHORT_MONTH_DAY_YEAR: 'EEEE, MMMM d, yyyy',
  // Example: "Sunday, Dec 22"
  FULL_DAY_MONTH_DATE: 'EEEE, MMM dd',
  // Example: "Sunday, Dec 22, 2024 12:00 PM"
  FULL_DAY_MONTH_DATE_YEAR_TIME: 'EEEE, MMM dd, yyyy h:mm a',
  // Example: "Sunday" (Full day name)
  FULL_DAY: 'EEEE',
  // Example: "Sun" (Short day name)
  SHORT_DAY: 'EEE',
  // Example: "22" (Day of the month)
  DAY_OF_MONTH: 'd',
  // Example: "December" (Full month name)
  FULL_MONTH: 'MMMM',
  // Example: "Dec" (Short month name)
  SHORT_MONTH: 'MMM',
  // Example: "Sunday, 22nd of December"
  DAY_SHORT_MONTH: 'EEE, MMM d',
} as const;

export const TIME_FORMATS = {
  // Example: "12:00 PM" (12-hour format with AM/PM)
  HOUR_MINUTES_12: 'h:mm a',
  // Example: "12:00:30 PM" (12-hour format with seconds and AM/PM)
  HOUR_MINUTES_SECONDS_12: 'h:mm:ss a',
  // Example: "12:00" (24-hour format)
  HOUR_MINUTES_24: 'HH:mm',
  // Example: "12:00:30" (24-hour format with seconds)
  HOUR_MINUTES_SECONDS_24: 'HH:mm:ss',
  // Example: "30:45" (Minutes and seconds)
  MINUTES_SECONDS: 'mm:ss',
} as const;

const UNIT_OF_TIME = {
  YEAR: 'year',
  MONTH: 'month',
  WEEK: 'week',
  DAY: 'day',
  HOURS: 'hours',
  MINUTES: 'minutes',
  SECONDS: 'seconds',
  MILLISECONDS: 'milliseconds',
} as const;

export type DateInput = string | number | Date | undefined;
export type DateFormat = (typeof DATE_FORMATS)[keyof typeof DATE_FORMATS];
export type TimeFormat = (typeof TIME_FORMATS)[keyof typeof TIME_FORMATS];
export type UnitOfTime = (typeof UNIT_OF_TIME)[keyof typeof UNIT_OF_TIME];

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
  return new Date(input || new Date());
};

export const useDate = () => {
  const toDate = (input: DateInput = new Date(), inputFormat?: DateFormat | TimeFormat): string => {
    const date = toNativeDate(input);
    return format(date, inputFormat || DATE_FORMATS.ISO_DATE);
  };

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

  const formatNullableDate = (input: DateInput | null, dateFormat: DateFormat, fallback = '-'): string => {
    if (!input) return fallback;
    const date = toNativeDate(input);
    if (!isValid(date)) return fallback;
    return format(date, dateFormat);
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

  const getDifference = (start: DateInput, end: DateInput, unit: UnitOfTime = UNIT_OF_TIME.DAY): number => {
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

  const toDurationUnits = (value: number, unit: UnitOfTime = UNIT_OF_TIME.SECONDS): DurationUnits => {
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

  const toDuration = (value: number, unit: UnitOfTime = UNIT_OF_TIME.SECONDS): number => {
    const multipliers = {
      [UNIT_OF_TIME.MILLISECONDS]: 1,
      [UNIT_OF_TIME.SECONDS]: 1000,
      [UNIT_OF_TIME.MINUTES]: 60000,
      [UNIT_OF_TIME.HOURS]: 3600000,
      [UNIT_OF_TIME.DAY]: 86400000,
      [UNIT_OF_TIME.WEEK]: 604800000,
      [UNIT_OF_TIME.MONTH]: 2629746000,
      [UNIT_OF_TIME.YEAR]: 31556952000,
    };

    return value * (multipliers[unit] || 1000);
  };

  const toFormattedDuration = (value: number, timeFormat: TimeFormat, unit: UnitOfTime = UNIT_OF_TIME.SECONDS): string => {
    const totalMs = toDuration(value, unit);
    const date = new Date(totalMs);
    return format(date, timeFormat);
  };

  const toDateUnits = (date: DateInput): DurationUnits => {
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

  const toStartAndEndOf = (date?: DateInput, unitOfTime: UnitOfTime = UNIT_OF_TIME.MONTH) => {
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

  return {
    toDate,
    toDateFromParts,
    formatDate,
    formatNullableDate,
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
    isBefore: isBeforeDate,
    isAfter: isAfterDate,
    isBetween,
    getTimeAgo,
    isValid: isValidDate,
    getDateRangeArray,
    constants: {
      DateFormats: DATE_FORMATS,
      TimeFormats: TIME_FORMATS,
      UnitOfTime: UNIT_OF_TIME,
    },
  };
};
