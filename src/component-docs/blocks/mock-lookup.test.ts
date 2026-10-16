import { describe, expect, it } from 'vite-plus/test';

import { DOCTORS, fetchDoctors } from './mock-lookup';

const query = (params: Record<string, string>) => new URLSearchParams(params).toString();

describe('fetchDoctors (docs mock for async comboboxes)', () => {
  it('pages through the list with the pageNumber / pageSize params the async hook sends', async () => {
    const first = await fetchDoctors(query({ pageNumber: '1', pageSize: '20' }), 0);
    const second = await fetchDoctors(query({ pageNumber: '2', pageSize: '20' }), 0);

    expect(first.data).toHaveLength(20);
    expect(second.data[0]).toEqual(DOCTORS[20]);
    expect(first.pagination).toEqual({ page: 1, pageSize: 20, total: DOCTORS.length, totalPages: Math.ceil(DOCTORS.length / 20) });
  });

  it('filters by searchTerm, ignoring case', async () => {
    const result = await fetchDoctors(query({ pageNumber: '1', pageSize: '20', searchTerm: 'haddad' }), 0);

    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data.every((doctor) => doctor.name.toLowerCase().includes('haddad'))).toBe(true);
    expect(result.pagination.total).toBe(result.data.length);
  });

  it('has enough doctors for more than two pages, so infinite scroll is visible', () => {
    expect(DOCTORS.length).toBeGreaterThan(40);
    expect(new Set(DOCTORS.map((doctor) => doctor.id)).size).toBe(DOCTORS.length);
  });
});
