// @vitest-environment happy-dom
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { clinicStore } from '@api/clinic';
import { Toaster } from '@components/shared';

import i18n from '../../../i18n';
import { renderClinic, resetClinic } from '../test-utils';
import SchedulePage from './SchedulePage';

beforeEach(() => {
  resetClinic();
  // Columns 200px wide from x=100, 1100px tall (07:00–18:00 = 0.6 min/px), scroller 0..1100.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const index = Number(this.dataset.columnIndex ?? -1);
    if (this.dataset.calendarColumn !== undefined) return DOMRect.fromRect({ x: 100 + index * 200, y: 0, width: 200, height: 1100 });
    if (this.dataset.slot === 'calendar-grid-body') return DOMRect.fromRect({ x: 0, y: 0, width: 1600, height: 1100 });
    return DOMRect.fromRect({ x: 0, y: 0, width: 0, height: 0 });
  });
});
afterEach(async () => {
  cleanup();
  vi.restoreAllMocks();
  clinicStore.setClock(null);
  await act(() => i18n.changeLanguage('en'));
});

const renderPage = (route = '/schedule') =>
  renderClinic(
    <>
      <SchedulePage />
      <Toaster />
    </>,
    { route, path: '/schedule' },
  );
const at = (column: number, minute: number) => ({ clientX: 150 + column * 200, clientY: (minute - 7 * 60) / 0.6 });

/** A free 15-minute afternoon cell for the first doctor on Saturday 17 Oct (computed, never hard-coded). */
/** Waits until a visit card is on the grid (waitFor only retries on a throw). */
const findCard = (id: string) =>
  waitFor(() => {
    const card = document.querySelector(`[data-event-id="${id}"]`) as HTMLElement | null;
    expect(card).not.toBeNull();
    return card!;
  });

const freeMinute = () => {
  const { visits, doctors } = clinicStore.read();
  const doctor = doctors[0].id;
  const busy = visits.filter((v) => v.doctorId === doctor && v.start.startsWith('2026-10-17') && v.status !== 'cancelled');
  const minute = (iso: string) => new Date(iso).getHours() * 60 + new Date(iso).getMinutes();
  for (let m = 13 * 60; m < 17 * 60; m += 15) if (!busy.some((v) => m < minute(v.end) && m + 15 > minute(v.start))) return m;
  throw new Error('no free afternoon cell');
};

