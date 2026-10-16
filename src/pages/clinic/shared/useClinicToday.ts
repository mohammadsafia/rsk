import { clinicStore } from '@api/clinic';

import { useDate } from '@hooks/shared';

/**
 * Today's day key (yyyy-MM-dd, local) and the current time, from the clinic backend's clock.
 * In the app that is the real time; tests pin it so pages and seeded data agree on "today".
 */
export const useClinicToday = () => {
  const { toDate } = useDate();
  const now = clinicStore.now();
  return { todayKey: toDate(now), now };
};
