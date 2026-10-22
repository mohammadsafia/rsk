// Date formats — string-valued enum so raw literals fail compile.
// Member values are date-fns format tokens; comments above each show example output.
export enum DateFormats {
  // Example: "2024/12/22"
  YEAR_MONTH_DAY = 'yyyy/MM/dd',
  // Example: "Dec 22, 2024"
  SHORT_MONTH_DAY_YEAR = 'MMM dd, yyyy',
  // Example: "December 22, 2024"
  FULL_MONTH_DAY_YEAR = 'MMMM d, yyyy',
  // Example: "2024-12-22" (ISO 8601 date format)
  ISO_DATE = 'yyyy-MM-dd',
  // Example: "2024-12-22T12:00:00.000Z" (ISO 8601 datetime format)
  ISO_DATETIME = "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  // Example: "12/22/2024"
  US_DATE = 'MM/dd/yyyy',
  // Example: "22/12/2024"
  EU_DATE = 'dd/MM/yyyy',
  // Example: "December 2024"
  FULL_MONTH_YEAR = 'MMMM yyyy',
  // Example: "Dec 2024"
  SHORT_MONTH_YEAR = 'MMM yyyy',
  // Example: "2024"
  YEAR = 'yyyy',
  // Example: "Dec 22, 2024 12:00 PM"
  SHORT_MONTH_DAY_YEAR_TIME = 'MMM dd, yyyy h:mm a',
  // Example: "Sunday, Dec 22 12:00 PM"
  DAY_MONTH_DATE_TIME = 'EEEE, MMM dd h:mm a',
  // Example: "Sunday, December 22, 2024"
  FULL_WEEKDAY_SHORT_MONTH_DAY_YEAR = 'EEEE, MMMM d, yyyy',
  // Example: "Sunday, Dec 22"
  FULL_DAY_MONTH_DATE = 'EEEE, MMM dd',
  // Example: "Sunday, Dec 22, 2024 12:00 PM"
  FULL_DAY_MONTH_DATE_YEAR_TIME = 'EEEE, MMM dd, yyyy h:mm a',
  // Example: "Sunday" (Full day name)
  FULL_DAY = 'EEEE',
  // Example: "Sun" (Short day name)
  SHORT_DAY = 'EEE',
  // Example: "22" (Day of the month)
  DAY_OF_MONTH = 'd',
  // Example: "05" (Day of the month, zero-padded)
  DAY_OF_MONTH_PADDED = 'dd',
  // Example: "December" (Full month name)
  FULL_MONTH = 'MMMM',
  // Example: "Dec" (Short month name)
  SHORT_MONTH = 'MMM',
  // Example: "Sunday, 22nd of December"
  DAY_SHORT_MONTH = 'EEE, MMM d',
}

export enum TimeFormats {
  // Example: "12:00 PM" (12-hour format with AM/PM)
  HOUR_MINUTES_12 = 'h:mm a',
  // Example: "9 AM" (hour only, 12-hour format)
  HOUR_12 = 'h a',
  // Example: "12:00:30 PM" (12-hour format with seconds and AM/PM)
  HOUR_MINUTES_SECONDS_12 = 'h:mm:ss a',
  // Example: "12:00" (24-hour format)
  HOUR_MINUTES_24 = 'HH:mm',
  // Example: "12:00:30" (24-hour format with seconds)
  HOUR_MINUTES_SECONDS_24 = 'HH:mm:ss',
  // Example: "30:45" (Minutes and seconds)
  MINUTES_SECONDS = 'mm:ss',
}

export enum UnitOfTime {
  YEAR = 'year',
  MONTH = 'month',
  WEEK = 'week',
  DAY = 'day',
  HOURS = 'hours',
  MINUTES = 'minutes',
  SECONDS = 'seconds',
  MILLISECONDS = 'milliseconds',
}

// Backward-compat value aliases — existing imports of `DATE_FORMATS` / `TIME_FORMATS` continue to work.
// Member access (`DATE_FORMATS.ISO_DATE`) returns the enum member; type-enforcement still applies at call sites.
export const DATE_FORMATS = DateFormats;

export const TIME_FORMATS = TimeFormats;

// Backward-compat type aliases — existing imports of `DateFormat` / `TimeFormat` continue to work.
export type DateFormat = DateFormats;

export type TimeFormat = TimeFormats;
