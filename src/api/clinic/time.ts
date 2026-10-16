import { format } from 'date-fns';

export const dayKey = (date: Date) => format(date, 'yyyy-MM-dd');

const fromKey = (key: string, minutes = 0) => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 0, minutes);
};

/** Local wall time as an offset ISO string, built from wall-clock parts (DST-safe). */
export const wallTime = (key: string, minutes: number) => format(fromKey(key, minutes), "yyyy-MM-dd'T'HH:mm:ssxxx");
export const shiftDay = (key: string, days: number) => {
  const date = fromKey(key);
  return dayKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days));
};
export const isFriday = (key: string) => fromKey(key).getDay() === 5;
