import { useEffect, useState } from 'react';

import { clinicStore } from '@api/clinic';

import { useDate } from '@hooks/shared';

/**
 * Today's day key (yyyy-MM-dd, local) and the current time, from the clinic backend's clock.
 * `now` is one stable value per minute (not a new Date each render), so it can sit in memo and callback deps,
 * and time-based rules such as "past visits are locked" refresh while the page stays open.
 */
export const useClinicToday = () => {
  const { toDate } = useDate();
  const [now, setNow] = useState(() => clinicStore.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(clinicStore.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  return { todayKey: toDate(now), now };
};
