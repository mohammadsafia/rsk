// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

import type { Member } from '@api/handlers/members';
import type { PaginatedResult } from '@app-types';

import { createMockMembers } from './members';

type Page = PaginatedResult<Member>;

const list = (api: ReturnType<typeof createMockMembers>, search = '') => api({ method: 'GET', path: '/members', search }).body as Page;

describe('the mock members backend', () => {
  it('pages through 23 members sorted by name, 10 a page by default', () => {
    const api = createMockMembers();
    const first = list(api);
    expect(first.pagination).toEqual({ page: 1, pageSize: 10, total: 23, totalPage: 3 });
    expect(first.data).toHaveLength(10);
    const names = first.data.map((member) => member.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    expect(list(api, '?page=3&pageSize=10').data).toHaveLength(3);
  });

  it('searches names and emails without regard to case, and sorts either way', () => {
    const api = createMockMembers();
    const found = list(api, '?search=LAYLA');
    expect(found.data.length).toBeGreaterThan(0);
    for (const member of found.data) expect(`${member.name} ${member.email}`.toLowerCase()).toContain('layla');
    const desc = list(api, '?sort=name%3Adesc').data.map((member) => member.name);
    expect(desc).toEqual([...desc].sort((a, b) => b.localeCompare(a)));
  });

  it('adds a member, and answers 409 for an email already there', () => {
    const api = createMockMembers();
    const added = api({ method: 'POST', path: '/members', body: { name: 'Rana Aziz', email: 'rana@example.com', role: 'member' } });
    expect(added.status).toBe(201);
    expect(added.body).toMatchObject({ name: 'Rana Aziz', email: 'rana@example.com', role: 'member' });
    expect(list(api).pagination.total).toBe(24);
    expect(api({ method: 'POST', path: '/members', body: { name: 'X', email: 'RANA@example.com', role: 'member' } }).status).toBe(409);
  });

  it('answers 404 for anything else', () => {
    expect(createMockMembers()({ method: 'GET', path: '/invoices' }).status).toBe(404);
  });
});

describe('the seeded members', () => {
  it('have different names and emails', () => {
    const { data } = createMockMembers()({ method: 'GET', path: '/members', search: '?pageSize=100' }).body as Page;
    expect(new Set(data.map((member) => member.name)).size).toBe(23);
    expect(new Set(data.map((member) => member.email)).size).toBe(23);
  });
});
