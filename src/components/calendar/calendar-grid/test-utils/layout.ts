import { vi } from 'vite-plus/test';

/**
 * happy-dom has no layout. Columns are 200px wide side by side from x=100 and 800px tall from y=0;
 * with startHour 8 and endHour 16 that is 0.6 minutes per pixel. The scroller spans the same 800px.
 */
export const stubLayout = () =>
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const index = Number(this.dataset.columnIndex ?? -1);
    if (this.dataset.calendarColumn !== undefined) return DOMRect.fromRect({ x: 100 + index * 200, y: 0, width: 200, height: 800 });
    if (this.dataset.slot === 'calendar-grid-body') return DOMRect.fromRect({ x: 0, y: 0, width: 1600, height: 800 });
    return DOMRect.fromRect({ x: 0, y: 0, width: 0, height: 0 });
  });

/** Pointer coordinates for a minute of the day in column `index` (startHour 8, endHour 16). */
export const at = (index: number, minute: number) => ({ clientX: 150 + index * 200, clientY: (minute - 480) / 0.6 });
