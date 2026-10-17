import type { PaginatedDataTable } from '@app-types';

export type Doctor = { id: string; name: string };

const FIRST = ['Layla', 'Omar', 'Sara', 'Yousef', 'Noor', 'Khaled', 'Rana', 'Fadi', 'Huda'];
const LAST = ['Haddad', 'Khalil', 'Nasser', 'Saleh', 'Odeh'];

/** 45 doctors: enough for three pages of 20, so infinite scroll shows in the docs. */
export const DOCTORS: Doctor[] = LAST.flatMap((last, l) =>
  FIRST.map((first, f) => ({ id: `dr-${l * FIRST.length + f + 1}`, name: `Dr. ${first} ${last}` })),
);

/**
 * Stand-in for a lookup endpoint in the docs, which have no backend. Reads the params the async
 * combobox hook sends (pageNumber, pageSize, searchTerm) and answers like the API would.
 */
export async function fetchDoctors(query: string, latencyMs = 300): Promise<PaginatedDataTable<Doctor>> {
  const params = new URLSearchParams(query);
  const page = Number(params.get('pageNumber') ?? 1);
  const pageSize = Number(params.get('pageSize') ?? 20);
  const search = (params.get('searchTerm') ?? '').toLowerCase();

  if (latencyMs > 0) await new Promise((resolve) => setTimeout(resolve, latencyMs));

  const matches = search ? DOCTORS.filter((doctor) => doctor.name.toLowerCase().includes(search)) : DOCTORS;
  return {
    data: matches.slice((page - 1) * pageSize, page * pageSize),
    pagination: { page, pageSize, total: matches.length, totalPages: Math.ceil(matches.length / pageSize) },
  };
}
