export const useTime = () => {
  const padN = (n: number) => n.toString().padStart(2, '0');

  const parseTimeString = (val: string): [number, number, string] => {
    // eslint-disable-next-line prefer-const
    let [h, m, am] = val.split(/\W/g);
    if (h === '12' && am !== undefined) h = '0';
    return [parseInt(h) + (am?.toLowerCase() === 'pm' ? 12 : 0), parseInt(m), am];
  };

  const minsToTimeString = (mins: number, ampm: boolean = true) => {
    const [h, m] = [Math.floor(mins / 60), mins % 60];
    if (ampm) return `${padN(h === 12 ? 12 : h % 12)}:${padN(m)} ${h >= 12 ? 'PM' : 'AM'}`;
    return `${padN(h)}:${padN(m)}`;
  };

  const timeStringToMins = (timeStr: string) => {
    const [h, m] = parseTimeString(timeStr);
    return h * 60 + m;
  };

  const nullableTimeStringToMins = (timeStr: string | null | undefined, fallback = 0) => {
    if (!timeStr) return fallback;
    const [h, m] = parseTimeString(timeStr);
    return h * 60 + m;
  };

  const dateToTimeString = (date: Date, ampm: boolean = true) => {
    const h = date.getHours();
    const m = date.getMinutes();
    return minsToTimeString(h * 60 + m, ampm);
  };

  const addMinutesToTimeString = (timeString: string, minutes: number) => {
    const [h, m] = parseTimeString(timeString);
    return minsToTimeString(h * 60 + m + minutes);
  };

  const getTimeOptions = (start: string, end: string, step: number, ampm: boolean = true): string[] => {
    const [startH, startM] = parseTimeString(start);
    const [endH, endM] = parseTimeString(end);
    const options: string[] = [];
    if (startH * 60 + startM >= endH * 60 + endM) return options;
    for (let mins = startH * 60 + startM; mins < endH * 60 + endM; mins += step) {
      options.push(minsToTimeString(mins, ampm));
    }
    return options;
  };

  const getNextTimeSlot = (timeString: string, step: number) => {
    let [h, m] = parseTimeString(timeString);
    m = m + step;
    if (m > 60) {
      m -= 60;
      h++;
    }
    if (h > 23) h -= 24;
    return `${padN(h)}:${padN(m)}`;
  };

  return {
    parseTimeString,
    minsToTimeString,
    addMinutesToTimeString,
    getTimeOptions,
    getNextTimeSlot,
    dateToTimeString,
    timeStringToMins,
    nullableTimeStringToMins,
  };
};
