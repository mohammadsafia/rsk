const MOCK_USERS = Array.from({ length: 30 }, (_, i) => ({
  id: `user-${i + 1}`,
  name: `User ${i + 1}`,
}));

function getUsers() {
  return Promise.resolve({ data: { items: MOCK_USERS, totalCount: MOCK_USERS.length } });
}

export const LookupHandler = {
  users: {
    queryKey: 'lookup/users',
    request: getUsers,
  },
} as const;
