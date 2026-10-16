import { clinicService } from '../service';

export type MetricsRange = 7 | 30 | 90;

export const MetricsHandler = {
  list: { queryKey: 'clinic/metrics/list', request: (days: MetricsRange) => clinicService.listMetrics(days) },
} as const;
