// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import { clinicStore, STORAGE_KEY } from './store';

const NOW = new Date(2026, 9, 16, 9, 0);

beforeEach(() => {
  sessionStorage.clear();
  clinicStore.setClock(() => NOW);
  clinicStore.reset();
});

afterEach(() => clinicStore.setClock(null));

describe('clinicStore persistence', () => {
  it('persists writes to sessionStorage and reads them back after a reload', () => {
    clinicStore.write((data) => {
      data.patients[0].phone = '+962 79 999 0000';
    });
    clinicStore.reload();
    expect(clinicStore.read().patients[0].phone).toBe('+962 79 999 0000');
  });

  it.each([['{not json'], [JSON.stringify({ version: 0 })], [JSON.stringify({ version: 1, seededOn: '2026-10-16' })]])(
    'reseeds instead of crashing on stored data %s',
    (raw) => {
      sessionStorage.setItem(STORAGE_KEY, raw);
      clinicStore.reload();
      expect(clinicStore.read().patients).toHaveLength(60);
    },
  );

  it('reseeds when the stored data was seeded on another day', () => {
    clinicStore.write((data) => {
      data.patients[0].phone = '+962 79 999 0000';
    });
    clinicStore.setClock(() => new Date(2026, 9, 17, 9, 0));
    clinicStore.reload();
    expect(clinicStore.read().seededOn).toBe('2026-10-17');
    expect(clinicStore.read().patients[0].phone).not.toBe('+962 79 999 0000');
  });

  it('fails an operation once when asked to', () => {
    clinicStore.failNext('listPatients');
    expect(clinicStore.takeFailure('listPatients')).toBe(true);
    expect(clinicStore.takeFailure('listPatients')).toBe(false);
  });
});