describe('SchedulePage', () => {
  it("shows today's visits in one column per doctor", async () => {
    renderPage();
    const { visits, doctors } = clinicStore.read();
    const today = visits.find((v) => v.start.startsWith('2026-10-16') && v.status !== 'cancelled')!;
    const patient = clinicStore.read().patients.find((p) => p.id === today.patientId)!;
    await waitFor(() => expect(document.querySelectorAll('[data-calendar-column]')).toHaveLength(doctors.length));
    const column = document.querySelector(`[data-calendar-column][data-resource="${today.doctorId}"]`) as HTMLElement;
    expect(await within(column).findByText(patient.name.en)).toBeTruthy();
  });

  it('follows ?view=agenda', async () => {
    renderPage('/schedule?view=agenda');
    expect(await screen.findByRole('tab', { name: 'Agenda', selected: true })).toBeTruthy();
  });

  it('books a visit from a free slot', async () => {
    renderPage('/schedule?date=2026-10-17');
    await waitFor(() => expect(document.querySelectorAll('[data-calendar-column]').length).toBeGreaterThan(0));
    const column = document.querySelector('[data-calendar-column]') as HTMLElement;
    const free = freeMinute();
    fireEvent.pointerDown(column, { button: 0, pointerId: 1, ...at(0, free) });
    fireEvent.pointerUp(window, { pointerId: 1, ...at(0, free) });
    const sheet = await screen.findByRole('dialog', { name: 'New visit' });
    const patient = clinicStore.read().patients[0];
    fireEvent.click(within(sheet).getByRole('combobox', { name: /Patient/ }));
    fireEvent.click(await screen.findByRole('option', { name: patient.name.en }));
    fireEvent.click(within(sheet).getByRole('button', { name: 'Book visit' }));
    expect(await screen.findByText('Visit booked')).toBeTruthy();
    const hh = String(Math.floor(free / 60)).padStart(2, '0');
    const mm = String(free % 60).padStart(2, '0');
    expect(clinicStore.read().visits.some((v) => v.patientId === patient.id && v.start.startsWith(`2026-10-17T${hh}:${mm}`))).toBe(true);
  });

  it('preselects the patient from ?patient=, and ignores an unknown one', async () => {
    const patient = clinicStore.read().patients[3];
    renderPage(`/schedule?date=2026-10-17&patient=${patient.id}`);
    await waitFor(() => expect(document.querySelectorAll('[data-calendar-column]').length).toBeGreaterThan(0));
    const column = document.querySelector('[data-calendar-column]') as HTMLElement;
    fireEvent.pointerDown(column, { button: 0, pointerId: 1, ...at(0, freeMinute()) });
    fireEvent.pointerUp(window, { pointerId: 1, ...at(0, freeMinute()) });
    const sheet = await screen.findByRole('dialog', { name: 'New visit' });
    expect(within(sheet).getByText(patient.name.en)).toBeTruthy();
    cleanup();
    renderPage('/schedule?date=2026-10-17&patient=nope');
    await waitFor(() => expect(document.querySelectorAll('[data-calendar-column]').length).toBeGreaterThan(0));
    fireEvent.pointerDown(document.querySelector('[data-calendar-column]')!, { button: 0, pointerId: 1, ...at(0, freeMinute()) });
    fireEvent.pointerUp(window, { pointerId: 1, ...at(0, freeMinute()) });
    expect(await screen.findByRole('dialog', { name: 'New visit' })).toBeTruthy();
  });

  it('reverts a move that double-books and keeps the visit where it was', async () => {
    renderPage('/schedule?date=2026-10-17');
    const { visits } = clinicStore.read();
    const sameDoctor = visits.filter((v) => v.start.startsWith('2026-10-17') && v.status === 'scheduled');
    const moving = sameDoctor[0];
    const blocker = sameDoctor.find((v) => v.doctorId === moving.doctorId && v.id !== moving.id);
    // The seed books 2–4 visits per doctor per day near today, so a same-doctor blocker exists.
    expect(blocker).toBeTruthy();
    if (!blocker) return;
    const card = await findCard(moving.id);
    const minute = (iso: string) => new Date(iso).getHours() * 60 + new Date(iso).getMinutes();
    const columnIndex = Number(card.closest('[data-calendar-column]')!.getAttribute('data-column-index'));
    fireEvent.pointerDown(card, { button: 0, pointerId: 1, ...at(columnIndex, minute(moving.start) + 1) });
    fireEvent.pointerMove(window, { pointerId: 1, ...at(columnIndex, minute(blocker.start) + 1) });
    fireEvent.pointerUp(window, { pointerId: 1, ...at(columnIndex, minute(blocker.start) + 1) });
    expect(await screen.findByText("Couldn't save the change")).toBeTruthy();
    expect(clinicStore.read().visits.find((v) => v.id === moving.id)!.start).toBe(moving.start);
  });

  it('marks a visit arrived from its popover', async () => {
    renderPage();
    const visit = clinicStore.read().visits.find((v) => v.start.startsWith('2026-10-16') && v.status === 'scheduled')!;
    const card = await findCard(visit.id);
    fireEvent.click(card);
    fireEvent.click(await screen.findByRole('button', { name: 'Mark arrived' }));
    await waitFor(() => expect(clinicStore.read().visits.find((v) => v.id === visit.id)!.status).toBe('arrived'));
  });

  it('shows an error with Retry, and recovers', async () => {
    clinicStore.failNext('listVisits');
    renderPage();
    fireEvent.click(within(await screen.findByRole('alert')).getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });
});
