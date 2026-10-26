// A stand-in members backend for the examples, answering what the API would while AUTH_MOCK is on. It lives in this
// server process's memory: a restart (or another serverless instance) starts again from the 23 seeded members.
import type { Member, MemberRole } from '@api/handlers/members';

export type ApiRequest = { method: string; path: string; search?: string; body?: unknown };
export type ApiResponse = { status: number; body: unknown };

const FIRST = ['Layla', 'Omar', 'Sara', 'Yousef', 'Noor', 'Khaled', 'Hala', 'Sami', 'Dina', 'Tariq', 'Rania', 'Fadi'];
const LAST = ['Haddad', 'Khalil', 'Odeh', 'Nasser', 'Saleh', 'Mansour'];

/** 23 members with different names, the same on every start. */
const seed = (): Member[] =>
  Array.from({ length: 23 }, (_, index) => {
    const name = `${FIRST[index % FIRST.length]} ${LAST[(index + Math.floor(index / FIRST.length)) % LAST.length]}`;
    return {
      id: String(index + 1),
      name,
      email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
      role: index % 7 === 0 ? 'admin' : 'member',
      joinedAt: new Date(Date.UTC(2026, 0, 5 + index * 9)).toISOString(),
    };
  });

const SORTABLE = ['name', 'email', 'role', 'joinedAt'] as const;

function listMembers(members: Member[], search: URLSearchParams): ApiResponse {
  const page = Math.max(1, Number(search.get('page')) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(search.get('pageSize')) || 10));
  const term = (search.get('search') ?? '').trim().toLowerCase();
  const [field, direction] = (search.get('sort') ?? 'name:asc').split(':');
  const key = SORTABLE.find((each) => each === field) ?? 'name';
  const found = members
    .filter((member) => !term || `${member.name} ${member.email}`.toLowerCase().includes(term))
    .sort((a, b) => (direction === 'desc' ? -1 : 1) * a[key].localeCompare(b[key]));
  return {
    status: 200,
    body: {
      data: found.slice((page - 1) * pageSize, page * pageSize),
      pagination: { page, pageSize, total: found.length, totalPage: Math.ceil(found.length / pageSize) },
    },
  };
}

function addMember(members: Member[], body: unknown): ApiResponse {
  const { name, email, role } = (body ?? {}) as Partial<Record<'name' | 'email' | 'role', string>>;
  if (!name || !email || (role !== 'admin' && role !== 'member'))
    return { status: 400, body: { message: 'Name, email and role are required.' } };
  if (members.some((member) => member.email.toLowerCase() === email.toLowerCase()))
    return { status: 409, body: { message: 'That email is already a member.' } };
  const member: Member = { id: String(members.length + 1), name, email, role: role as MemberRole, joinedAt: new Date().toISOString() };
  members.push(member);
  return { status: 201, body: member };
}

/** A mock backend over `members`: GET /members (page, pageSize, search, sort=field:asc|desc) and POST /members. */
export function createMockMembers(members: Member[] = seed()): (request: ApiRequest) => ApiResponse {
  return ({ method, path, search, body }) => {
    if (path === '/members' && method === 'GET') return listMembers(members, new URLSearchParams(search));
    if (path === '/members' && method === 'POST') return addMember(members, body);
    return { status: 404, body: { message: 'Not found.' } };
  };
}

// Next bundles route handlers and server actions apart, each with its own copy of this module: the members live on
// globalThis so an invite (a server action) shows in the list (the /api route).
const shared = globalThis as typeof globalThis & { rskMockMembers?: Member[] };

/** The app's one mock backend (src/server/api.ts asks it while AUTH_MOCK is on). */
export const mockApi = createMockMembers((shared.rskMockMembers ??= seed()));
